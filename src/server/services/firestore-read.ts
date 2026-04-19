import type {
  AppointmentStatus,
  BillingInterval,
  BusinessCategory,
  MembershipRole,
  OnboardingStep,
  ProfessionalStatus,
  ServicePrepaymentMode,
  SubscriptionStatus,
} from "@/lib/domain-enums";
import { getFirebaseAdminDb } from "@/lib/firebase-admin";

type FirestoreUserDoc = {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
  phone?: string | null;
  status?: string;
  locale?: string | null;
  createdAt?: string;
};

type FirestoreMembershipDoc = {
  id: string;
  businessId: string;
  userId: string;
  role: MembershipRole | string;
  createdAt?: string;
};

type FirestoreBusinessSubscriptionDoc = {
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
};

type FirestoreBusinessDoc = {
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
  subscription?: FirestoreBusinessSubscriptionDoc | null;
};

type FirestoreServiceDoc = {
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
};

type FirestoreServiceVariantDoc = {
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
};

type FirestoreProfessionalDoc = {
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
};

type FirestoreAvailabilityDoc = {
  id: string;
  businessId: string;
  professionalId: string;
  dayOfWeek: number;
  startMinutes: number;
  endMinutes: number;
  slotIntervalMinutes: number;
  capacity?: number;
  isActive?: boolean;
};

type FirestoreAvailabilityBlockDoc = {
  id: string;
  businessId: string;
  professionalId?: string | null;
  title?: string | null;
  reason?: string | null;
  allDay?: boolean;
  startsAtUtc: string;
  endsAtUtc: string;
  createdAt?: string;
};

type FirestoreCustomerDoc = {
  id: string;
  businessId: string;
  fullName: string;
  email?: string | null;
  phone: string;
  timezone?: string | null;
  lastBookedAt?: string | null;
  createdAt?: string;
};

type FirestoreAppointmentDoc = {
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
  createdAt?: string;
  updatedAt?: string;
};

type FirestoreAppointmentStatusHistoryDoc = {
  id: string;
  appointmentId: string;
  fromStatus?: string | null;
  toStatus: string;
  note?: string | null;
  changedByUserId?: string | null;
  createdAt?: string;
};

type FirestoreAppointmentAccessTokenDoc = {
  id: string;
  businessId: string;
  appointmentId: string;
  purpose: string;
  tokenHash: string;
  expiresAt: string;
  usedAt?: string | null;
  createdAt?: string;
};

type FirestoreNotificationDoc = {
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
};

type FirestoreNotificationTemplateDoc = {
  id: string;
  businessId: string;
  channel: string;
  type: string;
  subject?: string | null;
  body: string;
  isActive?: boolean;
  createdAt?: string;
};

type FirestoreReviewDoc = {
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
};

type FirestorePrivacyRequestDoc = {
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
};

type FirestoreDataExportDoc = {
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
};

function sortByCreatedAtAsc<T extends { createdAt?: string }>(items: T[]) {
  return [...items].sort((left, right) => (left.createdAt ?? "").localeCompare(right.createdAt ?? ""));
}

function mapBusinessSubscription(input: FirestoreBusinessSubscriptionDoc | null | undefined) {
  if (!input) {
    return [];
  }

  return [
    {
      id: input.id,
      status: input.status as SubscriptionStatus,
      billingInterval: input.billingInterval as BillingInterval,
      providerSubscriptionId: input.providerSubscriptionId ?? null,
      currentPeriodStart: input.currentPeriodStart ? new Date(input.currentPeriodStart) : null,
      currentPeriodEnd: input.currentPeriodEnd ? new Date(input.currentPeriodEnd) : null,
      trialEnd: input.trialEnd ? new Date(input.trialEnd) : null,
      cancelAtPeriodEnd: input.cancelAtPeriodEnd ?? false,
      newBookingsBlockedAt: input.newBookingsBlockedAt ? new Date(input.newBookingsBlockedAt) : null,
      plan: {
        id: input.plan.id,
        code: input.plan.code,
        name: input.plan.name,
        maxProfessionals: input.plan.maxProfessionals ?? null,
        maxServices: input.plan.maxServices ?? null,
        maxMonthlyAppointments: input.plan.maxMonthlyAppointments ?? null,
        fullDataExportEnabled: input.plan.fullDataExportEnabled ?? false,
        whatsappEnabled: input.plan.whatsappEnabled ?? false,
      },
    },
  ];
}

async function getCollectionDocsByField<T>(
  collectionName: string,
  fieldName: string,
  value: string,
): Promise<T[]> {
  const db = getFirebaseAdminDb();
  const snapshot = await db.collection(collectionName).where(fieldName, "==", value).get();
  return snapshot.docs.map((doc) => doc.data() as T);
}

async function getAllCollectionDocs<T>(collectionName: string): Promise<T[]> {
  const db = getFirebaseAdminDb();
  const snapshot = await db.collection(collectionName).get();
  return snapshot.docs.map((doc) => doc.data() as T);
}

