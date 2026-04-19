import { randomUUID } from "crypto";
import { MembershipRole, OnboardingStep, ProfessionalStatus, SubscriptionStatus } from "@/lib/domain-enums";
import { getFirebaseAdminAuth, getFirebaseAdminDb } from "@/lib/firebase-admin";
import { slugify } from "@/lib/utils";
import {
  getAvailabilitiesForBusinessFromFirestore,
  getBusinessSettingsFromFirestore,
  getDiscoverableBusinessesFromFirestore,
  getPrimaryMembershipFromFirestore,
  getProfessionalsForBusinessFromFirestore,
  getPublicBusinessBySlugFromFirestore,
  getServicesForBusinessFromFirestore,
  getUserByIdFromFirestore,
} from "@/server/services/firestore-read";
import { getPlanByCode } from "@/server/services/plan-catalog";
import {
  syncBusinessDocument,
  syncBusinessSubscriptionSummary,
  syncMembershipDocument,
  syncProfessionalDocument,
  syncUserDocument,
} from "@/server/services/firebase-sync";

type GeocodableBusinessAddress = {
  addressLine1?: string | null;
  addressLine2?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
};

export function hasCompleteBusinessAddress(address: GeocodableBusinessAddress) {
  return Boolean(
    address.addressLine1?.trim() &&
      address.neighborhood?.trim() &&
      address.city?.trim() &&
      address.state?.trim() &&
      address.postalCode?.trim(),
  );
}

export function buildBusinessAddressLabel(address: GeocodableBusinessAddress) {
  return [
    address.addressLine1,
    address.addressLine2,
    address.neighborhood,
    address.city,
    address.state,
    address.postalCode,
    address.country || "BR",
  ]
    .filter(Boolean)
    .join(", ");
}

export async function geocodeBusinessAddress(address: GeocodableBusinessAddress) {
  if (!hasCompleteBusinessAddress(address)) {
    return null;
  }

  const query = buildBusinessAddressLabel(address);
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", query);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");

  try {
    const response = await fetch(url, {
      cache: "no-store",
      headers: {
        "User-Agent": "Zorby/1.0 (booking discovery geocoder)",
        "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.7",
      },
    });

    if (!response.ok) {
      return null;
    }

    const results = (await response.json()) as Array<{ lat: string; lon: string }>;
    const match = results[0];

    if (!match) {
      return null;
    }

    return {
      latitude: Number(match.lat),
      longitude: Number(match.lon),
    };
  } catch {
    return null;
  }
}

