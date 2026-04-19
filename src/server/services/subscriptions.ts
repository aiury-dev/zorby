import { randomUUID } from "crypto";
import { endOfDay } from "date-fns";
import { BillingInterval, PlanCode, SubscriptionStatus } from "@/lib/domain-enums";
import {
  createMercadoPagoPreapproval,
  getMercadoPagoPreapproval,
  type MercadoPagoPreapproval,
  updateMercadoPagoPreapproval,
} from "@/lib/mercadopago";
import { getBusinessSettingsFromFirestore } from "@/server/services/firestore-read";
import { getPlanByCode, getPlanPriceCents } from "@/server/services/plan-catalog";
import { syncBusinessSubscriptionSummary } from "@/server/services/firebase-sync";

function mapMercadoPagoStatus(status: string): SubscriptionStatus {
  switch (status) {
    case "authorized":
      return SubscriptionStatus.ACTIVE;
    case "pending":
      return SubscriptionStatus.PAST_DUE;
    case "paused":
      return SubscriptionStatus.PAUSED;
    case "cancelled":
    case "cancelled_by_payer":
      return SubscriptionStatus.CANCELED;
    default:
      return SubscriptionStatus.INCOMPLETE;
  }
}

function inferBillingInterval(preapproval: MercadoPagoPreapproval): BillingInterval {
  const frequencyType = preapproval.auto_recurring?.frequency_type;
  const frequency = preapproval.auto_recurring?.frequency;

  if (frequencyType === "months" && frequency === 12) {
    return BillingInterval.YEARLY;
  }

  return BillingInterval.MONTHLY;
}

function resolvePlanCodeFromMercadoPago(preapproval: MercadoPagoPreapproval): PlanCode | null {
  const mapping = new Map<string, PlanCode>();

  if (process.env.MERCADO_PAGO_STARTER_PLAN_ID) {
    mapping.set(process.env.MERCADO_PAGO_STARTER_PLAN_ID, PlanCode.STARTER);
  }

  if (process.env.MERCADO_PAGO_PRO_MONTHLY_PLAN_ID) {
    mapping.set(process.env.MERCADO_PAGO_PRO_MONTHLY_PLAN_ID, PlanCode.PRO);
  }

  if (process.env.MERCADO_PAGO_PRO_YEARLY_PLAN_ID) {
    mapping.set(process.env.MERCADO_PAGO_PRO_YEARLY_PLAN_ID, PlanCode.PRO);
  }

  if (process.env.MERCADO_PAGO_BUSINESS_MONTHLY_PLAN_ID) {
    mapping.set(process.env.MERCADO_PAGO_BUSINESS_MONTHLY_PLAN_ID, PlanCode.BUSINESS);
  }

  if (process.env.MERCADO_PAGO_BUSINESS_YEARLY_PLAN_ID) {
    mapping.set(process.env.MERCADO_PAGO_BUSINESS_YEARLY_PLAN_ID, PlanCode.BUSINESS);
  }

  if (preapproval.preapproval_plan_id && mapping.has(preapproval.preapproval_plan_id)) {
    return mapping.get(preapproval.preapproval_plan_id) ?? null;
  }

  return null;
}

