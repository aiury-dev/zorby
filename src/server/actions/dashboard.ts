"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  AppointmentStatus,
  BillingInterval,
  OnboardingStep,
  PlanCode,
  ProfessionalStatus,
} from "@/lib/domain-enums";
import { enqueuePrivacyExport } from "@/server/queues/jobs";
import {
  geocodeBusinessAddress,
  generateUniqueBusinessSlug,
  hasCompleteBusinessAddress,
} from "@/server/services/business";
import {
  getAppointmentsForBusinessFromFirestore,
  getCustomerByIdFromFirestore,
  getUserByIdFromFirestore,
} from "@/server/services/firestore-read";
import {
  deleteAvailabilityDocument,
  syncAvailabilityDocument,
  syncAppointmentDocument,
  syncAppointmentStatusHistoryDocument,
  syncBusinessDocument,
  syncDataExportDocument,
  syncPrivacyRequestDocument,
  syncProfessionalDocument,
  syncProfessionalServiceDocuments,
  syncServiceDocument,
} from "@/server/services/firebase-sync";
import { getCurrentMembership } from "@/server/services/me";
import {
  getBusinessSettings,
  getProfessionalsForBusiness,
  getServicesForBusiness,
} from "@/server/services/business";
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
  const addressLine1 = String(formData.get("addressLine1") ?? "").trim();
  const addressLine2 = String(formData.get("addressLine2") ?? "").trim();
  const neighborhood = String(formData.get("neighborhood") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const state = String(formData.get("state") ?? "").trim();
  const postalCode = String(formData.get("postalCode") ?? "").trim();
  const country = String(formData.get("country") ?? "BR").trim().toUpperCase() || "BR";
  const phone = String(formData.get("phone") ?? "").trim();
  const timezone = String(formData.get("timezone") ?? "America/Sao_Paulo");

  if (
    !hasCompleteBusinessAddress({
      addressLine1,
      neighborhood,
      city,
      state,
      postalCode,
      country,
    })
  ) {
    await redirectBackWithError(
      "Preencha o endereço completo do negócio para aparecer no agendamento por proximidade.",
      "/onboarding/business",
    );
  }

  const geocoded = await geocodeBusinessAddress({
    addressLine1,
    addressLine2,
    neighborhood,
    city,
    state,
    postalCode,
    country,
  });

  await syncBusinessDocument({
    id: membership.businessId,
    name,
    slug: membership.business.slug,
    category,
    status: membership.business.status,
    description: description || null,
    addressLine1: addressLine1 || null,
    addressLine2: addressLine2 || null,
    neighborhood: neighborhood || null,
    city: city || null,
    state: state || null,
    postalCode: postalCode || null,
    country,
    phone: phone || null,
    timezone,
    latitude: geocoded?.latitude ?? null,
    longitude: geocoded?.longitude ?? null,
    onboardingStep: OnboardingStep.SERVICES,
    publicBookingEnabled: membership.business.publicBookingEnabled,
    publicBookingPaused: membership.business.publicBookingPaused,
  }).catch(() => undefined);

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

    const service = {
      id: randomUUID(),
      businessId: membership.businessId,
      name,
      slug: await generateUniqueBusinessSlug(`${membership.business.slug}-${name}`),
      description: description || null,
      durationMinutes,
      bufferAfterMinutes: 0,
      priceCents: Math.round(priceInReais * 100),
      colorHex,
      isActive: true,
      sortOrder: 0,
      prepaymentMode: "NONE" as const,
      prepaymentAmountCents: null,
    };

    await syncServiceDocument({
      id: service.id,
      businessId: service.businessId,
      name: service.name,
      slug: service.slug,
      description: service.description,
      durationMinutes: service.durationMinutes,
      bufferAfterMinutes: service.bufferAfterMinutes,
      priceCents: service.priceCents,
      colorHex: service.colorHex,
      isActive: service.isActive,
      sortOrder: service.sortOrder,
      prepaymentMode: service.prepaymentMode,
      prepaymentAmountCents: service.prepaymentAmountCents,
    }).catch(() => undefined);

    if (membership.business.onboardingStep === OnboardingStep.SERVICES) {
      await syncBusinessDocument({
        id: membership.businessId,
        name: membership.business.name,
        slug: membership.business.slug,
        category: membership.business.category,
        status: membership.business.status,
        onboardingStep: OnboardingStep.AVAILABILITY,
        publicBookingEnabled: membership.business.publicBookingEnabled,
        publicBookingPaused: membership.business.publicBookingPaused,
        timezone: membership.business.timezone,
        indexable: membership.business.indexable,
      }).catch(() => undefined);
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

    const servicesCount = (await getServicesForBusiness(membership.businessId)).length;

    if (!servicesCount) {
      await redirectBackWithError(
        "Cadastre pelo menos um serviço antes de continuar.",
        "/onboarding/services",
      );
    }

    if (membership.business.onboardingStep === OnboardingStep.SERVICES) {
      await syncBusinessDocument({
        id: membership.businessId,
        name: membership.business.name,
        slug: membership.business.slug,
        category: membership.business.category,
        status: membership.business.status,
        onboardingStep: OnboardingStep.AVAILABILITY,
        publicBookingEnabled: membership.business.publicBookingEnabled,
        publicBookingPaused: membership.business.publicBookingPaused,
        timezone: membership.business.timezone,
        indexable: membership.business.indexable,
      }).catch(() => undefined);
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

  const professional = {
    id: randomUUID(),
    businessId: membership.businessId,
    displayName,
    publicDisplayName: null,
    roleLabel: roleLabel || null,
    photoUrl: photoUrl || null,
    slug: await generateUniqueBusinessSlug(`${membership.business.slug}-${displayName}`),
    email: null,
    phone: null,
    bio: null,
    status: ProfessionalStatus.ACTIVE,
    acceptsOnlineBookings: true,
    sortOrder: 0,
  };

  await syncProfessionalDocument({
    id: professional.id,
    businessId: professional.businessId,
    displayName: professional.displayName,
    publicDisplayName: professional.publicDisplayName,
    roleLabel: professional.roleLabel,
    slug: professional.slug,
    email: professional.email,
    phone: professional.phone,
    bio: professional.bio,
    photoUrl: professional.photoUrl,
    status: professional.status,
    acceptsOnlineBookings: professional.acceptsOnlineBookings,
    sortOrder: professional.sortOrder,
    serviceIds,
  }).catch(() => undefined);

  await syncProfessionalServiceDocuments({
    businessId: membership.businessId,
    professionalId: professional.id,
    serviceIds,
  }).catch(() => undefined);

  revalidatePath("/dashboard/profissionais");
}

export async function toggleServiceStatusAction(formData: FormData) {
  const membership = await requireMembership();
  const serviceId = String(formData.get("serviceId") ?? "");

  const service = (await getServicesForBusiness(membership.businessId)).find(
    (item) => item.id === serviceId,
  );

  if (!service) {
    throw new Error("Serviço não encontrado.");
  }

  await syncServiceDocument({
    id: service.id,
    businessId: service.businessId,
    name: service.name,
    slug: service.slug,
    description: service.description,
    durationMinutes: service.durationMinutes,
    bufferAfterMinutes: service.bufferAfterMinutes,
    priceCents: service.priceCents,
    colorHex: service.colorHex,
    isActive: !service.isActive,
    sortOrder: service.sortOrder,
    prepaymentMode: service.prepaymentMode,
    prepaymentAmountCents: service.prepaymentAmountCents,
  }).catch(() => undefined);

  revalidatePath("/dashboard/servicos");
}

export async function toggleProfessionalStatusAction(formData: FormData) {
  const membership = await requireMembership();
  const professionalId = String(formData.get("professionalId") ?? "");

  const professional = (await getProfessionalsForBusiness(membership.businessId)).find(
    (item) => item.id === professionalId,
  );

  if (!professional) {
    throw new Error("Profissional não encontrado.");
  }

  const nextStatus =
    professional.status === ProfessionalStatus.ACTIVE
      ? ProfessionalStatus.INACTIVE
      : ProfessionalStatus.ACTIVE;

  await syncProfessionalDocument({
    id: professional.id,
    businessId: professional.businessId,
    displayName: professional.displayName,
    publicDisplayName: professional.publicDisplayName,
    roleLabel: professional.roleLabel,
    slug: professional.slug,
    email: professional.email,
    phone: professional.phone,
    bio: professional.bio,
    photoUrl: professional.photoUrl,
    status: nextStatus,
    acceptsOnlineBookings: professional.status !== ProfessionalStatus.ACTIVE,
    sortOrder: professional.sortOrder,
    serviceIds: professional.services.map((item) => item.serviceId),
  }).catch(() => undefined);

  revalidatePath("/dashboard/profissionais");
}

export async function saveAvailabilityStep(formData: FormData) {
  const membership = await requireMembership();
  const professionalId = String(formData.get("professionalId") ?? "");
  const dayOfWeek = Number(formData.get("dayOfWeek") ?? 1);
  const startMinutes = parseMinutesInput(formData.get("startMinutes"), 540);
  const endMinutes = parseMinutesInput(formData.get("endMinutes"), 1080);
  const slotIntervalMinutes = Number(formData.get("slotIntervalMinutes") ?? 30);

  const availability = {
    id: randomUUID(),
    businessId: membership.businessId,
    professionalId,
    dayOfWeek,
    startMinutes,
    endMinutes,
    slotIntervalMinutes,
    capacity: 1,
    isActive: true,
  };

  await syncAvailabilityDocument({
    id: availability.id,
    businessId: availability.businessId,
    professionalId: availability.professionalId,
    dayOfWeek: availability.dayOfWeek,
    startMinutes: availability.startMinutes,
    endMinutes: availability.endMinutes,
    slotIntervalMinutes: availability.slotIntervalMinutes,
    capacity: availability.capacity,
    isActive: availability.isActive,
  }).catch(() => undefined);

  await syncBusinessDocument({
    id: membership.businessId,
    name: membership.business.name,
    slug: membership.business.slug,
    category: membership.business.category,
    status: membership.business.status,
    onboardingStep: OnboardingStep.LINK,
    publicBookingEnabled: membership.business.publicBookingEnabled,
    publicBookingPaused: membership.business.publicBookingPaused,
    timezone: membership.business.timezone,
  }).catch(() => undefined);

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

  const availability = {
    id: randomUUID(),
    businessId: membership.businessId,
    professionalId,
    dayOfWeek,
    startMinutes,
    endMinutes,
    slotIntervalMinutes,
    capacity,
    isActive: true,
  };

  await syncAvailabilityDocument({
    id: availability.id,
    businessId: availability.businessId,
    professionalId: availability.professionalId,
    dayOfWeek: availability.dayOfWeek,
    startMinutes: availability.startMinutes,
    endMinutes: availability.endMinutes,
    slotIntervalMinutes: availability.slotIntervalMinutes,
    capacity: availability.capacity,
    isActive: availability.isActive,
  }).catch(() => undefined);

  revalidatePath("/dashboard/disponibilidade");
}

export async function deleteAvailabilityAction(formData: FormData) {
  const membership = await requireMembership();
  const availabilityId = String(formData.get("availabilityId") ?? "");

  await deleteAvailabilityDocument(availabilityId);

  revalidatePath("/dashboard/disponibilidade");
}

export async function saveBusinessSettingsAction(formData: FormData) {
  const membership = await requireMembership();
  const addressLine1 = String(formData.get("addressLine1") ?? "").trim();
  const addressLine2 = String(formData.get("addressLine2") ?? "").trim();
  const neighborhood = String(formData.get("neighborhood") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const state = String(formData.get("state") ?? "").trim();
  const postalCode = String(formData.get("postalCode") ?? "").trim();
  const country = String(formData.get("country") ?? "BR").trim().toUpperCase() || "BR";
  const geocoded = await geocodeBusinessAddress({
    addressLine1,
    addressLine2,
    neighborhood,
    city,
    state,
    postalCode,
    country,
  });

  await syncBusinessDocument({
    id: membership.businessId,
    name: membership.business.name,
    slug: membership.business.slug,
    category: membership.business.category,
    status: membership.business.status,
    bookingTitle: String(formData.get("bookingTitle") ?? "").trim() || null,
    description: String(formData.get("description") ?? "").trim() || null,
    phone: String(formData.get("phone") ?? "").trim() || null,
    addressLine1: addressLine1 || null,
    addressLine2: addressLine2 || null,
    neighborhood: neighborhood || null,
    city: city || null,
    state: state || null,
    postalCode: postalCode || null,
    country,
    latitude: geocoded?.latitude ?? null,
    longitude: geocoded?.longitude ?? null,
    logoUrl: String(formData.get("logoUrl") ?? "").trim() || null,
    coverImageUrl: String(formData.get("coverImageUrl") ?? "").trim() || null,
    cancellationPolicyText: String(formData.get("cancellationPolicyText") ?? "").trim() || null,
    cancellationNoticeMinutes: Number(formData.get("cancellationNoticeMinutes") ?? 120),
    minimumLeadTimeMinutes: Number(formData.get("minimumLeadTimeMinutes") ?? 60),
    brandPrimaryColor: String(formData.get("brandPrimaryColor") ?? "").trim() || "#1664E8",
    brandSecondaryColor: String(formData.get("brandSecondaryColor") ?? "").trim() || "#1254C7",
    publicBookingEnabled: membership.business.publicBookingEnabled,
    publicBookingPaused: membership.business.publicBookingPaused,
    onboardingStep: membership.business.onboardingStep,
    timezone: membership.business.timezone,
    indexable: membership.business.indexable,
  }).catch(() => undefined);

  revalidatePath("/dashboard/configuracoes");
}

export async function publishBookingLinkAction() {
  const membership = await requireMembership();
  const business = await getBusinessSettings(membership.businessId);

  if (!business) {
    await redirectBackWithError("Não encontramos o negócio para publicar a página.", "/onboarding/link");
    return;
  }

  if (!hasCompleteBusinessAddress(business)) {
    await redirectBackWithError(
      "Preencha o endereço completo antes de publicar. Isso permite exibir seu negócio por proximidade.",
      "/onboarding/link",
    );
  }

  const geocoded =
    business.latitude && business.longitude
      ? null
      : await geocodeBusinessAddress({
          addressLine1: business.addressLine1,
          addressLine2: business.addressLine2,
          neighborhood: business.neighborhood,
          city: business.city,
          state: business.state,
          postalCode: business.postalCode,
          country: business.country,
        });

  await syncBusinessDocument({
    id: membership.businessId,
    name: membership.business.name,
    slug: membership.business.slug,
    category: membership.business.category,
    status: "ACTIVE",
    publicBookingEnabled: true,
    publicBookingPaused: false,
    onboardingStep: OnboardingStep.COMPLETED,
    timezone: membership.business.timezone,
    latitude: geocoded?.latitude ?? (business.latitude ? Number(business.latitude) : null),
    longitude: geocoded?.longitude ?? (business.longitude ? Number(business.longitude) : null),
    addressLine1: business.addressLine1,
    addressLine2: business.addressLine2,
    neighborhood: business.neighborhood,
    city: business.city,
    state: business.state,
    postalCode: business.postalCode,
    country: business.country,
  }).catch(() => undefined);

  revalidatePath("/dashboard");
  redirect("/onboarding/completed");
}

export async function requestAggregatedExportAction() {
  const membership = await requireMembership();

  const exportRecord = {
    id: randomUUID(),
    businessId: membership.businessId,
    requestedByUserId: membership.userId,
    format: "JSON",
    scope: "AGGREGATED",
  };

  await syncDataExportDocument(exportRecord).catch(() => undefined);

  await enqueuePrivacyExport(exportRecord.id);
  revalidatePath("/dashboard/relatorios");
}

export async function requestFullExportAction() {
  const membership = await requireMembership();
  const subscription = await getCurrentSubscription(membership.businessId);

  if (!subscription?.plan.fullDataExportEnabled) {
    throw new Error("Seu plano atual não permite exportação completa.");
  }

  const exportRecord = {
    id: randomUUID(),
    businessId: membership.businessId,
    requestedByUserId: membership.userId,
    format: "JSON",
    scope: "FULL_CUSTOMERS",
  };

  await syncDataExportDocument(exportRecord).catch(() => undefined);

  await enqueuePrivacyExport(exportRecord.id);
  revalidatePath("/dashboard/relatorios");
}

export async function startSubscriptionCheckoutAction(formData: FormData) {
  const membership = await requireMembership();

  const planCode = String(formData.get("planCode") ?? "").trim() as PlanCode;
  const interval = String(formData.get("interval") ?? "MONTHLY").trim() as BillingInterval;

  const user = await getUserByIdFromFirestore(membership.userId);

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

  const appointment = (await getAppointmentsForBusinessFromFirestore(membership.businessId)).find(
    (item) => item.id === appointmentId,
  );

  if (!appointment) {
    throw new Error("Agendamento não encontrado.");
  }

  await syncAppointmentDocument({
    id: appointment.id,
    businessId: membership.businessId,
    professionalId: appointment.professionalId,
    serviceId: appointment.serviceId,
    serviceVariantId: appointment.serviceVariantId,
    customerId: appointment.customerId,
    status,
    startsAtUtc: appointment.startsAtUtc.toISOString(),
    endsAtUtc: appointment.endsAtUtc.toISOString(),
    timezoneSnapshot: appointment.timezoneSnapshot,
    customerTimezone: appointment.customerTimezone,
    customerNameSnapshot: appointment.customerNameSnapshot,
    customerEmailSnapshot: appointment.customerEmailSnapshot,
    customerPhoneSnapshot: appointment.customerPhoneSnapshot,
    serviceNameSnapshot: appointment.serviceNameSnapshot,
    serviceVariantSnapshot: appointment.serviceVariantSnapshot,
    priceCents: appointment.priceCents,
    cancelledAt:
      status === AppointmentStatus.CANCELLED ? new Date().toISOString() : appointment.cancelledAt?.toISOString() ?? null,
    completedAt:
      status === AppointmentStatus.COMPLETED ? new Date().toISOString() : appointment.completedAt?.toISOString() ?? null,
    noShowMarkedAt:
      status === AppointmentStatus.NO_SHOW ? new Date().toISOString() : appointment.noShowMarkedAt?.toISOString() ?? null,
  }).catch(() => undefined);

  await syncAppointmentStatusHistoryDocument({
    id: randomUUID(),
    appointmentId: appointment.id,
    fromStatus: appointment.status as AppointmentStatus,
    toStatus: status,
    changedByUserId: membership.userId,
    note: "Status atualizado pelo dashboard.",
  }).catch(() => undefined);

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/agenda");
  revalidatePath("/dashboard/clientes");
}

export async function requestCustomerDeletionAction(formData: FormData) {
  const membership = await requireMembership();
  const customerId = String(formData.get("customerId") ?? "");

  const customer = await getCustomerByIdFromFirestore({
    businessId: membership.businessId,
    customerId,
  });

  if (!customer) {
    throw new Error("Cliente não encontrado.");
  }

  await syncPrivacyRequestDocument({
    id: randomUUID(),
    businessId: membership.businessId,
    customerId: customer.id,
    type: "DELETE",
    requesterName: customer.fullName,
    requesterEmail: customer.email,
    requesterPhone: customer.phone,
    note: "Solicitação criada pelo dashboard.",
  }).catch(() => undefined);

  revalidatePath("/dashboard/clientes");
}