function buildAddressLabel(input: {
  addressLine1?: string | null;
  addressLine2?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
}) {
  return [
    input.addressLine1,
    input.addressLine2,
    input.neighborhood,
    input.city,
    input.state,
    input.postalCode,
    input.country || "BR",
  ]
    .filter(Boolean)
    .join(", ");
}

function mapService(
  service: FirestoreServiceDoc,
  variants: FirestoreServiceVariantDoc[] = [],
) {
  return {
    id: service.id,
    businessId: service.businessId,
    name: service.name,
    slug: service.slug ?? null,
    description: service.description ?? null,
    durationMinutes: service.durationMinutes,
    bufferAfterMinutes: service.bufferAfterMinutes ?? 0,
    priceCents: service.priceCents,
    colorHex: service.colorHex ?? null,
    isActive: service.isActive ?? true,
    sortOrder: service.sortOrder ?? 0,
    prepaymentMode: (service.prepaymentMode ?? "NONE") as ServicePrepaymentMode,
    prepaymentAmountCents: service.prepaymentAmountCents ?? null,
    variants: variants
      .filter((variant) => variant.serviceId === service.id && (variant.isActive ?? true))
      .sort((left, right) => (left.sortOrder ?? 0) - (right.sortOrder ?? 0))
      .map((variant) => ({
        id: variant.id,
        name: variant.name,
        durationMinutes: variant.durationMinutes,
        priceCents: variant.priceCents,
        prepaymentMode: variant.prepaymentMode ?? "NONE",
        prepaymentAmountCents: variant.prepaymentAmountCents ?? null,
        sortOrder: variant.sortOrder ?? 0,
        isActive: variant.isActive ?? true,
      })),
  };
}

function mapProfessional(
  professional: FirestoreProfessionalDoc,
  availabilities: FirestoreAvailabilityDoc[],
  servicesById?: Map<string, FirestoreServiceDoc>,
) {
  return {
    id: professional.id,
    businessId: professional.businessId,
    displayName: professional.displayName,
    publicDisplayName: professional.publicDisplayName ?? null,
    roleLabel: professional.roleLabel ?? null,
    slug: professional.slug ?? null,
    email: professional.email ?? null,
    phone: professional.phone ?? null,
    bio: professional.bio ?? null,
    photoUrl: professional.photoUrl ?? null,
    status: professional.status ?? "ACTIVE",
    acceptsOnlineBookings: professional.acceptsOnlineBookings ?? true,
    sortOrder: professional.sortOrder ?? 0,
    services: (professional.serviceIds ?? []).map((serviceId) => {
      const service = servicesById?.get(serviceId);

      return {
        id: `${professional.id}_${serviceId}`,
        serviceId,
        service: service
          ? {
              id: service.id,
              name: service.name,
            }
          : {
              id: serviceId,
              name: "Serviço",
            },
      };
    }),
    availabilities: availabilities
      .filter((item) => item.professionalId === professional.id && (item.isActive ?? true))
      .sort((left, right) => left.dayOfWeek - right.dayOfWeek || left.startMinutes - right.startMinutes)
      .map((item) => ({
        id: item.id,
        dayOfWeek: item.dayOfWeek,
        startMinutes: item.startMinutes,
        endMinutes: item.endMinutes,
        slotIntervalMinutes: item.slotIntervalMinutes,
        capacity: item.capacity ?? 1,
      })),
  };
}

export async function getPrimaryMembershipFromFirestore(userId: string) {
  const [membershipDocs, businesses] = await Promise.all([
    getCollectionDocsByField<FirestoreMembershipDoc>("memberships", "userId", userId),
    getAllCollectionDocs<FirestoreBusinessDoc>("businesses"),
  ]);

  const membership = sortByCreatedAtAsc(membershipDocs)[0];
  if (!membership) {
    return null;
  }

  const business = businesses.find((item) => item.id === membership.businessId);
  if (!business) {
    return null;
  }

  return {
    id: membership.id,
    businessId: membership.businessId,
    userId: membership.userId,
    role: membership.role as MembershipRole,
    business: {
      id: business.id,
      name: business.name,
      slug: business.slug,
      category: business.category as BusinessCategory,
      status: business.status,
      timezone: business.timezone ?? "America/Sao_Paulo",
      onboardingStep: (business.onboardingStep ?? "BUSINESS") as OnboardingStep,
      publicBookingEnabled: business.publicBookingEnabled ?? false,
      publicBookingPaused: business.publicBookingPaused ?? false,
      indexable: business.indexable ?? true,
      addressLine1: business.addressLine1 ?? null,
      addressLine2: business.addressLine2 ?? null,
      neighborhood: business.neighborhood ?? null,
      city: business.city ?? null,
      state: business.state ?? null,
      postalCode: business.postalCode ?? null,
      country: business.country ?? "BR",
      phone: business.phone ?? null,
      description: business.description ?? null,
      bookingTitle: business.bookingTitle ?? null,
      subscriptions: mapBusinessSubscription(business.subscription),
    },
  };
}

