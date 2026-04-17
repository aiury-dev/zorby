import { addMinutes, isBefore, parseISO } from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { NotificationType } from "@/generated/prisma/enums";
import { getRedis } from "@/lib/redis";
import { createOpaqueToken, hashOpaqueToken } from "@/lib/tokens";
import { prisma } from "@/lib/prisma";
import { getPublicBusinessBySlug } from "@/server/services/business";
import { assertBusinessCanReceiveBookings, assertMonthlyBookingLimit } from "@/server/services/plans";
import {
  enqueueAppointmentLifecycleNotification,
  enqueueAppointmentNotifications,
} from "@/server/queues/jobs";

type AvailabilitySlot = {
  startsAt: string;
  endsAt: string;
  label: string;
};

type BookingContext = Awaited<ReturnType<typeof getPublicBusinessBySlug>>;

function availabilityCacheKey(input: {
  slug: string;
  date: string;
  serviceId?: string;
  professionalId?: string;
  timezone: string;
}) {
  return `availability:${input.slug}:${input.date}:${input.serviceId ?? "all"}:${input.professionalId ?? "all"}:${input.timezone}`;
}

export function intervalsOverlap(
  first: { startsAtUtc: Date; endsAtUtc: Date },
  second: { startsAtUtc: Date; endsAtUtc: Date },
) {
  return first.startsAtUtc < second.endsAtUtc && second.startsAtUtc < first.endsAtUtc;
}

export function generateSlots(input: {
  date: string;
  timezone: string;
  durationMinutes: number;
  availabilities: Array<{
    startMinutes: number;
    endMinutes: number;
    slotIntervalMinutes: number;
  }>;
  blockedIntervals: Array<{ startsAtUtc: Date; endsAtUtc: Date }>;
  occupiedIntervals: Array<{ startsAtUtc: Date; endsAtUtc: Date }>;
}) {
  const slots: AvailabilitySlot[] = [];

  for (const availability of input.availabilities) {
    for (
      let cursor = availability.startMinutes;
      cursor + input.durationMinutes <= availability.endMinutes;
      cursor += availability.slotIntervalMinutes
    ) {
      const startsAtUtc = fromZonedTime(
        `${input.date}T${String(Math.floor(cursor / 60)).padStart(2, "0")}:${String(cursor % 60).padStart(2, "0")}:00`,
        input.timezone,
      );

      const endsAtUtc = addMinutes(startsAtUtc, input.durationMinutes);

      const candidate = { startsAtUtc, endsAtUtc };
      const isBlocked =
        input.blockedIntervals.some((interval) => intervalsOverlap(candidate, interval)) ||
        input.occupiedIntervals.some((interval) => intervalsOverlap(candidate, interval));

      if (isBlocked || isBefore(startsAtUtc, new Date())) {
        continue;
      }

      slots.push({
        startsAt: startsAtUtc.toISOString(),
        endsAt: endsAtUtc.toISOString(),
        label: formatInTimeZone(startsAtUtc, input.timezone, "HH:mm"),
      });
    }
  }

  return slots;
}

async function getBusinessContextOrThrow(slug: string) {
  const business = await getPublicBusinessBySlug(slug);

  if (!business) {
    throw new Error("Profissional nao encontrado.");
  }

  if (!business.publicBookingEnabled || business.publicBookingPaused) {
    throw new Error("Este profissional esta temporariamente indisponivel para novos agendamentos.");
  }

  await assertBusinessCanReceiveBookings(business.id);

  return business;
}

async function getServiceSelection(context: NonNullable<BookingContext>, input: { serviceId: string; serviceVariantId?: string }) {
  const service = context.services.find((item) => item.id === input.serviceId);

  if (!service) {
    throw new Error("Servico nao encontrado.");
  }

  const variant = input.serviceVariantId
    ? service.variants.find((item) => item.id === input.serviceVariantId)
    : undefined;

  return {
    service,
    variant,
    durationMinutes: variant?.durationMinutes ?? service.durationMinutes,
    priceCents: variant?.priceCents ?? service.priceCents,
    prepaymentMode: variant?.prepaymentMode ?? service.prepaymentMode,
    prepaymentAmountCents: variant?.prepaymentAmountCents ?? service.prepaymentAmountCents,
    serviceLabel: variant ? `${service.name} - ${variant.name}` : service.name,
  };
}

