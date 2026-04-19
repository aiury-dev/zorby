import type {
  BillingInterval,
  BusinessCategory,
  MembershipRole,
  OnboardingStep,
  ProfessionalStatus,
  ServicePrepaymentMode,
  SubscriptionStatus,
} from "@/lib/domain-enums";
import type { Transaction } from "firebase-admin/firestore";
import { getFirebaseAdminDb } from "@/lib/firebase-admin";

const COLLECTIONS = {
  users: "users",
  businesses: "businesses",
  memberships: "memberships",
  professionals: "professionals",
  services: "services",
  serviceVariants: "serviceVariants",
  professionalServices: "professionalServices",
  availabilities: "availabilities",
  availabilityBlocks: "availabilityBlocks",
  customers: "customers",
  reviews: "reviews",
  appointments: "appointments",
  appointmentStatusHistory: "appointmentStatusHistory",
  appointmentAccessTokens: "appointmentAccessTokens",
  notifications: "notifications",
  notificationTemplates: "notificationTemplates",
  privacyRequests: "privacyRequests",
  dataExports: "dataExports",
  appointmentSlotLocks: "appointmentSlotLocks",
} as const;

function nowIso() {
  return new Date().toISOString();
}

function compact<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(
    Object.entries(value).filter(([, fieldValue]) => fieldValue !== undefined),
  ) as T;
}

export async function syncUserDocument(input: {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
  phone?: string | null;
  status?: string;
  locale?: string | null;
}) {
  const db = getFirebaseAdminDb();
  const ref = db.collection(COLLECTIONS.users).doc(input.id);
  const snapshot = await ref.get();

  await ref.set(
    compact({
      id: input.id,
      email: input.email,
      name: input.name ?? null,
      image: input.image ?? null,
      phone: input.phone ?? null,
      status: input.status ?? "ACTIVE",
      locale: input.locale ?? "pt-BR",
      createdAt: snapshot.exists ? undefined : nowIso(),
      updatedAt: nowIso(),
    }),
    { merge: true },
  );
}

export async function syncBusinessDocument(input: {
  id: string;
  name: string;
  slug: string;
  category: BusinessCategory | string;
  status: string;
  description?: string | null;
  phone?: string | null;
  email?: string | null;
  timezone?: string | null;
  logoUrl?: string | null;
  coverImageUrl?: string | null;
  brandPrimaryColor?: string | null;
  brandSecondaryColor?: string | null;
  publicBookingEnabled?: boolean;
  publicBookingPaused?: boolean;
  indexable?: boolean;
  onboardingStep?: OnboardingStep | string;
  bookingTitle?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  cancellationPolicyText?: string | null;
  cancellationNoticeMinutes?: number;
  rescheduleNoticeMinutes?: number;
  minimumLeadTimeMinutes?: number;
  bookingLinkTokenTtlMinutes?: number;
  subscription?: {
    id: string;
    status: SubscriptionStatus | string;
    billingInterval: BillingInterval | string;
    providerSubscriptionId?: string | null;
    currentPeriodStart?: string | null;
    currentPeriodEnd?: string | null;
    trialEnd?: string | null;
    cancelAtPeriodEnd?: boolean;
    newBookingsBlockedAt?: string | null;
    plan: {
      id: string;
      code: string;
      name: string;
      maxProfessionals?: number | null;
      maxServices?: number | null;
      maxMonthlyAppointments?: number | null;
      fullDataExportEnabled?: boolean;
      whatsappEnabled?: boolean;
    };
  } | null;
}) {
  const db = getFirebaseAdminDb();
  const ref = db.collection(COLLECTIONS.businesses).doc(input.id);
  const snapshot = await ref.get();

  await ref.set(
    compact({
      id: input.id,
      name: input.name,
      slug: input.slug,
      category: input.category,
      status: input.status,
      description: input.description ?? null,
      phone: input.phone ?? null,
      email: input.email ?? null,
      timezone: input.timezone ?? "America/Sao_Paulo",
      logoUrl: input.logoUrl ?? null,
      coverImageUrl: input.coverImageUrl ?? null,
      brandPrimaryColor: input.brandPrimaryColor ?? "#1664E8",
      brandSecondaryColor: input.brandSecondaryColor ?? "#1254C7",
      publicBookingEnabled: input.publicBookingEnabled ?? false,
      publicBookingPaused: input.publicBookingPaused ?? false,
      indexable: input.indexable ?? true,
      onboardingStep: input.onboardingStep ?? "BUSINESS",
      bookingTitle: input.bookingTitle ?? null,
      seoTitle: input.seoTitle ?? null,
      seoDescription: input.seoDescription ?? null,
      addressLine1: input.addressLine1 ?? null,
      addressLine2: input.addressLine2 ?? null,
      neighborhood: input.neighborhood ?? null,
      city: input.city ?? null,
      state: input.state ?? null,
      postalCode: input.postalCode ?? null,
      country: input.country ?? "BR",
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      cancellationPolicyText: input.cancellationPolicyText ?? null,
      cancellationNoticeMinutes: input.cancellationNoticeMinutes ?? 120,
      rescheduleNoticeMinutes: input.rescheduleNoticeMinutes ?? 120,
      minimumLeadTimeMinutes: input.minimumLeadTimeMinutes ?? 60,
      bookingLinkTokenTtlMinutes: input.bookingLinkTokenTtlMinutes ?? 1440,
      subscription: input.subscription ?? null,
      createdAt: snapshot.exists ? undefined : nowIso(),
      updatedAt: nowIso(),
    }),
    { merge: true },
  );
}