export async function generateUniqueBusinessSlug(name: string) {
  const base = slugify(name) || "agenda";
  let candidate = base;
  let suffix = 1;
  const db = getFirebaseAdminDb();

  while (true) {
    const [businesses, professionals, services] = await Promise.all([
      db.collection("businesses").where("slug", "==", candidate).limit(1).get(),
      db.collection("professionals").where("slug", "==", candidate).limit(1).get(),
      db.collection("services").where("slug", "==", candidate).limit(1).get(),
    ]);

    if (businesses.empty && professionals.empty && services.empty) {
      return candidate;
    }

    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
}

export async function getPrimaryMembership(userId: string) {
  return getPrimaryMembershipFromFirestore(userId);
}

export async function createBusinessForUser(input: {
  userId: string;
  businessName: string;
  userName: string;
  userEmail: string;
  userImage?: string | null;
  userPhone?: string | null;
}) {
  const businessId = randomUUID();
  const professionalId = randomUUID();
  const slug = await generateUniqueBusinessSlug(input.businessName);
  const professionalSlug = await generateUniqueBusinessSlug(
    `${slug}-${input.userName || "profissional"}`,
  );
  const starterPlan = getPlanByCode("STARTER");
  const now = new Date();
  const trialEnd = starterPlan?.trialDays
    ? new Date(now.getTime() + starterPlan.trialDays * 24 * 60 * 60 * 1000)
    : null;

  await Promise.all([
    syncUserDocument({
      id: input.userId,
      email: input.userEmail,
      name: input.userName,
      image: input.userImage ?? null,
      phone: input.userPhone ?? null,
    }),
    syncBusinessDocument({
      id: businessId,
      name: input.businessName,
      slug,
      category: "OTHER",
      status: "DRAFT",
      onboardingStep: OnboardingStep.BUSINESS,
      email: input.userEmail,
      publicBookingEnabled: false,
      publicBookingPaused: false,
      indexable: true,
      timezone: "America/Sao_Paulo",
    }),
    syncMembershipDocument({
      businessId,
      userId: input.userId,
      role: MembershipRole.OWNER,
    }),
    syncProfessionalDocument({
      id: professionalId,
      businessId,
      displayName: input.userName.trim() || input.businessName,
      publicDisplayName: input.userName.trim() || input.businessName,
      email: input.userEmail,
      slug: professionalSlug,
      status: ProfessionalStatus.ACTIVE,
      acceptsOnlineBookings: true,
      sortOrder: 0,
      serviceIds: [],
    }),
  ]);

  if (starterPlan) {
    await syncBusinessSubscriptionSummary({
      businessId,
      subscription: {
        id: randomUUID(),
        status:
          starterPlan.trialDays > 0 ? SubscriptionStatus.TRIALING : SubscriptionStatus.ACTIVE,
        billingInterval: "MONTHLY",
        providerSubscriptionId: null,
        currentPeriodStart: now.toISOString(),
        currentPeriodEnd: (trialEnd ?? now).toISOString(),
        trialEnd: trialEnd?.toISOString() ?? null,
        cancelAtPeriodEnd: false,
        newBookingsBlockedAt: null,
        plan: {
          id: starterPlan.id,
          code: starterPlan.code,
          name: starterPlan.name,
          maxProfessionals: starterPlan.maxProfessionals,
          maxServices: starterPlan.maxServices,
          maxMonthlyAppointments: starterPlan.maxMonthlyAppointments,
          fullDataExportEnabled: starterPlan.fullDataExportEnabled,
          whatsappEnabled: starterPlan.whatsappEnabled,
        },
      },
    }).catch(() => undefined);
  }

  return {
    id: businessId,
    name: input.businessName,
    slug,
  };
}

export async function ensureDefaultProfessionalForBusiness(input: {
  businessId: string;
  businessSlug: string;
  userId: string;
}) {
  const professionals = await getProfessionalsForBusinessFromFirestore(input.businessId);
  const existingProfessional = professionals.find((professional) => professional.status !== "ARCHIVED");

  if (existingProfessional) {
    return { id: existingProfessional.id };
  }

  const firestoreUser = await getUserByIdFromFirestore(input.userId).catch(() => null);
  const authUser = firestoreUser
    ? null
    : await getFirebaseAdminAuth()
        .getUser(input.userId)
        .catch(() => null);

  const displayName =
    firestoreUser?.name?.trim() ||
    authUser?.displayName?.trim() ||
    "Profissional principal";
  const email = firestoreUser?.email ?? authUser?.email ?? null;
  const professionalId = randomUUID();

  await syncProfessionalDocument({
    id: professionalId,
    businessId: input.businessId,
    displayName,
    publicDisplayName: displayName,
    email,
    slug: await generateUniqueBusinessSlug(`${input.businessSlug}-${displayName}`),
    status: ProfessionalStatus.ACTIVE,
    acceptsOnlineBookings: true,
    sortOrder: 0,
    serviceIds: [],
  }).catch(() => undefined);

  return { id: professionalId };
}

export async function getPublicBusinessBySlug(slug: string) {
  return getPublicBusinessBySlugFromFirestore(slug);
}

export async function getDiscoverableBusinesses(limit = 36) {
  return getDiscoverableBusinessesFromFirestore(limit);
}

export async function getBusinessSettings(businessId: string) {
  return getBusinessSettingsFromFirestore(businessId);
}

export async function getServicesForBusiness(businessId: string) {
  return getServicesForBusinessFromFirestore(businessId);
}

export async function getProfessionalsForBusiness(businessId: string) {
  return getProfessionalsForBusinessFromFirestore(businessId);
}

export async function getAvailabilitiesForBusiness(businessId: string) {
  return getAvailabilitiesForBusinessFromFirestore(businessId);
}