function toDayBounds(date: string, timezone: string) {
  const startsAtUtc = fromZonedTime(`${date}T00:00:00`, timezone);
  const endsAtUtc = addMinutes(startsAtUtc, 24 * 60);
  return { startsAtUtc, endsAtUtc };
}

function computeDayOfWeek(date: string, timezone: string) {
  return Number(formatInTimeZone(fromZonedTime(`${date}T12:00:00`, timezone), timezone, "i")) - 1;
}

async function loadOccupiedIntervals(input: {
  businessId: string;
  professionalId: string;
  date: string;
  timezone: string;
}) {
  const { startsAtUtc, endsAtUtc } = toDayBounds(input.date, input.timezone);

  const [appointments, blocks] = await Promise.all([
    prisma.appointment.findMany({
      where: {
        businessId: input.businessId,
        professionalId: input.professionalId,
        status: { in: ["PENDING", "CONFIRMED"] },
        startsAtUtc: { gte: startsAtUtc, lt: endsAtUtc },
      },
      select: {
        startsAtUtc: true,
        endsAtUtc: true,
      },
    }),
    prisma.availabilityBlock.findMany({
      where: {
        businessId: input.businessId,
        OR: [{ professionalId: input.professionalId }, { professionalId: null }],
        startsAtUtc: { lt: endsAtUtc },
        endsAtUtc: { gt: startsAtUtc },
      },
      select: {
        startsAtUtc: true,
        endsAtUtc: true,
      },
    }),
  ]);

  return { appointments, blocks };
}

export async function getAvailabilityForPublicBooking(input: {
  slug: string;
  date: string;
  timezone: string;
  serviceId: string;
  professionalId: string;
}) {
  const redis = getRedis();
  const key = availabilityCacheKey(input);

  if (redis) {
    const cached = await redis.get<AvailabilitySlot[]>(key);
    if (cached) {
      return cached;
    }
  }

  const business = await getBusinessContextOrThrow(input.slug);
  const professional = business.professionals.find((item) => item.id === input.professionalId);

  if (!professional) {
    throw new Error("Profissional nao encontrado.");
  }

  const serviceSelection = await getServiceSelection(business, {
    serviceId: input.serviceId,
  });

  const dayOfWeek = computeDayOfWeek(input.date, business.timezone);
  const availabilities = await prisma.availability.findMany({
    where: {
      businessId: business.id,
      professionalId: input.professionalId,
      isActive: true,
      dayOfWeek,
    },
    select: {
      startMinutes: true,
      endMinutes: true,
      slotIntervalMinutes: true,
    },
    orderBy: { startMinutes: "asc" },
  });

  const { appointments, blocks } = await loadOccupiedIntervals({
    businessId: business.id,
    professionalId: input.professionalId,
    date: input.date,
    timezone: business.timezone,
  });

  const slots = generateSlots({
    date: input.date,
    timezone: business.timezone,
    durationMinutes: serviceSelection.durationMinutes + serviceSelection.service.bufferAfterMinutes,
    availabilities,
    blockedIntervals: blocks,
    occupiedIntervals: appointments,
  });

  if (redis) {
    await redis.set(key, slots, { ex: 30 });
  }

  return slots;
}

async function invalidateAvailabilityCache(input: {
  slug: string;
  date: string;
  serviceId?: string;
  professionalId?: string;
  timezone: string;
}) {
  const redis = getRedis();
  if (!redis) {
    return;
  }

  const patterns = [
    availabilityCacheKey(input),
    availabilityCacheKey({ ...input, serviceId: undefined }),
  ];

  await Promise.all(patterns.map((key) => redis.del(key)));
}

function advisoryLockKey(input: { businessId: string; professionalId: string; date: string }) {
  return `${input.businessId}:${input.professionalId}:${input.date}`;
}

function buildPublicActionUrl(path: string) {
  const baseUrl = process.env.APP_URL ?? "http://localhost:3000";
  return new URL(path, baseUrl).toString();
}