export async function syncSubscriptionFromMercadoPagoPreapproval(
  preapproval: MercadoPagoPreapproval,
  businessId?: string,
) {
  const targetBusinessId =
    businessId ?? preapproval.external_reference?.replace("business:", "");

  if (!targetBusinessId) {
    throw new Error("Webhook do Mercado Pago sem external_reference do negocio.");
  }

  const business = await getBusinessSettingsFromFirestore(targetBusinessId);
  const existing = business?.subscriptions[0] ?? null;
  const requestedPlanCode =
    resolvePlanCodeFromMercadoPago(preapproval) ??
    ((existing?.plan.code as PlanCode | undefined) ?? PlanCode.STARTER);
  const plan = getPlanByCode(requestedPlanCode);

  if (!plan) {
    throw new Error("Plano local nao encontrado para sincronizar a assinatura.");
  }

  const nextEndDate = preapproval.next_payment_date
    ? new Date(preapproval.next_payment_date)
    : endOfDay(new Date());
  const interval = inferBillingInterval(preapproval);
  const status = mapMercadoPagoStatus(preapproval.status);
  const blockedAt =
    status === SubscriptionStatus.ACTIVE || status === SubscriptionStatus.TRIALING
      ? null
      : new Date();
  const now = new Date();
  const currentPeriodStart = preapproval.last_modified
    ? new Date(preapproval.last_modified)
    : now;

  const subscription = {
    id: existing?.id ?? randomUUID(),
    status,
    billingInterval: interval,
    providerSubscriptionId: preapproval.id,
    currentPeriodStart: currentPeriodStart.toISOString(),
    currentPeriodEnd: nextEndDate.toISOString(),
    trialEnd:
      existing?.trialEnd instanceof Date
        ? existing.trialEnd.toISOString()
        : existing?.trialEnd ?? null,
    cancelAtPeriodEnd: existing?.cancelAtPeriodEnd ?? false,
    newBookingsBlockedAt: blockedAt?.toISOString() ?? null,
    plan: {
      id: plan.id,
      code: plan.code,
      name: plan.name,
      maxProfessionals: plan.maxProfessionals,
      maxServices: plan.maxServices,
      maxMonthlyAppointments: plan.maxMonthlyAppointments,
      fullDataExportEnabled: plan.fullDataExportEnabled,
      whatsappEnabled: plan.whatsappEnabled,
    },
  };

  await syncBusinessSubscriptionSummary({
    businessId: targetBusinessId,
    subscription,
  }).catch(() => undefined);

  return subscription;
}

export async function syncSubscriptionFromMercadoPagoId(preapprovalId: string) {
  const preapproval = await getMercadoPagoPreapproval(preapprovalId);
  return syncSubscriptionFromMercadoPagoPreapproval(preapproval);
}

function resolveMercadoPagoPlanId(planCode: PlanCode, interval: BillingInterval) {
  if (planCode === PlanCode.STARTER) {
    return process.env.MERCADO_PAGO_STARTER_PLAN_ID || undefined;
  }

  if (planCode === PlanCode.PRO) {
    return interval === BillingInterval.YEARLY
      ? process.env.MERCADO_PAGO_PRO_YEARLY_PLAN_ID || undefined
      : process.env.MERCADO_PAGO_PRO_MONTHLY_PLAN_ID || undefined;
  }

  return interval === BillingInterval.YEARLY
    ? process.env.MERCADO_PAGO_BUSINESS_YEARLY_PLAN_ID || undefined
    : process.env.MERCADO_PAGO_BUSINESS_MONTHLY_PLAN_ID || undefined;
}

export async function createMercadoPagoSubscriptionCheckout(input: {
  businessId: string;
  payerEmail: string;
  planCode: PlanCode;
  interval: BillingInterval;
  reason: string;
  backUrl: string;
}) {
  const plan = getPlanByCode(input.planCode);

  if (!plan) {
    throw new Error("Plano local nao encontrado.");
  }

  const preapprovalPlanId = resolveMercadoPagoPlanId(input.planCode, input.interval);
  const amountInCents = getPlanPriceCents(plan, input.interval);

  if (!amountInCents) {
    throw new Error("Preco do plano nao configurado.");
  }

  const preapproval = await createMercadoPagoPreapproval({
    reason: input.reason,
    externalReference: `business:${input.businessId}`,
    payerEmail: input.payerEmail,
    preapprovalPlanId,
    transactionAmount: amountInCents / 100,
    frequency: input.interval === BillingInterval.YEARLY ? 12 : 1,
    frequencyType: "months",
    backUrl: input.backUrl,
    status: "pending",
  });

  await syncSubscriptionFromMercadoPagoPreapproval(preapproval, input.businessId);

  if (!preapproval.init_point) {
    throw new Error("O Mercado Pago nao retornou um link de pagamento para a assinatura.");
  }

  return preapproval;
}

export async function cancelMercadoPagoSubscription(providerSubscriptionId: string) {
  const preapproval = await updateMercadoPagoPreapproval(providerSubscriptionId, {
    status: "cancelled",
  });

  return syncSubscriptionFromMercadoPagoPreapproval(preapproval);
}

export async function getMercadoPagoManagementLink(providerSubscriptionId: string) {
  const preapproval = await getMercadoPagoPreapproval(providerSubscriptionId);
  return preapproval.init_point ?? null;
}