export async function syncBusinessSubscriptionSummary(input: {
  businessId: string;
  subscription: {
    id: string;
    status: SubscriptionStatus | string;
    billingInterval: BillingInterval | string;
    providerSubscriptionId?: string | null;
    currentPeriodStart?: string | null;
    currentPeriodEnd?: string | null;
    trialEnd?: string | null;
    cancelAtPeriodEnd?: boolean;
    newBookingsBlockedAt?: string | null;
    plan: {
      id: string;
      code: string;
      name: string;
      maxProfessionals?: number | null;
      maxServices?: number | null;
      maxMonthlyAppointments?: number | null;
      fullDataExportEnabled?: boolean;
      whatsappEnabled?: boolean;
    };
  } | null;
}) {
  const db = getFirebaseAdminDb();
  await db.collection(COLLECTIONS.businesses).doc(input.businessId).set(
    {
      subscription: input.subscription ?? null,
      updatedAt: nowIso(),
    },
    { merge: true },
  );
}

export async function syncMembershipDocument(input: {
  businessId: string;
  userId: string;
  role: MembershipRole | string;
}) {
  const db = getFirebaseAdminDb();
  const id = `${input.businessId}_${input.userId}`;
  const ref = db.collection(COLLECTIONS.memberships).doc(id);
  const snapshot = await ref.get();

  await ref.set(
    compact({
      id,
      businessId: input.businessId,
      userId: input.userId,
      role: input.role,
      createdAt: snapshot.exists ? undefined : nowIso(),
      updatedAt: nowIso(),
    }),
    { merge: true },
  );
}

export async function syncProfessionalDocument(input: {
  id: string;
  businessId: string;
  displayName: string;
  publicDisplayName?: string | null;
  roleLabel?: string | null;
  slug?: string | null;
  email?: string | null;
  phone?: string | null;
  bio?: string | null;
  photoUrl?: string | null;
  status?: ProfessionalStatus | string;
  acceptsOnlineBookings?: boolean;
  sortOrder?: number;
  serviceIds?: string[];
}) {
  const db = getFirebaseAdminDb();
  const ref = db.collection(COLLECTIONS.professionals).doc(input.id);
  const snapshot = await ref.get();

  await ref.set(
    compact({
      id: input.id,
      businessId: input.businessId,
      displayName: input.displayName,
      publicDisplayName: input.publicDisplayName ?? null,
      roleLabel: input.roleLabel ?? null,
      slug: input.slug ?? null,
      email: input.email ?? null,
      phone: input.phone ?? null,
      bio: input.bio ?? null,
      photoUrl: input.photoUrl ?? null,
      status: input.status ?? "ACTIVE",
      acceptsOnlineBookings: input.acceptsOnlineBookings ?? true,
      sortOrder: input.sortOrder ?? 0,
      serviceIds: input.serviceIds ?? [],
      createdAt: snapshot.exists ? undefined : nowIso(),
      updatedAt: nowIso(),
    }),
    { merge: true },
  );
}

