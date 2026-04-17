import { startOfMonth } from "date-fns";
import { SubscriptionStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

const ACTIVE_SUBSCRIPTION_STATUSES: SubscriptionStatus[] = [
  SubscriptionStatus.ACTIVE,
  SubscriptionStatus.TRIALING,
];

export async function getCurrentSubscription(businessId: string) {
  return prisma.subscription.findFirst({
    where: { businessId },
    orderBy: { createdAt: "desc" },
    include: { plan: true },
  });
}

export async function getPlanState(businessId: string) {
  const subscription = await getCurrentSubscription(businessId);

  return {
    subscription,
    canAcceptNewBookings:
      !!subscription &&
      ACTIVE_SUBSCRIPTION_STATUSES.includes(subscription.status) &&
      !subscription.newBookingsBlockedAt,
  };
}

export async function assertBusinessCanReceiveBookings(businessId: string) {
  const { subscription, canAcceptNewBookings } = await getPlanState(businessId);

  if (!subscription || !canAcceptNewBookings) {
    throw new Error("Este profissional esta temporariamente indisponivel para novos agendamentos.");
  }

  return subscription;
}

export async function assertMonthlyBookingLimit(businessId: string, planMaxMonthlyAppointments: number | null) {
  if (!planMaxMonthlyAppointments) {
    return;
  }

  const monthStart = startOfMonth(new Date());

  const count = await prisma.appointment.count({
    where: {
      businessId,
      createdAt: { gte: monthStart },
      status: { not: "CANCELLED" },
    },
  });

  if (count >= planMaxMonthlyAppointments) {
    throw new Error("Seu plano atingiu o limite de agendamentos do mes.");
  }
}

export async function assertServicesLimit(businessId: string, maxServices: number | null) {
  if (!maxServices) {
    return;
  }

  const count = await prisma.service.count({
    where: {
      businessId,
      deletedAt: null,
    },
  });

  if (count >= maxServices) {
    throw new Error("Seu plano atingiu o limite de servicos.");
  }
}

export async function assertProfessionalsLimit(businessId: string, maxProfessionals: number | null) {
  if (!maxProfessionals) {
    return;
  }

  const count = await prisma.professional.count({
    where: {
      businessId,
      deletedAt: null,
    },
  });

  if (count >= maxProfessionals) {
    throw new Error("Seu plano atingiu o limite de profissionais.");
  }
}
