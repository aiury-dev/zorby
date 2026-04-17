import { MembershipRole, OnboardingStep, SubscriptionStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";

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

  while (true) {
    const existing = await prisma.business.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });

    if (!existing) {
      return candidate;
    }

    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
}

export async function getPrimaryMembership(userId: string) {
  return prisma.membership.findFirst({
    where: { userId },
    orderBy: { createdAt: "asc" },
    include: {
      business: {
        include: {
          subscriptions: {
            include: { plan: true },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      },
    },
  });
}

export async function createBusinessForUser(input: {
  userId: string;
  businessName: string;
  userName: string;
  userEmail: string;
}) {
  const slug = await generateUniqueBusinessSlug(input.businessName);
  const starterPlan = await prisma.plan.findUnique({
    where: { code: "STARTER" },
  });

  return prisma.$transaction(async (tx) => {
    const business = await tx.business.create({
      data: {
        name: input.businessName,
        slug,
        category: "OTHER",
        status: "DRAFT",
        onboardingStep: OnboardingStep.BUSINESS,
        email: input.userEmail,
      },
    });

    await tx.membership.create({
      data: {
        businessId: business.id,
        userId: input.userId,
        role: MembershipRole.OWNER,
      },
    });

    await tx.professional.create({
      data: {
        businessId: business.id,
        displayName: input.userName.trim() || input.businessName,
        publicDisplayName: input.userName.trim() || input.businessName,
        email: input.userEmail,
        slug: await generateUniqueBusinessSlug(`${business.slug}-${input.userName || "profissional"}`),
      },
    });

    if (starterPlan) {
      const now = new Date();
      const trialEnd = new Date(now.getTime() + starterPlan.trialDays * 24 * 60 * 60 * 1000);

      await tx.subscription.create({
        data: {
          businessId: business.id,
          planId: starterPlan.id,
          provider: "MERCADOPAGO",
          status: starterPlan.trialDays > 0 ? SubscriptionStatus.TRIALING : SubscriptionStatus.ACTIVE,
          billingInterval: "MONTHLY",
          trialStart: starterPlan.trialDays > 0 ? now : null,
          trialEnd: starterPlan.trialDays > 0 ? trialEnd : null,
          currentPeriodStart: now,
          currentPeriodEnd: starterPlan.trialDays > 0 ? trialEnd : now,
        },
      });
    }

    return business;
  });
}

export async function ensureDefaultProfessionalForBusiness(input: {
  businessId: string;
  businessSlug: string;
  userId: string;
}) {
  const existingProfessional = await prisma.professional.findFirst({
    where: {
      businessId: input.businessId,
      deletedAt: null,
    },
    select: {
      id: true,
    },
  });

  if (existingProfessional) {
    return existingProfessional;
  }

  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: {
      name: true,
      email: true,
    },
  });

  return prisma.professional.create({
    data: {
      businessId: input.businessId,
      displayName: user?.name?.trim() || "Profissional principal",
      publicDisplayName: user?.name?.trim() || "Profissional principal",
      email: user?.email ?? null,
      slug: await generateUniqueBusinessSlug(`${input.businessSlug}-${user?.name || "profissional"}`),
    },
    select: {
      id: true,
    },
  });
}

export async function getPublicBusinessBySlug(slug: string) {
  return prisma.business.findFirst({
    where: {
      slug,
      deletedAt: null,
      indexable: true,
    },
    include: {
      services: {
        where: { isActive: true, deletedAt: null },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        include: {
          variants: {
            where: { isActive: true, deletedAt: null },
            orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
          },
        },
      },
      professionals: {
        where: { status: "ACTIVE", deletedAt: null, acceptsOnlineBookings: true },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        include: {
          services: {
            select: {
              serviceId: true,
            },
          },
          availabilities: {
            where: { isActive: true },
            orderBy: [{ dayOfWeek: "asc" }, { startMinutes: "asc" }],
            select: {
              id: true,
              dayOfWeek: true,
              startMinutes: true,
              endMinutes: true,
              slotIntervalMinutes: true,
            },
          },
        },
      },
      reviews: {
        where: { isPublic: true, status: "PUBLISHED" },
        orderBy: { publishedAt: "desc" },
        take: 6,
      },
      subscriptions: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: { plan: true },
      },
      locations: {
        where: { deletedAt: null },
        orderBy: { isPrimary: "desc" },
      },
    },
  });
}

export async function getDiscoverableBusinesses(limit = 36) {
  const businesses = await prisma.business.findMany({
    where: {
      deletedAt: null,
      indexable: true,
      publicBookingEnabled: true,
      publicBookingPaused: false,
      status: "ACTIVE",
    },
    orderBy: [{ createdAt: "desc" }],
    take: limit,
    select: {
      id: true,
      name: true,
      slug: true,
      category: true,
      description: true,
      addressLine1: true,
      city: true,
      neighborhood: true,
      state: true,
      postalCode: true,
      country: true,
      latitude: true,
      longitude: true,
      logoUrl: true,
      coverImageUrl: true,
      brandPrimaryColor: true,
      phone: true,
      professionals: {
        where: {
          status: "ACTIVE",
          deletedAt: null,
          acceptsOnlineBookings: true,
        },
        select: {
          id: true,
        },
      },
      services: {
        where: {
          isActive: true,
          deletedAt: null,
        },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        take: 4,
        select: {
          id: true,
          name: true,
          priceCents: true,
          durationMinutes: true,
        },
      },
      reviews: {
        where: {
          isPublic: true,
          status: "PUBLISHED",
        },
        select: {
          id: true,
          rating: true,
        },
      },
    },
  });

  return businesses.map((business) => ({
    ...business,
    latitude: business.latitude ? Number(business.latitude) : null,
    longitude: business.longitude ? Number(business.longitude) : null,
    reviewCount: business.reviews.length,
    averageRating: business.reviews.length
      ? business.reviews.reduce((sum, review) => sum + review.rating, 0) / business.reviews.length
      : null,
    professionalsCount: business.professionals.length,
    addressLabel: buildBusinessAddressLabel(business),
  }));
}