export async function getUserByIdFromFirestore(userId: string) {
  const docs = await getCollectionDocsByField<FirestoreUserDoc>("users", "id", userId);
  const user = docs[0];

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name ?? null,
    image: user.image ?? null,
    phone: user.phone ?? null,
    status: user.status ?? "ACTIVE",
    locale: user.locale ?? "pt-BR",
    createdAt: user.createdAt ? new Date(user.createdAt) : null,
  };
}

export async function getUserByEmailFromFirestore(email: string) {
  const docs = await getCollectionDocsByField<FirestoreUserDoc>("users", "email", email);
  const user = docs[0];

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name ?? null,
    image: user.image ?? null,
    phone: user.phone ?? null,
    status: user.status ?? "ACTIVE",
    locale: user.locale ?? "pt-BR",
    createdAt: user.createdAt ? new Date(user.createdAt) : null,
  };
}

export async function getBusinessSettingsFromFirestore(businessId: string) {
  const docs = await getCollectionDocsByField<FirestoreBusinessDoc>("businesses", "id", businessId);
  const business = docs[0];

  if (!business) {
    return null;
  }

  return {
    ...business,
    timezone: business.timezone ?? "America/Sao_Paulo",
    publicBookingEnabled: business.publicBookingEnabled ?? false,
    publicBookingPaused: business.publicBookingPaused ?? false,
    indexable: business.indexable ?? true,
    bookingTitle: business.bookingTitle ?? null,
    seoTitle: business.seoTitle ?? null,
    seoDescription: business.seoDescription ?? null,
    addressLine1: business.addressLine1 ?? null,
    addressLine2: business.addressLine2 ?? null,
    neighborhood: business.neighborhood ?? null,
    city: business.city ?? null,
    state: business.state ?? null,
    postalCode: business.postalCode ?? null,
    country: business.country ?? "BR",
    latitude: business.latitude ?? null,
    longitude: business.longitude ?? null,
    description: business.description ?? null,
    logoUrl: business.logoUrl ?? null,
    coverImageUrl: business.coverImageUrl ?? null,
    phone: business.phone ?? null,
    category: business.category as BusinessCategory,
    status: business.status,
    onboardingStep: (business.onboardingStep ?? "BUSINESS") as OnboardingStep,
    brandPrimaryColor: business.brandPrimaryColor ?? "#1664E8",
    brandSecondaryColor: business.brandSecondaryColor ?? "#1254C7",
    cancellationPolicyText: business.cancellationPolicyText ?? null,
    minimumLeadTimeMinutes: business.minimumLeadTimeMinutes ?? 60,
    cancellationNoticeMinutes: business.cancellationNoticeMinutes ?? 120,
    rescheduleNoticeMinutes: business.rescheduleNoticeMinutes ?? 120,
    bookingLinkTokenTtlMinutes: business.bookingLinkTokenTtlMinutes ?? 1440,
    subscriptions: mapBusinessSubscription(business.subscription),
  };
}

export async function getServicesForBusinessFromFirestore(businessId: string) {
  const [services, variants] = await Promise.all([
    getCollectionDocsByField<FirestoreServiceDoc>("services", "businessId", businessId),
    getCollectionDocsByField<FirestoreServiceVariantDoc>("serviceVariants", "businessId", businessId),
  ]);

  return services
    .filter((service) => service.businessId === businessId)
    .sort((left, right) => (left.sortOrder ?? 0) - (right.sortOrder ?? 0))
    .map((service) => mapService(service, variants));
}

export async function getProfessionalsForBusinessFromFirestore(businessId: string) {
  const [professionals, availabilities, services] = await Promise.all([
    getCollectionDocsByField<FirestoreProfessionalDoc>("professionals", "businessId", businessId),
    getCollectionDocsByField<FirestoreAvailabilityDoc>("availabilities", "businessId", businessId),
    getCollectionDocsByField<FirestoreServiceDoc>("services", "businessId", businessId),
  ]);

  const servicesById = new Map(services.map((service) => [service.id, service]));

  return professionals
    .sort((left, right) => (left.sortOrder ?? 0) - (right.sortOrder ?? 0))
    .map((professional) => mapProfessional(professional, availabilities, servicesById));
}

export async function getAvailabilitiesForBusinessFromFirestore(businessId: string) {
  const [availabilities, professionals] = await Promise.all([
    getCollectionDocsByField<FirestoreAvailabilityDoc>("availabilities", "businessId", businessId),
    getCollectionDocsByField<FirestoreProfessionalDoc>("professionals", "businessId", businessId),
  ]);

  const professionalMap = new Map(
    professionals.map((professional) => [professional.id, professional.displayName]),
  );

  return availabilities
    .sort((left, right) => left.dayOfWeek - right.dayOfWeek || left.startMinutes - right.startMinutes)
    .map((availability) => ({
      id: availability.id,
      businessId: availability.businessId,
      professionalId: availability.professionalId,
      dayOfWeek: availability.dayOfWeek,
      startMinutes: availability.startMinutes,
      endMinutes: availability.endMinutes,
      slotIntervalMinutes: availability.slotIntervalMinutes,
      capacity: availability.capacity ?? 1,
      isActive: availability.isActive ?? true,
      professional: {
        displayName: professionalMap.get(availability.professionalId) ?? "Profissional",
      },
    }));
}