export async function syncServiceDocument(input: {
  id: string;
  businessId: string;
  name: string;
  slug?: string | null;
  description?: string | null;
  durationMinutes: number;
  bufferAfterMinutes?: number;
  priceCents: number;
  colorHex?: string | null;
  isActive?: boolean;
  sortOrder?: number;
  prepaymentMode?: ServicePrepaymentMode | string;
  prepaymentAmountCents?: number | null;
}) {
  const db = getFirebaseAdminDb();
  const ref = db.collection(COLLECTIONS.services).doc(input.id);
  const snapshot = await ref.get();

  await ref.set(
    compact({
      id: input.id,
      businessId: input.businessId,
      name: input.name,
      slug: input.slug ?? null,
      description: input.description ?? null,
      durationMinutes: input.durationMinutes,
      bufferAfterMinutes: input.bufferAfterMinutes ?? 0,
      priceCents: input.priceCents,
      colorHex: input.colorHex ?? null,
      isActive: input.isActive ?? true,
      sortOrder: input.sortOrder ?? 0,
      prepaymentMode: input.prepaymentMode ?? "NONE",
      prepaymentAmountCents: input.prepaymentAmountCents ?? null,
      createdAt: snapshot.exists ? undefined : nowIso(),
      updatedAt: nowIso(),
    }),
    { merge: true },
  );
}

export async function syncServiceVariantDocument(input: {
  id: string;
  businessId: string;
  serviceId: string;
  name: string;
  durationMinutes: number;
  priceCents: number;
  isActive?: boolean;
  sortOrder?: number;
  prepaymentMode?: ServicePrepaymentMode | string;
  prepaymentAmountCents?: number | null;
}) {
  const db = getFirebaseAdminDb();
  const ref = db.collection(COLLECTIONS.serviceVariants).doc(input.id);
  const snapshot = await ref.get();

  await ref.set(
    compact({
      id: input.id,
      businessId: input.businessId,
      serviceId: input.serviceId,
      name: input.name,
      durationMinutes: input.durationMinutes,
      priceCents: input.priceCents,
      isActive: input.isActive ?? true,
      sortOrder: input.sortOrder ?? 0,
      prepaymentMode: input.prepaymentMode ?? "NONE",
      prepaymentAmountCents: input.prepaymentAmountCents ?? null,
      createdAt: snapshot.exists ? undefined : nowIso(),
      updatedAt: nowIso(),
    }),
    { merge: true },
  );
}

export async function syncProfessionalServiceDocuments(input: {
  businessId: string;
  professionalId: string;
  serviceIds: string[];
}) {
  const db = getFirebaseAdminDb();
  const batch = db.batch();

  const existing = await db
    .collection(COLLECTIONS.professionalServices)
    .where("professionalId", "==", input.professionalId)
    .get();

  for (const existingDoc of existing.docs) {
    batch.delete(existingDoc.ref);
  }

  input.serviceIds.forEach((serviceId) => {
    const id = `${input.professionalId}_${serviceId}`;
    const ref = db.collection(COLLECTIONS.professionalServices).doc(id);
    batch.set(ref, {
      id,
      businessId: input.businessId,
      professionalId: input.professionalId,
      serviceId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });
  });

  await batch.commit();
}

export async function syncAvailabilityDocument(input: {
  id: string;
  businessId: string;
  professionalId: string;
  dayOfWeek: number;
  startMinutes: number;
  endMinutes: number;
  slotIntervalMinutes: number;
  capacity?: number;
  isActive?: boolean;
}) {
  const db = getFirebaseAdminDb();
  const ref = db.collection(COLLECTIONS.availabilities).doc(input.id);
  const snapshot = await ref.get();

  await ref.set(
    compact({
      id: input.id,
      businessId: input.businessId,
      professionalId: input.professionalId,
      dayOfWeek: input.dayOfWeek,
      startMinutes: input.startMinutes,
      endMinutes: input.endMinutes,
      slotIntervalMinutes: input.slotIntervalMinutes,
      capacity: input.capacity ?? 1,
      isActive: input.isActive ?? true,
      createdAt: snapshot.exists ? undefined : nowIso(),
      updatedAt: nowIso(),
    }),
    { merge: true },
  );
}

