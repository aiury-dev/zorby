import { startOfMonth } from "date-fns";
import { SubscriptionStatus } from "@/lib/domain-enums";
import {
  countAppointmentsFromFirestore,
  getBusinessSettingsFromFirestore,
  getProfessionalsForBusinessFromFirestore,
  getServicesForBusinessFromFirestore,
} from "@/server/services/firestore-read";

const ACTIVE_SUBSCRIPTION_STATUSES: SubscriptionStatus[] = [
  SubscriptionStatus.ACTIVE,
  SubscriptionStatus.TRIALING,
];

export async function getCurrentSubscription(businessId: string) {
  const business = await getBusinessSettingsFromFirestore(businessId).catch(() => null);
  return business?.subscriptions[0] ?? null;
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

  const count = await countAppointmentsFromFirestore({
    businessId,
    predicate: (appointment) =>
      appointment.startsAtUtc >= monthStart && appointment.status !== "CANCELLED",
  });

  if (count >= planMaxMonthlyAppointments) {
    throw new Error("Seu plano atingiu o limite de agendamentos do mes.");
  }
}

export async function assertServicesLimit(businessId: string, maxServices: number | null) {
  if (!maxServices) {
    return;
  }

  const count = (await getServicesForBusinessFromFirestore(businessId)).length;

  if (count >= maxServices) {
    throw new Error("Seu plano atingiu o limite de servicos.");
  }
}

export async function assertProfessionalsLimit(businessId: string, maxProfessionals: number | null) {
  if (!maxProfessionals) {
    return;
  }

  const count = (await getProfessionalsForBusinessFromFirestore(businessId)).length;

  if (count >= maxProfessionals) {
    throw new Error("Seu plano atingiu o limite de profissionais.");
  }
}
