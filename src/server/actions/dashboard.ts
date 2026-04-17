"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  AppointmentStatus,
  BillingInterval,
  OnboardingStep,
  PlanCode,
  ProfessionalStatus,
} from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { enqueuePrivacyExport } from "@/server/queues/jobs";
import { generateUniqueBusinessSlug } from "@/server/services/business";
import { getCurrentMembership } from "@/server/services/me";
import { assertProfessionalsLimit, assertServicesLimit, getCurrentSubscription } from "@/server/services/plans";
import {
  cancelMercadoPagoSubscription,
  createMercadoPagoSubscriptionCheckout,
} from "@/server/services/subscriptions";

async function requireMembership() {
  const membership = await getCurrentMembership();

  if (!membership) {
    redirect("/login");
  }

  return membership;
}

async function redirectBackWithError(message: string, fallbackPath: string) {
  const referer = (await headers()).get("referer");

  try {
    const url = new URL(referer ?? fallbackPath);
    url.searchParams.set("error", message);
    redirect(`${url.pathname}${url.search}${url.hash}`);
  } catch {
    redirect(`${fallbackPath}?error=${encodeURIComponent(message)}`);
  }
}

function parseMinutesInput(value: FormDataEntryValue | null, fallback: number) {
  const rawValue = String(value ?? "").trim();

  if (!rawValue) {
    return fallback;
  }

  if (rawValue.includes(":")) {
    const [hoursRaw, minutesRaw] = rawValue.split(":");
    const hours = Number(hoursRaw);
    const minutes = Number(minutesRaw);

    if (
      Number.isFinite(hours) &&
      Number.isFinite(minutes) &&
      hours >= 0 &&
      hours <= 23 &&
      minutes >= 0 &&
      minutes <= 59
    ) {
      return hours * 60 + minutes;
    }
  }

  const numericValue = Number(rawValue);
  return Number.isFinite(numericValue) ? numericValue : fallback;
}