export async function syncAvailabilityBlockDocument(input: {
  id: string;
  businessId: string;
  professionalId?: string | null;
  title?: string | null;
  reason?: string | null;
  allDay?: boolean;
  startsAtUtc: string;
  endsAtUtc: string;
  createdAt?: string;
}) {
  const db = getFirebaseAdminDb();
  const ref = db.collection(COLLECTIONS.availabilityBlocks).doc(input.id);
  const snapshot = await ref.get();

  await ref.set(
    compact({
      id: input.id,
      businessId: input.businessId,
      professionalId: input.professionalId ?? null,
      title: input.title ?? null,
      reason: input.reason ?? null,
      allDay: input.allDay ?? false,
      startsAtUtc: input.startsAtUtc,
      endsAtUtc: input.endsAtUtc,
      createdAt: input.createdAt ?? (snapshot.exists ? undefined : nowIso()),
      updatedAt: nowIso(),
    }),
    { merge: true },
  );
}

export async function deleteAvailabilityDocument(id: string) {
  const db = getFirebaseAdminDb();
  await db.collection(COLLECTIONS.availabilities).doc(id).delete().catch(() => undefined);
}

export async function syncCustomerDocument(input: {
  id: string;
  businessId: string;
  fullName: string;
  email?: string | null;
  phone: string;
  timezone?: string | null;
  lastBookedAt?: string | null;
}) {
  const db = getFirebaseAdminDb();
  const ref = db.collection(COLLECTIONS.customers).doc(input.id);
  const snapshot = await ref.get();

  await ref.set(
    compact({
      id: input.id,
      businessId: input.businessId,
      fullName: input.fullName,
      email: input.email ?? null,
      phone: input.phone,
      timezone: input.timezone ?? null,
      lastBookedAt: input.lastBookedAt ?? null,
      createdAt: snapshot.exists ? undefined : nowIso(),
      updatedAt: nowIso(),
    }),
    { merge: true },
  );
}

export async function syncReviewDocument(input: {
  id: string;
  businessId: string;
  professionalId: string;
  appointmentId: string;
  customerId?: string | null;
  rating: number;
  title?: string | null;
  body?: string | null;
  customerNameSnapshot: string;
  status?: string;
  isPublic?: boolean;
  publishedAt?: string | null;
  createdAt?: string;
}) {
  const db = getFirebaseAdminDb();
  const ref = db.collection(COLLECTIONS.reviews).doc(input.id);
  const snapshot = await ref.get();

  await ref.set(
    compact({
      id: input.id,
      businessId: input.businessId,
      professionalId: input.professionalId,
      appointmentId: input.appointmentId,
      customerId: input.customerId ?? null,
      rating: input.rating,
      title: input.title ?? null,
      body: input.body ?? null,
      customerNameSnapshot: input.customerNameSnapshot,
      status: input.status ?? "PUBLISHED",
      isPublic: input.isPublic ?? true,
      publishedAt: input.publishedAt ?? null,
      createdAt: input.createdAt ?? (snapshot.exists ? undefined : nowIso()),
      updatedAt: nowIso(),
    }),
    { merge: true },
  );
}

export async function syncAppointmentDocument(input: {
  id: string;
  businessId: string;
  professionalId: string;
  serviceId: string;
  serviceVariantId?: string | null;
  customerId: string;
  status: string;
  source?: string;
  startsAtUtc: string;
  endsAtUtc: string;
  timezoneSnapshot: string;
  customerTimezone?: string | null;
  customerNameSnapshot: string;
  customerEmailSnapshot?: string | null;
  customerPhoneSnapshot: string;
  serviceNameSnapshot: string;
  serviceVariantSnapshot?: string | null;
  priceCents: number;
  cancelledAt?: string | null;
  completedAt?: string | null;
  noShowMarkedAt?: string | null;
}) {
  const db = getFirebaseAdminDb();
  const ref = db.collection(COLLECTIONS.appointments).doc(input.id);
  const snapshot = await ref.get();

  await ref.set(
    compact({
      ...input,
      source: input.source ?? "PUBLIC_PAGE",
      createdAt: snapshot.exists ? undefined : nowIso(),
      updatedAt: nowIso(),
    }),
    { merge: true },
  );
}

