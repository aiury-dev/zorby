import { MembershipRole, OnboardingStep, SubscriptionStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";

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