export async function createAccessTokensForAppointment(input: {
  businessId: string;
  appointmentId: string;
  expiresAt: Date;
}) {
  const cancelToken = createOpaqueToken();
  const rescheduleToken = createOpaqueToken();

  await prisma.appointmentAccessToken.createMany({
    data: [
      {
        businessId: input.businessId,
        appointmentId: input.appointmentId,
        purpose: "CANCEL",
        tokenHash: hashOpaqueToken(cancelToken),
        expiresAt: input.expiresAt,
      },
      {
        businessId: input.businessId,
        appointmentId: input.appointmentId,
        purpose: "RESCHEDULE",
        tokenHash: hashOpaqueToken(rescheduleToken),
        expiresAt: input.expiresAt,
      },
    ],
  });

  return { cancelToken, rescheduleToken };
}

async function getActiveToken(rawToken: string, purpose: "CANCEL" | "RESCHEDULE") {
  const token = await prisma.appointmentAccessToken.findFirst({
    where: {
      tokenHash: hashOpaqueToken(rawToken),
      purpose,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    include: {
      appointment: {
        include: {
          business: true,
          service: true,
          professional: true,
        },
      },
    },
  });

  if (!token) {
    throw new Error("Link invalido ou expirado.");
  }

  return token;
}

export async function createPublicBooking(input: {
  slug: string;
  serviceId: string;
  serviceVariantId?: string;
  professionalId: string;
  startsAt: string;
  customerName: string;
  customerEmail?: string;
  customerPhone: string;
  customerTimezone: string;
}) {
  const business = await getBusinessContextOrThrow(input.slug);
  const subscription = await assertBusinessCanReceiveBookings(business.id);
  await assertMonthlyBookingLimit(business.id, subscription.plan.maxMonthlyAppointments);

  const professional = business.professionals.find((item) => item.id === input.professionalId);
  if (!professional) {
    throw new Error("Profissional nao encontrado.");
  }

  const serviceSelection = await getServiceSelection(business, {
    serviceId: input.serviceId,
    serviceVariantId: input.serviceVariantId,
  });

  const startsAtUtc = parseISO(input.startsAt);
  const endsAtUtc = addMinutes(
    startsAtUtc,
    serviceSelection.durationMinutes + serviceSelection.service.bufferAfterMinutes,
  );

  const localDateKey = formatInTimeZone(startsAtUtc, business.timezone, "yyyy-MM-dd");

  const appointment = await prisma.$transaction(
    async (tx) => {
      const lockKey = advisoryLockKey({
        businessId: business.id,
        professionalId: professional.id,
        date: localDateKey,
      });

      await tx.$executeRawUnsafe("SELECT pg_advisory_xact_lock(hashtext($1))", lockKey);

      const conflicting = await tx.appointment.findFirst({
        where: {
          professionalId: professional.id,
          status: { in: ["PENDING", "CONFIRMED"] },
          startsAtUtc: { lt: endsAtUtc },
          endsAtUtc: { gt: startsAtUtc },
        },
        select: { id: true },
      });

      if (conflicting) {
        throw new Error("Esse horario acabou de ser reservado. Escolha outro horario.");
      }

      const customer = await tx.customer.upsert({
        where: {
          businessId_phone: {
            businessId: business.id,
            phone: input.customerPhone,
          },
        },
        update: {
          fullName: input.customerName,
          email: input.customerEmail || null,
          privacyConsentAt: new Date(),
          timezone: input.customerTimezone,
          lastBookedAt: new Date(),
        },
        create: {
          businessId: business.id,
          fullName: input.customerName,
          email: input.customerEmail || null,
          phone: input.customerPhone,
          privacyConsentAt: new Date(),
          timezone: input.customerTimezone,
          lastBookedAt: new Date(),
        },
      });

      const created = await tx.appointment.create({
        data: {
          businessId: business.id,
          professionalId: professional.id,
          serviceId: serviceSelection.service.id,
          serviceVariantId: serviceSelection.variant?.id,
          customerId: customer.id,
          locationId: business.locations[0]?.id,
          status: "CONFIRMED",
          source: "PUBLIC_PAGE",
          startsAtUtc,
          endsAtUtc,
          timezoneSnapshot: business.timezone,
          customerTimezone: input.customerTimezone,
          customerNameSnapshot: input.customerName,
          customerEmailSnapshot: input.customerEmail || null,
          customerPhoneSnapshot: input.customerPhone,
          serviceNameSnapshot: serviceSelection.service.name,
          serviceVariantSnapshot: serviceSelection.variant?.name,
          locationNameSnapshot: business.locations[0]?.name,
          priceCents: serviceSelection.priceCents,
          prepaymentMode: serviceSelection.prepaymentMode,
          prepaymentAmountCents: serviceSelection.prepaymentAmountCents,
        },
      });

      await tx.appointmentStatusHistory.create({
        data: {
          appointmentId: created.id,
          toStatus: "CONFIRMED",
          note: "Agendamento criado pela pagina publica.",
        },
      });

      await tx.notification.create({
        data: {
          businessId: business.id,
          appointmentId: created.id,
          customerId: customer.id,
          channel: "EMAIL",
          type: NotificationType.APPOINTMENT_CONFIRMED,
          status: "PENDING",
          recipientName: customer.fullName,
          recipientEmail: customer.email,
          recipientPhone: customer.phone,
        },
      });

      return created;
    },
    {
      isolationLevel: "Serializable",
    },
  );

  const expiresAt = addMinutes(appointment.startsAtUtc, -business.cancellationNoticeMinutes);
  const tokens = await createAccessTokensForAppointment({
    businessId: business.id,
    appointmentId: appointment.id,
    expiresAt,
  });

  await prisma.notification.updateMany({
    where: {
      appointmentId: appointment.id,
      type: NotificationType.APPOINTMENT_CONFIRMED,
      channel: "EMAIL",
    },
    data: {
      payload: {
        cancelUrl: buildPublicActionUrl(`/cancelar/${tokens.cancelToken}`),
        rescheduleUrl: buildPublicActionUrl(`/reagendar/${tokens.rescheduleToken}`),
      },
    },
  });

  await enqueueAppointmentNotifications({
    appointmentId: appointment.id,
    startsAtUtc: appointment.startsAtUtc,
  });

  await invalidateAvailabilityCache({
    slug: business.slug,
    date: localDateKey,
    serviceId: serviceSelection.service.id,
    professionalId: professional.id,
    timezone: business.timezone,
  });

  return {
    appointment,
    tokens,
  };
}

export async function cancelBookingWithToken(rawToken: string, reason?: string) {
  const token = await getActiveToken(rawToken, "CANCEL");
  const appointment = token.appointment;

  const cancellationWindowStart = addMinutes(
    appointment.startsAtUtc,
    -appointment.business.cancellationNoticeMinutes,
  );

  if (new Date() > cancellationWindowStart) {
    throw new Error("A politica de cancelamento deste profissional nao permite cancelar agora.");
  }

  const updated = await prisma.$transaction(async (tx) => {
    const nextAppointment = await tx.appointment.update({
      where: { id: appointment.id },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
        cancellationReason: reason ?? null,
      },
    });

    await tx.appointmentStatusHistory.create({
      data: {
        appointmentId: appointment.id,
        fromStatus: appointment.status,
        toStatus: "CANCELLED",
        note: reason ?? "Cancelado pelo cliente final via link.",
      },
    });

    await tx.appointmentAccessToken.update({
      where: { id: token.id },
      data: { usedAt: new Date() },
    });

    await tx.notification.create({
      data: {
        businessId: appointment.businessId,
        appointmentId: appointment.id,
        customerId: appointment.customerId,
        channel: "EMAIL",
        type: NotificationType.APPOINTMENT_CANCELLED,
        status: "PENDING",
        recipientName: appointment.customerNameSnapshot,
        recipientEmail: appointment.customerEmailSnapshot,
        recipientPhone: appointment.customerPhoneSnapshot,
      },
    });

    return nextAppointment;
  });

  await invalidateAvailabilityCache({
    slug: appointment.business.slug,
    date: formatInTimeZone(appointment.startsAtUtc, appointment.business.timezone, "yyyy-MM-dd"),
    serviceId: appointment.serviceId,
    professionalId: appointment.professionalId,
    timezone: appointment.business.timezone,
  });

  await enqueueAppointmentLifecycleNotification({
    jobName: "appointment-cancelled",
    appointmentId: appointment.id,
  });

  return updated;
}