export async function getAvailabilityBlocksForBusinessFromFirestore(input: {
  businessId: string;
  professionalId?: string | null;
  startUtc?: Date;
  endUtc?: Date;
}) {
  const blocks = await getCollectionDocsByField<FirestoreAvailabilityBlockDoc>(
    "availabilityBlocks",
    "businessId",
    input.businessId,
  );

  return blocks
    .filter((block) => {
      const startsAtUtc = new Date(block.startsAtUtc);
      const endsAtUtc = new Date(block.endsAtUtc);
      const matchesProfessional =
        !input.professionalId ||
        block.professionalId === input.professionalId ||
        block.professionalId === null ||
        block.professionalId === undefined;
      const matchesWindow =
        (!input.startUtc || endsAtUtc > input.startUtc) &&
        (!input.endUtc || startsAtUtc < input.endUtc);

      return matchesProfessional && matchesWindow;
    })
    .sort((left, right) => left.startsAtUtc.localeCompare(right.startsAtUtc))
    .map((block) => ({
      id: block.id,
      businessId: block.businessId,
      professionalId: block.professionalId ?? null,
      title: block.title ?? null,
      reason: block.reason ?? null,
      allDay: block.allDay ?? false,
      startsAtUtc: new Date(block.startsAtUtc),
      endsAtUtc: new Date(block.endsAtUtc),
      createdAt: block.createdAt ? new Date(block.createdAt) : null,
    }));
}

export async function getPublicBusinessBySlugFromFirestore(slug: string) {
  const [businesses, services, serviceVariants, professionals, availabilities, reviews] = await Promise.all([
    getCollectionDocsByField<FirestoreBusinessDoc>("businesses", "slug", slug),
    getAllCollectionDocs<FirestoreServiceDoc>("services"),
    getAllCollectionDocs<FirestoreServiceVariantDoc>("serviceVariants"),
    getAllCollectionDocs<FirestoreProfessionalDoc>("professionals"),
    getAllCollectionDocs<FirestoreAvailabilityDoc>("availabilities"),
    getAllCollectionDocs<FirestoreReviewDoc>("reviews"),
  ]);

  const business = businesses.find((item) => item.slug === slug && (item.indexable ?? true));
  if (!business) {
    return null;
  }

  const businessServices = services
    .filter((service) => service.businessId === business.id && (service.isActive ?? true))
    .sort((left, right) => (left.sortOrder ?? 0) - (right.sortOrder ?? 0))
    .map((service) => mapService(service, serviceVariants));

  const businessProfessionals = professionals
    .filter(
      (professional) =>
        professional.businessId === business.id &&
        (professional.status ?? "ACTIVE") === "ACTIVE" &&
        (professional.acceptsOnlineBookings ?? true),
    )
    .sort((left, right) => (left.sortOrder ?? 0) - (right.sortOrder ?? 0))
    .map((professional) => mapProfessional(professional, availabilities));

  const businessReviews = reviews
    .filter(
      (review) =>
        review.businessId === business.id &&
        (review.isPublic ?? false) &&
        (review.status ?? "PUBLISHED") === "PUBLISHED",
    )
    .sort((left, right) => (right.publishedAt ?? "").localeCompare(left.publishedAt ?? ""))
    .slice(0, 6)
    .map((review) => ({
      id: review.id,
      rating: review.rating,
      body: review.body ?? null,
      customerNameSnapshot: review.customerNameSnapshot,
    }));

  return {
    id: business.id,
    name: business.name,
    legalName: null,
    slug: business.slug,
    category: business.category as BusinessCategory,
    status: business.status,
    description: business.description ?? null,
    phone: business.phone ?? null,
    email: business.email ?? null,
    timezone: business.timezone ?? "America/Sao_Paulo",
    logoUrl: business.logoUrl ?? null,
    coverImageUrl: business.coverImageUrl ?? null,
    brandPrimaryColor: business.brandPrimaryColor ?? "#1664E8",
    brandSecondaryColor: business.brandSecondaryColor ?? "#1254C7",
    publicBookingEnabled: business.publicBookingEnabled ?? false,
    publicBookingPaused: business.publicBookingPaused ?? false,
    indexable: business.indexable ?? true,
    bookingTitle: business.bookingTitle ?? null,
    seoTitle: business.seoTitle ?? null,
    seoDescription: business.seoDescription ?? null,
    addressLine1: business.addressLine1 ?? null,
    addressLine2: business.addressLine2 ?? null,
    neighborhood: business.neighborhood ?? null,
    city: business.city ?? null,
    state: business.state ?? null,
    postalCode: business.postalCode ?? null,
    country: business.country ?? "BR",
    latitude: business.latitude ?? null,
    longitude: business.longitude ?? null,
    cancellationPolicyText: business.cancellationPolicyText ?? null,
    cancellationNoticeMinutes: business.cancellationNoticeMinutes ?? 120,
    rescheduleNoticeMinutes: business.rescheduleNoticeMinutes ?? 120,
    minimumLeadTimeMinutes: business.minimumLeadTimeMinutes ?? 60,
    bookingLinkTokenTtlMinutes: business.bookingLinkTokenTtlMinutes ?? 1440,
    onboardingStep: (business.onboardingStep ?? "BUSINESS") as OnboardingStep,
    services: businessServices,
    professionals: businessProfessionals,
    reviews: businessReviews,
    subscriptions: mapBusinessSubscription(business.subscription),
    locations: [
      {
        id: `${business.id}_primary`,
        name: business.name,
        isPrimary: true,
        addressLine1: business.addressLine1 ?? null,
        addressLine2: business.addressLine2 ?? null,
        neighborhood: business.neighborhood ?? null,
        city: business.city ?? null,
        state: business.state ?? null,
        postalCode: business.postalCode ?? null,
        country: business.country ?? "BR",
        latitude: business.latitude ?? null,
        longitude: business.longitude ?? null,
      },
    ],
  };
}