export async function saveBusinessStep(formData: FormData) {
  const membership = await requireMembership();

  const name = String(formData.get("name") ?? "").trim();
  const category = String(formData.get("category") ?? "OTHER").trim() as
    | "HEALTH"
    | "BEAUTY"
    | "EDUCATION"
    | "CONSULTING"
    | "SPORTS"
    | "OTHER";
  const description = String(formData.get("description") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const timezone = String(formData.get("timezone") ?? "America/Sao_Paulo");

  await prisma.business.update({
    where: { id: membership.businessId },
    data: {
      name,
      category,
      description: description || null,
      city: city || null,
      phone: phone || null,
      timezone,
      onboardingStep: OnboardingStep.SERVICES,
    },
  });

  revalidatePath("/dashboard");
  redirect("/onboarding/services");
}

export async function createServiceAction(formData: FormData) {
  try {
    const membership = await requireMembership();
    const subscription = await getCurrentSubscription(membership.businessId);
    await assertServicesLimit(membership.businessId, subscription?.plan.maxServices ?? null);

    const name = String(formData.get("name") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const durationMinutes = Number(formData.get("durationMinutes") ?? 30);
    const priceInReais = Number(formData.get("price") ?? 0);
    const colorHex = String(formData.get("colorHex") ?? "#1664E8");

    await prisma.service.create({
      data: {
        businessId: membership.businessId,
        name,
        slug: await generateUniqueBusinessSlug(`${membership.business.slug}-${name}`),
        description: description || null,
        durationMinutes,
        priceCents: Math.round(priceInReais * 100),
        colorHex,
      },
    });

    if (membership.business.onboardingStep === OnboardingStep.SERVICES) {
      await prisma.business.update({
        where: { id: membership.businessId },
        data: { onboardingStep: OnboardingStep.AVAILABILITY },
      });
    }

    revalidatePath("/dashboard/servicos");
    revalidatePath("/onboarding/services");
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Não foi possível salvar o serviço.";
    await redirectBackWithError(message, "/onboarding/services");
  }
}

export async function continueToAvailabilityAction() {
  try {
    const membership = await requireMembership();

    const servicesCount = await prisma.service.count({
      where: {
        businessId: membership.businessId,
        deletedAt: null,
      },
    });

    if (!servicesCount) {
      await redirectBackWithError(
        "Cadastre pelo menos um serviço antes de continuar.",
        "/onboarding/services",
      );
    }

    if (membership.business.onboardingStep === OnboardingStep.SERVICES) {
      await prisma.business.update({
        where: { id: membership.businessId },
        data: { onboardingStep: OnboardingStep.AVAILABILITY },
      });
    }

    redirect("/onboarding/availability");
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Não foi possível continuar para disponibilidade.";
    await redirectBackWithError(message, "/onboarding/services");
  }
}

export async function createProfessionalAction(formData: FormData) {
  const membership = await requireMembership();
  const subscription = await getCurrentSubscription(membership.businessId);
  await assertProfessionalsLimit(membership.businessId, subscription?.plan.maxProfessionals ?? null);

  const displayName = String(formData.get("displayName") ?? "").trim();
  const roleLabel = String(formData.get("roleLabel") ?? "").trim();
  const photoUrl = String(formData.get("photoUrl") ?? "").trim();
  const serviceIds = formData
    .getAll("serviceIds")
    .map((value) => String(value))
    .filter(Boolean);

  const professional = await prisma.professional.create({
    data: {
      businessId: membership.businessId,
      displayName,
      roleLabel: roleLabel || null,
      photoUrl: photoUrl || null,
      slug: await generateUniqueBusinessSlug(`${membership.business.slug}-${displayName}`),
    },
  });

  if (serviceIds.length) {
    await prisma.professionalService.createMany({
      data: serviceIds.map((serviceId) => ({
        businessId: membership.businessId,
        professionalId: professional.id,
        serviceId,
      })),
      skipDuplicates: true,
    });
  }

  revalidatePath("/dashboard/profissionais");
}

export async function toggleServiceStatusAction(formData: FormData) {
  const membership = await requireMembership();
  const serviceId = String(formData.get("serviceId") ?? "");

  const service = await prisma.service.findFirst({
    where: {
      id: serviceId,
      businessId: membership.businessId,
      deletedAt: null,
    },
    select: {
      id: true,
      isActive: true,
    },
  });

  if (!service) {
    throw new Error("Serviço não encontrado.");
  }

  await prisma.service.update({
    where: { id: service.id },
    data: {
      isActive: !service.isActive,
    },
  });

  revalidatePath("/dashboard/servicos");
}

export async function toggleProfessionalStatusAction(formData: FormData) {
  const membership = await requireMembership();
  const professionalId = String(formData.get("professionalId") ?? "");

  const professional = await prisma.professional.findFirst({
    where: {
      id: professionalId,
      businessId: membership.businessId,
      deletedAt: null,
    },
    select: {
      id: true,
      status: true,
    },
  });

  if (!professional) {
    throw new Error("Profissional não encontrado.");
  }

  await prisma.professional.update({
    where: { id: professional.id },
    data: {
      status:
        professional.status === ProfessionalStatus.ACTIVE
          ? ProfessionalStatus.INACTIVE
          : ProfessionalStatus.ACTIVE,
      acceptsOnlineBookings: professional.status !== ProfessionalStatus.ACTIVE,
    },
  });

  revalidatePath("/dashboard/profissionais");
}

export async function saveAvailabilityStep(formData: FormData) {
  const membership = await requireMembership();
  const professionalId = String(formData.get("professionalId") ?? "");
  const dayOfWeek = Number(formData.get("dayOfWeek") ?? 1);
  const startMinutes = parseMinutesInput(formData.get("startMinutes"), 540);
  const endMinutes = parseMinutesInput(formData.get("endMinutes"), 1080);
  const slotIntervalMinutes = Number(formData.get("slotIntervalMinutes") ?? 30);

  await prisma.availability.create({
    data: {
      businessId: membership.businessId,
      professionalId,
      dayOfWeek,
      startMinutes,
      endMinutes,
      slotIntervalMinutes,
    },
  });

  await prisma.business.update({
    where: { id: membership.businessId },
    data: { onboardingStep: OnboardingStep.LINK },
  });

  revalidatePath("/dashboard/agenda");
  redirect("/onboarding/link");
}

export async function createAvailabilityAction(formData: FormData) {
  const membership = await requireMembership();
  const professionalId = String(formData.get("professionalId") ?? "");
  const dayOfWeek = Number(formData.get("dayOfWeek") ?? 0);
  const startMinutes = parseMinutesInput(formData.get("startMinutes"), 540);
  const endMinutes = parseMinutesInput(formData.get("endMinutes"), 1080);
  const slotIntervalMinutes = Number(formData.get("slotIntervalMinutes") ?? 30);
  const capacity = Number(formData.get("capacity") ?? 1);

  await prisma.availability.create({
    data: {
      businessId: membership.businessId,
      professionalId,
      dayOfWeek,
      startMinutes,
      endMinutes,
      slotIntervalMinutes,
      capacity,
    },
  });

  revalidatePath("/dashboard/disponibilidade");
}

export async function deleteAvailabilityAction(formData: FormData) {
  const membership = await requireMembership();
  const availabilityId = String(formData.get("availabilityId") ?? "");

  await prisma.availability.deleteMany({
    where: {
      id: availabilityId,
      businessId: membership.businessId,
    },
  });

  revalidatePath("/dashboard/disponibilidade");
}

export async function saveBusinessSettingsAction(formData: FormData) {
  const membership = await requireMembership();

  await prisma.business.update({
    where: { id: membership.businessId },
    data: {
      bookingTitle: String(formData.get("bookingTitle") ?? "").trim() || null,
      description: String(formData.get("description") ?? "").trim() || null,
      phone: String(formData.get("phone") ?? "").trim() || null,
      logoUrl: String(formData.get("logoUrl") ?? "").trim() || null,
      coverImageUrl: String(formData.get("coverImageUrl") ?? "").trim() || null,
      cancellationPolicyText: String(formData.get("cancellationPolicyText") ?? "").trim() || null,
      minimumLeadTimeMinutes: Number(formData.get("minimumLeadTimeMinutes") ?? 60),
      cancellationNoticeMinutes: Number(formData.get("cancellationNoticeMinutes") ?? 120),
      brandPrimaryColor: String(formData.get("brandPrimaryColor") ?? "").trim() || "#1664E8",
      brandSecondaryColor: String(formData.get("brandSecondaryColor") ?? "").trim() || "#1254C7",
    },
  });

  revalidatePath("/dashboard/configuracoes");
}

export async function publishBookingLinkAction() {
  const membership = await requireMembership();

  await prisma.business.update({
    where: { id: membership.businessId },
    data: {
      publicBookingEnabled: true,
      status: "ACTIVE",
      onboardingStep: OnboardingStep.COMPLETED,
      onboardingCompletedAt: new Date(),
    },
  });

  revalidatePath("/dashboard");
  redirect("/onboarding/completed");
}

export async function requestAggregatedExportAction() {
  const membership = await requireMembership();

  const exportRecord = await prisma.dataExport.create({
    data: {
      businessId: membership.businessId,
      requestedByUserId: membership.userId,
      format: "JSON",
      scope: "AGGREGATED",
    },
  });

  await enqueuePrivacyExport(exportRecord.id);
  revalidatePath("/dashboard/relatorios");
}

export async function requestFullExportAction() {
  const membership = await requireMembership();
  const subscription = await getCurrentSubscription(membership.businessId);

  if (!subscription?.plan.fullDataExportEnabled) {
    throw new Error("Seu plano atual não permite exportação completa.");
  }

  const exportRecord = await prisma.dataExport.create({
    data: {
      businessId: membership.businessId,
      requestedByUserId: membership.userId,
      format: "JSON",
      scope: "FULL_CUSTOMERS",
    },
  });

  await enqueuePrivacyExport(exportRecord.id);
  revalidatePath("/dashboard/relatorios");
}

export async function startSubscriptionCheckoutAction(formData: FormData) {
  const membership = await requireMembership();

  const planCode = String(formData.get("planCode") ?? "").trim() as PlanCode;
  const interval = String(formData.get("interval") ?? "MONTHLY").trim() as BillingInterval;

  const user = await prisma.user.findUnique({
    where: { id: membership.userId },
    select: { email: true },
  });

  if (!user?.email) {
    throw new Error("Usuário sem e-mail válido para criar assinatura.");
  }

  const preapproval = await createMercadoPagoSubscriptionCheckout({
    businessId: membership.businessId,
    payerEmail: user.email,
    planCode,
    interval,
    reason: `${planCode} - ${membership.business.name}`,
    backUrl: `${process.env.APP_URL ?? "http://localhost:3000"}/dashboard/billing`,
  });

  redirect(preapproval.init_point ?? "/dashboard/billing");
}

export async function cancelSubscriptionAction() {
  const membership = await requireMembership();
  const subscription = await getCurrentSubscription(membership.businessId);

  if (!subscription?.providerSubscriptionId) {
    throw new Error("Não existe assinatura ativa para cancelar.");
  }

  await cancelMercadoPagoSubscription(subscription.providerSubscriptionId);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/billing");
}

export async function updateAppointmentStatusAction(formData: FormData) {
  const membership = await requireMembership();
  const appointmentId = String(formData.get("appointmentId") ?? "");
  const status = String(formData.get("status") ?? "").trim() as AppointmentStatus;

  const appointment = await prisma.appointment.findFirst({
    where: {
      id: appointmentId,
      businessId: membership.businessId,
    },
    select: {
      id: true,
      status: true,
      startsAtUtc: true,
      completedAt: true,
      cancelledAt: true,
      noShowMarkedAt: true,
    },
  });

  if (!appointment) {
    throw new Error("Agendamento não encontrado.");
  }

  await prisma.appointment.update({
    where: { id: appointment.id },
    data: {
      status,
      completedAt: status === AppointmentStatus.COMPLETED ? new Date() : null,
      cancelledAt: status === AppointmentStatus.CANCELLED ? new Date() : null,
      noShowMarkedAt: status === AppointmentStatus.NO_SHOW ? new Date() : null,
    },
  });

  await prisma.appointmentStatusHistory.create({
    data: {
      appointmentId: appointment.id,
      fromStatus: appointment.status,
      toStatus: status,
      changedByUserId: membership.userId,
      note: "Status atualizado pelo dashboard.",
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/agenda");
  revalidatePath("/dashboard/clientes");
}

export async function requestCustomerDeletionAction(formData: FormData) {
  const membership = await requireMembership();
  const customerId = String(formData.get("customerId") ?? "");

  const customer = await prisma.customer.findFirst({
    where: {
      id: customerId,
      businessId: membership.businessId,
      deletedAt: null,
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
    },
  });

  if (!customer) {
    throw new Error("Cliente não encontrado.");
  }

  await prisma.privacyRequest.create({
    data: {
      businessId: membership.businessId,
      customerId: customer.id,
      type: "DELETE",
      requesterName: customer.fullName,
      requesterEmail: customer.email,
      requesterPhone: customer.phone,
      note: "Solicitação criada pelo dashboard.",
    },
  });

  revalidatePath("/dashboard/clientes");
}