export async function syncAppointmentStatusHistoryDocument(input: {
  id: string;
  appointmentId: string;
  fromStatus?: string | null;
  toStatus: string;
  note?: string | null;
  changedByUserId?: string | null;
  createdAt?: string;
}) {
  const db = getFirebaseAdminDb();
  const ref = db.collection(COLLECTIONS.appointmentStatusHistory).doc(input.id);
  const snapshot = await ref.get();

  await ref.set(
    compact({
      id: input.id,
      appointmentId: input.appointmentId,
      fromStatus: input.fromStatus ?? null,
      toStatus: input.toStatus,
      note: input.note ?? null,
      changedByUserId: input.changedByUserId ?? null,
      createdAt: input.createdAt ?? (snapshot.exists ? undefined : nowIso()),
      updatedAt: nowIso(),
    }),
    { merge: true },
  );
}

export async function syncAppointmentAccessTokenDocument(input: {
  id: string;
  businessId: string;
  appointmentId: string;
  purpose: string;
  tokenHash: string;
  expiresAt: string;
  usedAt?: string | null;
  createdAt?: string;
}) {
  const db = getFirebaseAdminDb();
  const ref = db.collection(COLLECTIONS.appointmentAccessTokens).doc(input.id);
  const snapshot = await ref.get();

  await ref.set(
    compact({
      id: input.id,
      businessId: input.businessId,
      appointmentId: input.appointmentId,
      purpose: input.purpose,
      tokenHash: input.tokenHash,
      expiresAt: input.expiresAt,
      usedAt: input.usedAt ?? null,
      createdAt: input.createdAt ?? (snapshot.exists ? undefined : nowIso()),
      updatedAt: nowIso(),
    }),
    { merge: true },
  );
}

export async function syncNotificationDocument(input: {
  id: string;
  businessId: string;
  appointmentId?: string | null;
  customerId?: string | null;
  templateId?: string | null;
  channel: string;
  type: string;
  status: string;
  recipientName?: string | null;
  recipientEmail?: string | null;
  recipientPhone?: string | null;
  subject?: string | null;
  body?: string | null;
  payload?: Record<string, unknown> | null;
  scheduledFor?: string | null;
  sentAt?: string | null;
  failedAt?: string | null;
  errorMessage?: string | null;
  createdAt?: string;
}) {
  const db = getFirebaseAdminDb();
  const ref = db.collection(COLLECTIONS.notifications).doc(input.id);
  const snapshot = await ref.get();

  await ref.set(
    compact({
      id: input.id,
      businessId: input.businessId,
      appointmentId: input.appointmentId ?? null,
      customerId: input.customerId ?? null,
      templateId: input.templateId ?? null,
      channel: input.channel,
      type: input.type,
      status: input.status,
      recipientName: input.recipientName ?? null,
      recipientEmail: input.recipientEmail ?? null,
      recipientPhone: input.recipientPhone ?? null,
      subject: input.subject ?? null,
      body: input.body ?? null,
      payload: input.payload ?? null,
      scheduledFor: input.scheduledFor ?? null,
      sentAt: input.sentAt ?? null,
      failedAt: input.failedAt ?? null,
      errorMessage: input.errorMessage ?? null,
      createdAt: input.createdAt ?? (snapshot.exists ? undefined : nowIso()),
      updatedAt: nowIso(),
    }),
    { merge: true },
  );
}

export async function syncNotificationTemplateDocument(input: {
  id: string;
  businessId: string;
  channel: string;
  type: string;
  subject?: string | null;
  body: string;
  isActive?: boolean;
  createdAt?: string;
}) {
  const db = getFirebaseAdminDb();
  const ref = db.collection(COLLECTIONS.notificationTemplates).doc(input.id);
  const snapshot = await ref.get();

  await ref.set(
    compact({
      id: input.id,
      businessId: input.businessId,
      channel: input.channel,
      type: input.type,
      subject: input.subject ?? null,
      body: input.body,
      isActive: input.isActive ?? true,
      createdAt: input.createdAt ?? (snapshot.exists ? undefined : nowIso()),
      updatedAt: nowIso(),
    }),
    { merge: true },
  );
}