export async function getDiscoverableBusinessesFromFirestore(limit = 36) {
  const [businesses, services, professionals, reviews] = await Promise.all([
    getAllCollectionDocs<FirestoreBusinessDoc>("businesses"),
    getAllCollectionDocs<FirestoreServiceDoc>("services"),
    getAllCollectionDocs<FirestoreProfessionalDoc>("professionals"),
    getAllCollectionDocs<FirestoreReviewDoc>("reviews"),
  ]);

  return businesses
    .filter(
      (business) =>
        (business.indexable ?? true) &&
        (business.publicBookingEnabled ?? false) &&
        !(business.publicBookingPaused ?? false) &&
        business.status === "ACTIVE",
    )
    .slice(0, limit)
    .map((business) => {
      const businessServices = services
        .filter((service) => service.businessId === business.id && (service.isActive ?? true))
        .sort((left, right) => (left.sortOrder ?? 0) - (right.sortOrder ?? 0))
        .slice(0, 4)
        .map((service) => ({
          id: service.id,
          name: service.name,
          priceCents: service.priceCents,
          durationMinutes: service.durationMinutes,
        }));

      const businessReviews = reviews.filter(
        (review) =>
          review.businessId === business.id &&
          (review.isPublic ?? false) &&
          (review.status ?? "PUBLISHED") === "PUBLISHED",
      );

      return {
        id: business.id,
        name: business.name,
        slug: business.slug,
        category: business.category as BusinessCategory,
        description: business.description ?? null,
        addressLine1: business.addressLine1 ?? null,
        city: business.city ?? null,
        neighborhood: business.neighborhood ?? null,
        state: business.state ?? null,
        postalCode: business.postalCode ?? null,
        country: business.country ?? "BR",
        latitude: business.latitude ?? null,
        longitude: business.longitude ?? null,
        logoUrl: business.logoUrl ?? null,
        coverImageUrl: business.coverImageUrl ?? null,
        brandPrimaryColor: business.brandPrimaryColor ?? "#1664E8",
        phone: business.phone ?? null,
        reviewCount: businessReviews.length,
        averageRating: businessReviews.length
          ? businessReviews.reduce((sum, review) => sum + review.rating, 0) / businessReviews.length
          : null,
        professionalsCount: professionals.filter(
          (professional) =>
            professional.businessId === business.id &&
            (professional.status ?? "ACTIVE") === "ACTIVE" &&
            (professional.acceptsOnlineBookings ?? true),
        ).length,
        addressLabel: buildAddressLabel(business),
        services: businessServices,
      };
    });
}

type AppointmentWithProfessional = {
  id: string;
  businessId: string;
  professionalId: string;
  serviceId: string;
  serviceVariantId: string | null;
  customerId: string;
  status: AppointmentStatus | string;
  source: string;
  startsAtUtc: Date;
  endsAtUtc: Date;
  timezoneSnapshot: string;
  customerTimezone: string | null;
  customerNameSnapshot: string;
  customerEmailSnapshot: string | null;
  customerPhoneSnapshot: string;
  serviceNameSnapshot: string;
  serviceVariantSnapshot: string | null;
  priceCents: number;
  cancelledAt: Date | null;
  completedAt: Date | null;
  noShowMarkedAt: Date | null;
  professional: {
    displayName: string;
    roleLabel: string | null;
  };
};

