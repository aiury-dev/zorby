import { randomUUID } from "crypto";
import { addMinutes, isBefore, parseISO } from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { NotificationType } from "@/lib/domain-enums";
import { getRedis } from "@/lib/redis";
import { createOpaqueToken, hashOpaqueToken } from "@/lib/tokens";
import { getPublicBusinessBySlug } from "@/server/services/business";
import {
  getAppointmentAccessTokenByHashFromFirestore,
  getAppointmentByIdFromFirestore,
  getAppointmentsForBusinessDateFromFirestore,
  getAvailabilityBlocksForBusinessFromFirestore,
  getBusinessSettingsFromFirestore,
  getCustomerByBusinessPhoneFromFirestore,
  getProfessionalsForBusinessFromFirestore,
  getServicesForBusinessFromFirestore,
} from "@/server/services/firestore-read";
import {
  acquireAppointmentSlotLocks,
  releaseAppointmentSlotLocks,
  syncAppointmentAccessTokenDocument,
  syncAppointmentDocument,
  syncAppointmentStatusHistoryDocument,
  syncCustomerDocument,
  syncNotificationDocument,
} from "@/server/services/firebase-sync";
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
    getAppointmentsForBusinessDateFromFirestore({
      businessId: input.businessId,
      startUtc: startsAtUtc,
      endUtc: endsAtUtc,
    }).then((items) =>
      items
        .filter(
          (appointment) =>
            appointment.professionalId === input.professionalId &&
            (appointment.status === "PENDING" || appointment.status === "CONFIRMED"),
        )
        .map((appointment) => ({
          startsAtUtc: appointment.startsAtUtc,
          endsAtUtc: appointment.endsAtUtc,
        })),
    ),
    getAvailabilityBlocksForBusinessFromFirestore({
      businessId: input.businessId,
      professionalId: input.professionalId,
      startUtc: startsAtUtc,
      endUtc: endsAtUtc,
    }).then((items) =>
      items.map((block) => ({
        startsAtUtc: block.startsAtUtc,
        endsAtUtc: block.endsAtUtc,
      })),
    ),
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
  const availabilities = professional.availabilities
    .filter((availability) => availability.dayOfWeek === dayOfWeek)
    .map((availability) => ({
      startMinutes: availability.startMinutes,
      endMinutes: availability.endMinutes,
      slotIntervalMinutes: availability.slotIntervalMinutes,
    }));

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

  await Promise.all([
    syncAppointmentAccessTokenDocument({
      id: randomUUID(),
      businessId: input.businessId,
      appointmentId: input.appointmentId,
      purpose: "CANCEL",
      tokenHash: hashOpaqueToken(cancelToken),
      expiresAt: input.expiresAt.toISOString(),
    }),
    syncAppointmentAccessTokenDocument({
      id: randomUUID(),
      businessId: input.businessId,
      appointmentId: input.appointmentId,
      purpose: "RESCHEDULE",
      tokenHash: hashOpaqueToken(rescheduleToken),
      expiresAt: input.expiresAt.toISOString(),
    }),
  ]);

  return { cancelToken, rescheduleToken };
}

async function upsertBookingCustomer(input: {
  businessId: string;
  fullName: string;
  email?: string | null;
  phone: string;
  timezone: string;
}) {
  const existing = await getCustomerByBusinessPhoneFromFirestore({
    businessId: input.businessId,
    phone: input.phone,
  });

  const customer = {
    id: existing?.id ?? randomUUID(),
    businessId: input.businessId,
    fullName: input.fullName,
    email: input.email ?? null,
    phone: input.phone,
    timezone: input.timezone,
    lastBookedAt: new Date().toISOString(),
  };

  await syncCustomerDocument(customer);

  return customer;
}