export async function syncPrivacyRequestDocument(input: {
  id: string;
  businessId: string;
  customerId?: string | null;
  type: string;
  status?: string;
  requesterName?: string | null;
  requesterEmail?: string | null;
  requesterPhone?: string | null;
  note?: string | null;
  resolvedAt?: string | null;
  createdAt?: string;
}) {
  const db = getFirebaseAdminDb();
  const ref = db.collection(COLLECTIONS.privacyRequests).doc(input.id);
  const snapshot = await ref.get();

  await ref.set(
    compact({
      id: input.id,
      businessId: input.businessId,
      customerId: input.customerId ?? null,
      type: input.type,
      status: input.status ?? "OPEN",
      requesterName: input.requesterName ?? null,
      requesterEmail: input.requesterEmail ?? null,
      requesterPhone: input.requesterPhone ?? null,
      note: input.note ?? null,
      resolvedAt: input.resolvedAt ?? null,
      createdAt: input.createdAt ?? (snapshot.exists ? undefined : nowIso()),
      updatedAt: nowIso(),
    }),
    { merge: true },
  );
}

export async function syncDataExportDocument(input: {
  id: string;
  businessId: string;
  requestedByUserId: string;
  format: string;
  scope: string;
  status?: string;
  fileUrl?: string | null;
  note?: string | null;
  completedAt?: string | null;
  createdAt?: string;
}) {
  const db = getFirebaseAdminDb();
  const ref = db.collection(COLLECTIONS.dataExports).doc(input.id);
  const snapshot = await ref.get();

  await ref.set(
    compact({
      id: input.id,
      businessId: input.businessId,
      requestedByUserId: input.requestedByUserId,
      format: input.format,
      scope: input.scope,
      status: input.status ?? "PENDING",
      fileUrl: input.fileUrl ?? null,
      note: input.note ?? null,
      completedAt: input.completedAt ?? null,
      createdAt: input.createdAt ?? (snapshot.exists ? undefined : nowIso()),
      updatedAt: nowIso(),
    }),
    { merge: true },
  );
}

function buildSlotLockDocIds(input: {
  professionalId: string;
  startsAtUtc: Date;
  endsAtUtc: Date;
  stepMinutes?: number;
}) {
  const ids: string[] = [];
  const stepMinutes = input.stepMinutes ?? 15;
  const cursor = new Date(input.startsAtUtc);

  while (cursor < input.endsAtUtc) {
    const timestamp = cursor.toISOString().replace(/[:.]/g, "-");
    ids.push(`${input.professionalId}_${timestamp}`);
    cursor.setUTCMinutes(cursor.getUTCMinutes() + stepMinutes);
  }

  return ids;
}

export async function acquireAppointmentSlotLocks(input: {
  appointmentId: string;
  businessId: string;
  professionalId: string;
  startsAtUtc: Date;
  endsAtUtc: Date;
}) {
  const db = getFirebaseAdminDb();
  const lockIds = buildSlotLockDocIds(input);

  await db.runTransaction(async (transaction: Transaction) => {
    for (const lockId of lockIds) {
      const ref = db.collection(COLLECTIONS.appointmentSlotLocks).doc(lockId);
      const snapshot = await transaction.get(ref);

      if (snapshot.exists && snapshot.data()?.appointmentId !== input.appointmentId) {
        throw new Error("Esse horario acabou de ser reservado. Escolha outro horario.");
      }

      transaction.set(ref, {
        id: lockId,
        appointmentId: input.appointmentId,
        businessId: input.businessId,
        professionalId: input.professionalId,
        startsAtUtc: input.startsAtUtc.toISOString(),
        endsAtUtc: input.endsAtUtc.toISOString(),
        createdAt: nowIso(),
      });
    }
  });

  return lockIds;
}

export async function releaseAppointmentSlotLocks(input: {
  professionalId: string;
  startsAtUtc: Date;
  endsAtUtc: Date;
}) {
  const db = getFirebaseAdminDb();
  const batch = db.batch();
  const lockIds = buildSlotLockDocIds(input);

  lockIds.forEach((lockId) => {
    const ref = db.collection(COLLECTIONS.appointmentSlotLocks).doc(lockId);
    batch.delete(ref);
  });

  await batch.commit();
}