function mapAppointment(
  appointment: FirestoreAppointmentDoc,
  professionalMap: Map<string, FirestoreProfessionalDoc>,
): AppointmentWithProfessional {
  const professional = professionalMap.get(appointment.professionalId);

  return {
    id: appointment.id,
    businessId: appointment.businessId,
    professionalId: appointment.professionalId,
    serviceId: appointment.serviceId,
    serviceVariantId: appointment.serviceVariantId ?? null,
    customerId: appointment.customerId,
    status: appointment.status as AppointmentStatus,
    source: appointment.source ?? "PUBLIC_PAGE",
    startsAtUtc: new Date(appointment.startsAtUtc),
    endsAtUtc: new Date(appointment.endsAtUtc),
    timezoneSnapshot: appointment.timezoneSnapshot,
    customerTimezone: appointment.customerTimezone ?? null,
    customerNameSnapshot: appointment.customerNameSnapshot,
    customerEmailSnapshot: appointment.customerEmailSnapshot ?? null,
    customerPhoneSnapshot: appointment.customerPhoneSnapshot,
    serviceNameSnapshot: appointment.serviceNameSnapshot,
    serviceVariantSnapshot: appointment.serviceVariantSnapshot ?? null,
    priceCents: appointment.priceCents,
    cancelledAt: appointment.cancelledAt ? new Date(appointment.cancelledAt) : null,
    completedAt: appointment.completedAt ? new Date(appointment.completedAt) : null,
    noShowMarkedAt: appointment.noShowMarkedAt ? new Date(appointment.noShowMarkedAt) : null,
    professional: {
      displayName: professional?.displayName ?? "Profissional",
      roleLabel: professional?.roleLabel ?? null,
    },
  };
}

export async function getAppointmentsForBusinessFromFirestore(businessId: string) {
  const [appointments, professionals] = await Promise.all([
    getCollectionDocsByField<FirestoreAppointmentDoc>("appointments", "businessId", businessId),
    getCollectionDocsByField<FirestoreProfessionalDoc>("professionals", "businessId", businessId),
  ]);

  const professionalMap = new Map(professionals.map((professional) => [professional.id, professional]));

  return appointments
    .map((appointment) => mapAppointment(appointment, professionalMap))
    .sort((left, right) => left.startsAtUtc.getTime() - right.startsAtUtc.getTime());
}

export async function getAppointmentByIdFromFirestore(appointmentId: string) {
  const db = getFirebaseAdminDb();
  const snapshot = await db.collection("appointments").doc(appointmentId).get();

  if (!snapshot.exists) {
    return null;
  }

  const appointment = snapshot.data() as FirestoreAppointmentDoc;
  const professionalDocs = await getCollectionDocsByField<FirestoreProfessionalDoc>(
    "professionals",
    "businessId",
    appointment.businessId,
  );
  const professionalMap = new Map(
    professionalDocs.map((professional) => [professional.id, professional]),
  );

  return mapAppointment(appointment, professionalMap);
}

export async function getCustomerByBusinessPhoneFromFirestore(input: {
  businessId: string;
  phone: string;
}) {
  const customers = await getCollectionDocsByField<FirestoreCustomerDoc>("customers", "phone", input.phone);

  const customer = customers
    .filter((item) => item.businessId === input.businessId)
    .sort((left, right) => (left.createdAt ?? "").localeCompare(right.createdAt ?? ""))[0];

  if (!customer) {
    return null;
  }

  return {
    id: customer.id,
    businessId: customer.businessId,
    fullName: customer.fullName,
    email: customer.email ?? null,
    phone: customer.phone,
    timezone: customer.timezone ?? null,
    lastBookedAt: customer.lastBookedAt ? new Date(customer.lastBookedAt) : null,
  };
}

export async function getCustomerByIdFromFirestore(input: {
  businessId: string;
  customerId: string;
}) {
  const docs = await getCollectionDocsByField<FirestoreCustomerDoc>("customers", "id", input.customerId);
  const customer = docs.find((item) => item.businessId === input.businessId);

  if (!customer) {
    return null;
  }

  return {
    id: customer.id,
    businessId: customer.businessId,
    fullName: customer.fullName,
    email: customer.email ?? null,
    phone: customer.phone,
    timezone: customer.timezone ?? null,
    lastBookedAt: customer.lastBookedAt ? new Date(customer.lastBookedAt) : null,
    createdAt: customer.createdAt ? new Date(customer.createdAt) : null,
  };
}