async function getActiveToken(rawToken: string, purpose: "CANCEL" | "RESCHEDULE") {
  const token = await getAppointmentAccessTokenByHashFromFirestore({
    tokenHash: hashOpaqueToken(rawToken),
    purpose,
  });

  if (!token || token.usedAt || token.expiresAt <= new Date()) {
    throw new Error("Link invalido ou expirado.");
  }

  const appointment = await getAppointmentByIdFromFirestore(token.appointmentId);
  if (!appointment) {
    throw new Error("Agendamento nao encontrado.");
  }

  const [business, professionals, services] = await Promise.all([
    getBusinessSettingsFromFirestore(appointment.businessId),
    getProfessionalsForBusinessFromFirestore(appointment.businessId),
    getServicesForBusinessFromFirestore(appointment.businessId),
  ]);

  if (!business) {
    throw new Error("Negocio nao encontrado.");
  }

  const professional = professionals.find((item) => item.id === appointment.professionalId);
  const service = services.find((item) => item.id === appointment.serviceId);
  const variant = service?.variants.find((item) => item.id === appointment.serviceVariantId);

  return {
    ...token,
    appointment: {
      ...appointment,
      business,
      professional: {
        id: appointment.professionalId,
        displayName: professional?.displayName ?? "Profissional",
        roleLabel: professional?.roleLabel ?? null,
      },
      service: {
        id: appointment.serviceId,
        durationMinutes: variant?.durationMinutes ?? service?.durationMinutes ?? 30,
        bufferAfterMinutes: service?.bufferAfterMinutes ?? 0,
      },
    },
  };
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
  const appointmentId = randomUUID();

  await acquireAppointmentSlotLocks({
    appointmentId,
    businessId: business.id,
    professionalId: professional.id,
    startsAtUtc,
    endsAtUtc,
  });

  try {
    const conflicting = (
      await getAppointmentsForBusinessDateFromFirestore({
        businessId: business.id,
        startUtc: toDayBounds(localDateKey, business.timezone).startsAtUtc,
        endUtc: toDayBounds(localDateKey, business.timezone).endsAtUtc,
      })
    ).find(
      (candidate) =>
        candidate.professionalId === professional.id &&
        (candidate.status === "PENDING" || candidate.status === "CONFIRMED") &&
        candidate.startsAtUtc < endsAtUtc &&
        candidate.endsAtUtc > startsAtUtc,
    );

    if (conflicting) {
      throw new Error("Esse horario acabou de ser reservado. Escolha outro horario.");
    }

    const customer = await upsertBookingCustomer({
      businessId: business.id,
      fullName: input.customerName,
      email: input.customerEmail || null,
      phone: input.customerPhone,
      timezone: input.customerTimezone,
    });

    const appointment = {
      id: appointmentId,
      businessId: business.id,
      professionalId: professional.id,
      serviceId: serviceSelection.service.id,
      serviceVariantId: serviceSelection.variant?.id ?? null,
      customerId: customer.id,
      status: "CONFIRMED" as const,
      source: "PUBLIC_PAGE",
      startsAtUtc,
      endsAtUtc,
      timezoneSnapshot: business.timezone,
      customerTimezone: input.customerTimezone,
      customerNameSnapshot: input.customerName,
      customerEmailSnapshot: input.customerEmail || null,
      customerPhoneSnapshot: input.customerPhone,
      serviceNameSnapshot: serviceSelection.service.name,
      serviceVariantSnapshot: serviceSelection.variant?.name ?? null,
      priceCents: serviceSelection.priceCents,
    };

    await syncAppointmentDocument({
      id: appointment.id,
      businessId: appointment.businessId,
      professionalId: appointment.professionalId,
      serviceId: appointment.serviceId,
      serviceVariantId: appointment.serviceVariantId,
      customerId: appointment.customerId,
      status: appointment.status,
      source: appointment.source,
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
    });

    await syncAppointmentStatusHistoryDocument({
      id: randomUUID(),
      appointmentId: appointment.id,
      toStatus: "CONFIRMED",
      note: "Agendamento criado pela pagina publica.",
    });

    const expiresAt = addMinutes(appointment.startsAtUtc, -business.cancellationNoticeMinutes);
    const tokens = await createAccessTokensForAppointment({
      businessId: business.id,
      appointmentId: appointment.id,
      expiresAt,
    });

    await syncNotificationDocument({
      id: randomUUID(),
      businessId: business.id,
      appointmentId: appointment.id,
      customerId: customer.id,
      channel: "EMAIL",
      type: NotificationType.APPOINTMENT_CONFIRMED,
      status: "PENDING",
      recipientName: customer.fullName,
      recipientEmail: customer.email,
      recipientPhone: customer.phone,
      payload: {
        cancelUrl: buildPublicActionUrl(`/cancelar/${tokens.cancelToken}`),
        rescheduleUrl: buildPublicActionUrl(`/reagendar/${tokens.rescheduleToken}`),
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
  } catch (error) {
    await releaseAppointmentSlotLocks({
      professionalId: professional.id,
      startsAtUtc,
      endsAtUtc,
    }).catch(() => undefined);
    throw error;
  }
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

  const cancelledAt = new Date();

  await syncAppointmentDocument({
    id: appointment.id,
    businessId: appointment.businessId,
    professionalId: appointment.professionalId,
    serviceId: appointment.serviceId,
    serviceVariantId: appointment.serviceVariantId,
    customerId: appointment.customerId,
    status: "CANCELLED",
    source: appointment.source,
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
    cancelledAt: cancelledAt.toISOString(),
  });

  await syncAppointmentStatusHistoryDocument({
    id: randomUUID(),
    appointmentId: appointment.id,
    fromStatus: appointment.status,
    toStatus: "CANCELLED",
    note: reason ?? "Cancelado pelo cliente final via link.",
  });

  await syncAppointmentAccessTokenDocument({
    id: token.id,
    businessId: token.businessId,
    appointmentId: token.appointmentId,
    purpose: token.purpose,
    tokenHash: token.tokenHash,
    expiresAt: token.expiresAt.toISOString(),
    usedAt: cancelledAt.toISOString(),
  });

  await syncNotificationDocument({
    id: randomUUID(),
    businessId: appointment.businessId,
    appointmentId: appointment.id,
    customerId: appointment.customerId,
    channel: "EMAIL",
    type: NotificationType.APPOINTMENT_CANCELLED,
    status: "PENDING",
    recipientName: appointment.customerNameSnapshot,
    recipientEmail: appointment.customerEmailSnapshot,
    recipientPhone: appointment.customerPhoneSnapshot,
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

  await releaseAppointmentSlotLocks({
    professionalId: appointment.professionalId,
    startsAtUtc: appointment.startsAtUtc,
    endsAtUtc: appointment.endsAtUtc,
  }).catch(() => undefined);

  return {
    ...appointment,
    status: "CANCELLED" as const,
    cancelledAt,
  };
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
  await acquireAppointmentSlotLocks({
    appointmentId: appointment.id,
    businessId: appointment.businessId,
    professionalId: appointment.professionalId,
    startsAtUtc,
    endsAtUtc,
  });

  try {
    const conflicting = (
      await getAppointmentsForBusinessDateFromFirestore({
        businessId: appointment.businessId,
        startUtc: toDayBounds(dateKey, appointment.business.timezone).startsAtUtc,
        endUtc: toDayBounds(dateKey, appointment.business.timezone).endsAtUtc,
      })
    ).find(
      (candidate) =>
        candidate.id !== appointment.id &&
        candidate.professionalId === appointment.professionalId &&
        (candidate.status === "PENDING" || candidate.status === "CONFIRMED") &&
        candidate.startsAtUtc < endsAtUtc &&
        candidate.endsAtUtc > startsAtUtc,
    );

    if (conflicting) {
      throw new Error("Esse horario acabou de ser reservado. Escolha outro horario.");
    }

    await syncAppointmentDocument({
      id: appointment.id,
      businessId: appointment.businessId,
      professionalId: appointment.professionalId,
      serviceId: appointment.serviceId,
      serviceVariantId: appointment.serviceVariantId,
      customerId: appointment.customerId,
      status: appointment.status,
      source: appointment.source,
      startsAtUtc: startsAtUtc.toISOString(),
      endsAtUtc: endsAtUtc.toISOString(),
      timezoneSnapshot: appointment.timezoneSnapshot,
      customerTimezone,
      customerNameSnapshot: appointment.customerNameSnapshot,
      customerEmailSnapshot: appointment.customerEmailSnapshot,
      customerPhoneSnapshot: appointment.customerPhoneSnapshot,
      serviceNameSnapshot: appointment.serviceNameSnapshot,
      serviceVariantSnapshot: appointment.serviceVariantSnapshot,
      priceCents: appointment.priceCents,
      cancelledAt: appointment.cancelledAt?.toISOString() ?? null,
      completedAt: appointment.completedAt?.toISOString() ?? null,
      noShowMarkedAt: appointment.noShowMarkedAt?.toISOString() ?? null,
    });

    await syncAppointmentStatusHistoryDocument({
      id: randomUUID(),
      appointmentId: appointment.id,
      fromStatus: appointment.status,
      toStatus: appointment.status,
      note: "Agendamento reagendado pelo cliente final.",
    });

    await syncAppointmentAccessTokenDocument({
      id: token.id,
      businessId: token.businessId,
      appointmentId: token.appointmentId,
      purpose: token.purpose,
      tokenHash: token.tokenHash,
      expiresAt: token.expiresAt.toISOString(),
      usedAt: new Date().toISOString(),
    });

    const updated = {
      ...appointment,
      startsAtUtc,
      endsAtUtc,
      customerTimezone,
    };

    const expiresAt = addMinutes(updated.startsAtUtc, -appointment.business.rescheduleNoticeMinutes);
    const nextTokens = await createAccessTokensForAppointment({
      businessId: appointment.businessId,
      appointmentId: appointment.id,
      expiresAt,
    });

    await syncNotificationDocument({
      id: randomUUID(),
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

    await releaseAppointmentSlotLocks({
      professionalId: appointment.professionalId,
      startsAtUtc: appointment.startsAtUtc,
      endsAtUtc: appointment.endsAtUtc,
    }).catch(() => undefined);

    return {
      appointment: updated,
      tokens: nextTokens,
    };
  } catch (error) {
    await releaseAppointmentSlotLocks({
      professionalId: appointment.professionalId,
      startsAtUtc,
      endsAtUtc,
    }).catch(() => undefined);
    throw error;
  }
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