export async function rescheduleBookingWithToken(rawToken: string, startsAt: string, customerTimezone: string) {
  const token = await getActiveToken(rawToken, "RESCHEDULE");
  const appointment = token.appointment;

  const rescheduleWindowStart = addMinutes(
    appointment.startsAtUtc,
    -appointment.business.rescheduleNoticeMinutes,
  );

  if (new Date() > rescheduleWindowStart) {
    throw new Error("A politica deste profissional nao permite reagendar neste momento.");
  }

  const startsAtUtc = parseISO(startsAt);
  const endsAtUtc = addMinutes(
    startsAtUtc,
    appointment.service.durationMinutes + appointment.service.bufferAfterMinutes,
  );

  const dateKey = formatInTimeZone(startsAtUtc, appointment.business.timezone, "yyyy-MM-dd");

  const updated = await prisma.$transaction(
    async (tx) => {
      const lockKey = advisoryLockKey({
        businessId: appointment.businessId,
        professionalId: appointment.professionalId,
        date: dateKey,
      });

      await tx.$executeRawUnsafe("SELECT pg_advisory_xact_lock(hashtext($1))", lockKey);

      const conflicting = await tx.appointment.findFirst({
        where: {
          professionalId: appointment.professionalId,
          status: { in: ["PENDING", "CONFIRMED"] },
          startsAtUtc: { lt: endsAtUtc },
          endsAtUtc: { gt: startsAtUtc },
          id: { not: appointment.id },
        },
        select: { id: true },
      });

      if (conflicting) {
        throw new Error("Esse horario acabou de ser reservado. Escolha outro horario.");
      }

      const nextAppointment = await tx.appointment.update({
        where: { id: appointment.id },
        data: {
          startsAtUtc,
          endsAtUtc,
          customerTimezone,
          version: { increment: 1 },
        },
      });

      await tx.appointmentStatusHistory.create({
        data: {
          appointmentId: appointment.id,
          fromStatus: appointment.status,
          toStatus: appointment.status,
          note: "Agendamento reagendado pelo cliente final.",
        },
      });

      await tx.appointmentAccessToken.update({
        where: { id: token.id },
        data: { usedAt: new Date() },
      });

      return nextAppointment;
    },
    {
      isolationLevel: "Serializable",
    },
  );

  const expiresAt = addMinutes(updated.startsAtUtc, -appointment.business.rescheduleNoticeMinutes);
  const nextTokens = await createAccessTokensForAppointment({
    businessId: appointment.businessId,
    appointmentId: appointment.id,
    expiresAt,
  });

  await prisma.notification.create({
    data: {
      businessId: appointment.businessId,
      appointmentId: appointment.id,
      customerId: appointment.customerId,
      channel: "EMAIL",
      type: NotificationType.APPOINTMENT_RESCHEDULED,
      status: "PENDING",
      recipientName: appointment.customerNameSnapshot,
      recipientEmail: appointment.customerEmailSnapshot,
      recipientPhone: appointment.customerPhoneSnapshot,
      payload: {
        cancelUrl: buildPublicActionUrl(`/cancelar/${nextTokens.cancelToken}`),
        rescheduleUrl: buildPublicActionUrl(`/reagendar/${nextTokens.rescheduleToken}`),
      },
    },
  });

  await invalidateAvailabilityCache({
    slug: appointment.business.slug,
    date: dateKey,
    serviceId: appointment.serviceId,
    professionalId: appointment.professionalId,
    timezone: appointment.business.timezone,
  });

  await enqueueAppointmentLifecycleNotification({
    jobName: "appointment-rescheduled",
    appointmentId: appointment.id,
  });

  return {
    appointment: updated,
    tokens: nextTokens,
  };
}

export async function loadActionTokenPreview(rawToken: string, purpose: "CANCEL" | "RESCHEDULE") {
  const token = await getActiveToken(rawToken, purpose);

  return {
    token: rawToken,
    appointmentId: token.appointment.id,
    businessSlug: token.appointment.business.slug,
    businessName: token.appointment.business.name,
    serviceId: token.appointment.serviceId,
    serviceName: token.appointment.serviceNameSnapshot,
    professionalId: token.appointment.professionalId,
    professionalName: token.appointment.professional.displayName,
    startsAtIso: token.appointment.startsAtUtc.toISOString(),
    startsAtLabel: formatInTimeZone(
      token.appointment.startsAtUtc,
      token.appointment.timezoneSnapshot,
      "dd/MM/yyyy 'as' HH:mm",
    ),
    timezone: token.appointment.timezoneSnapshot,
    customerTimezone: token.appointment.customerTimezone ?? token.appointment.timezoneSnapshot,
    expiresAtLabel: formatInTimeZone(
      token.expiresAt,
      token.appointment.timezoneSnapshot,
      "dd/MM/yyyy HH:mm",
    ),
  };
}