export async function getCustomersForBusinessFromFirestore(businessId: string) {
  const [customers, appointments] = await Promise.all([
    getCollectionDocsByField<FirestoreCustomerDoc>("customers", "businessId", businessId),
    getCollectionDocsByField<FirestoreAppointmentDoc>("appointments", "businessId", businessId),
  ]);

  const appointmentsByCustomer = appointments.reduce<Map<string, FirestoreAppointmentDoc[]>>(
    (map, appointment) => {
      const current = map.get(appointment.customerId) ?? [];
      current.push(appointment);
      map.set(appointment.customerId, current);
      return map;
    },
    new Map(),
  );

  return customers
    .sort((left, right) => (right.createdAt ?? "").localeCompare(left.createdAt ?? ""))
    .map((customer) => {
      const customerAppointments = [...(appointmentsByCustomer.get(customer.id) ?? [])].sort(
        (left, right) => right.startsAtUtc.localeCompare(left.startsAtUtc),
      );

      return {
        id: customer.id,
        businessId: customer.businessId,
        fullName: customer.fullName,
        email: customer.email ?? null,
        phone: customer.phone,
        timezone: customer.timezone ?? null,
        lastBookedAt: customer.lastBookedAt ? new Date(customer.lastBookedAt) : null,
        createdAt: customer.createdAt ? new Date(customer.createdAt) : null,
        appointments: customerAppointments.map((appointment) => ({
          id: appointment.id,
          startsAtUtc: new Date(appointment.startsAtUtc),
          endsAtUtc: new Date(appointment.endsAtUtc),
          status: appointment.status as AppointmentStatus,
          serviceNameSnapshot: appointment.serviceNameSnapshot,
          customerPhoneSnapshot: appointment.customerPhoneSnapshot,
          customerEmailSnapshot: appointment.customerEmailSnapshot ?? null,
          professionalId: appointment.professionalId,
        })),
        _count: {
          appointments: customerAppointments.length,
        },
      };
    });
}

export async function getAppointmentAccessTokenByHashFromFirestore(input: {
  tokenHash: string;
  purpose?: string;
}) {
  const docs = await getCollectionDocsByField<FirestoreAppointmentAccessTokenDoc>(
    "appointmentAccessTokens",
    "tokenHash",
    input.tokenHash,
  );

  const match = docs
    .filter((doc) => !input.purpose || doc.purpose === input.purpose)
    .sort((left, right) => (left.createdAt ?? "").localeCompare(right.createdAt ?? ""))[0];

  if (!match) {
    return null;
  }

  return {
    ...match,
    expiresAt: new Date(match.expiresAt),
    usedAt: match.usedAt ? new Date(match.usedAt) : null,
  };
}

export async function getAppointmentStatusHistoryForAppointmentFromFirestore(appointmentId: string) {
  const docs = await getCollectionDocsByField<FirestoreAppointmentStatusHistoryDoc>(
    "appointmentStatusHistory",
    "appointmentId",
    appointmentId,
  );

  return docs
    .sort((left, right) => (left.createdAt ?? "").localeCompare(right.createdAt ?? ""))
    .map((doc) => ({
      id: doc.id,
      appointmentId: doc.appointmentId,
      fromStatus: doc.fromStatus ?? null,
      toStatus: doc.toStatus,
      note: doc.note ?? null,
      changedByUserId: doc.changedByUserId ?? null,
      createdAt: doc.createdAt ? new Date(doc.createdAt) : null,
    }));
}

export async function getNotificationsForAppointmentFromFirestore(appointmentId: string) {
  const docs = await getCollectionDocsByField<FirestoreNotificationDoc>(
    "notifications",
    "appointmentId",
    appointmentId,
  );

  return docs
    .sort((left, right) => (right.createdAt ?? "").localeCompare(left.createdAt ?? ""))
    .map((doc) => ({
      ...doc,
      subject: doc.subject ?? null,
      body: doc.body ?? null,
      payload: doc.payload ?? null,
      scheduledFor: doc.scheduledFor ? new Date(doc.scheduledFor) : null,
      sentAt: doc.sentAt ? new Date(doc.sentAt) : null,
      failedAt: doc.failedAt ? new Date(doc.failedAt) : null,
    }));
}

export async function getNotificationTemplatesForBusinessFromFirestore(businessId: string) {
  const docs = await getCollectionDocsByField<FirestoreNotificationTemplateDoc>(
    "notificationTemplates",
    "businessId",
    businessId,
  );

  return docs
    .filter((doc) => doc.isActive ?? true)
    .sort((left, right) => (left.createdAt ?? "").localeCompare(right.createdAt ?? ""))
    .map((doc) => ({
      id: doc.id,
      businessId: doc.businessId,
      channel: doc.channel,
      type: doc.type,
      subject: doc.subject ?? null,
      body: doc.body,
      isActive: doc.isActive ?? true,
    }));
}

export async function getReviewsForBusinessFromFirestore(businessId: string) {
  const docs = await getCollectionDocsByField<FirestoreReviewDoc>("reviews", "businessId", businessId);

  return docs
    .sort((left, right) => (right.createdAt ?? "").localeCompare(left.createdAt ?? ""))
    .map((review) => ({
      id: review.id,
      businessId,
      professionalId: review.professionalId,
      appointmentId: review.appointmentId,
      customerId: review.customerId ?? null,
      rating: review.rating,
      title: review.title ?? null,
      body: review.body ?? null,
      customerNameSnapshot: review.customerNameSnapshot,
      status: review.status ?? "PUBLISHED",
      isPublic: review.isPublic ?? true,
      publishedAt: review.publishedAt ? new Date(review.publishedAt) : null,
      createdAt: review.createdAt ? new Date(review.createdAt) : null,
    }));
}

export async function getDataExportByIdFromFirestore(exportId: string) {
  const db = getFirebaseAdminDb();
  const snapshot = await db.collection("dataExports").doc(exportId).get();

  if (!snapshot.exists) {
    return null;
  }

  const data = snapshot.data() as FirestoreDataExportDoc;

  return {
    id: data.id,
    businessId: data.businessId,
    requestedByUserId: data.requestedByUserId,
    format: data.format,
    scope: data.scope,
    status: data.status ?? "PENDING",
    fileUrl: data.fileUrl ?? null,
    note: data.note ?? null,
    completedAt: data.completedAt ? new Date(data.completedAt) : null,
    createdAt: data.createdAt ? new Date(data.createdAt) : null,
  };
}

export async function getDataExportsForBusinessFromFirestore(businessId: string) {
  const docs = await getCollectionDocsByField<FirestoreDataExportDoc>("dataExports", "businessId", businessId);

  return docs
    .sort((left, right) => (right.createdAt ?? "").localeCompare(left.createdAt ?? ""))
    .map((data) => ({
      id: data.id,
      businessId: data.businessId,
      requestedByUserId: data.requestedByUserId,
      format: data.format,
      scope: data.scope,
      status: data.status ?? "PENDING",
      fileUrl: data.fileUrl ?? null,
      note: data.note ?? null,
      completedAt: data.completedAt ? new Date(data.completedAt) : null,
      createdAt: data.createdAt ? new Date(data.createdAt) : null,
    }));
}

export async function getPrivacyRequestsForBusinessFromFirestore(businessId: string) {
  const docs = await getCollectionDocsByField<FirestorePrivacyRequestDoc>(
    "privacyRequests",
    "businessId",
    businessId,
  );

  return docs
    .sort((left, right) => (right.createdAt ?? "").localeCompare(left.createdAt ?? ""))
    .map((request) => ({
      id: request.id,
      businessId: request.businessId,
      customerId: request.customerId ?? null,
      type: request.type,
      status: request.status ?? "OPEN",
      requesterName: request.requesterName ?? null,
      requesterEmail: request.requesterEmail ?? null,
      requesterPhone: request.requesterPhone ?? null,
      note: request.note ?? null,
      resolvedAt: request.resolvedAt ? new Date(request.resolvedAt) : null,
      createdAt: request.createdAt ? new Date(request.createdAt) : null,
    }));
}

export async function getAppointmentsForBusinessDateFromFirestore(input: {
  businessId: string;
  startUtc: Date;
  endUtc: Date;
}) {
  const appointments = await getAppointmentsForBusinessFromFirestore(input.businessId);
  return appointments.filter(
    (appointment) =>
      appointment.startsAtUtc >= input.startUtc && appointment.startsAtUtc <= input.endUtc,
  );
}

export async function getUpcomingAppointmentsFromFirestore(input: {
  businessId: string;
  startsAfter?: Date;
  limit?: number;
}) {
  const now = input.startsAfter ?? new Date();
  const appointments = await getAppointmentsForBusinessFromFirestore(input.businessId);

  return appointments
    .filter((appointment) => appointment.startsAtUtc >= now)
    .slice(0, input.limit ?? 5);
}

export async function getAppointmentStatusBreakdownFromFirestore(input: {
  businessId: string;
  createdAfter: Date;
}) {
  const appointments = await getAppointmentsForBusinessFromFirestore(input.businessId);
  const breakdown = new Map<string, number>();

  for (const appointment of appointments) {
    if (appointment.startsAtUtc < input.createdAfter) {
      continue;
    }

    breakdown.set(appointment.status, (breakdown.get(appointment.status) ?? 0) + 1);
  }

  return Array.from(breakdown.entries()).map(([status, count]) => ({
    status,
    _count: { status: count },
  }));
}

export async function getAppointmentRevenueMonthCentsFromFirestore(input: {
  businessId: string;
  monthStart: Date;
}) {
  const appointments = await getAppointmentsForBusinessFromFirestore(input.businessId);

  return appointments.reduce((sum, appointment) => {
    if (appointment.startsAtUtc < input.monthStart || appointment.status === "CANCELLED") {
      return sum;
    }

    return sum + appointment.priceCents;
  }, 0);
}

export async function countAppointmentsFromFirestore(input: {
  businessId: string;
  predicate?: (appointment: AppointmentWithProfessional) => boolean;
}) {
  const appointments = await getAppointmentsForBusinessFromFirestore(input.businessId);
  if (!input.predicate) {
    return appointments.length;
  }

  return appointments.filter(input.predicate).length;
}
