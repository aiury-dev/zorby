import { endOfDay } from "date-fns";
import { BillingInterval, PlanCode, SubscriptionStatus } from "@/generated/prisma/enums";
import {
  createMercadoPagoPreapproval,
  getMercadoPagoPreapproval,
  type MercadoPagoPreapproval,
  updateMercadoPagoPreapproval,
} from "@/lib/mercadopago";
import { prisma } from "@/lib/prisma";

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

  const requestedPlanCode = resolvePlanCodeFromMercadoPago(preapproval);

  const [existing, requestedPlan] = await Promise.all([
    prisma.subscription.findFirst({
      where: {
        OR: [
          { providerSubscriptionId: preapproval.id },
          { businessId: targetBusinessId },
        ],
      },
      include: { plan: true },
      orderBy: { createdAt: "desc" },
    }),
    requestedPlanCode
      ? prisma.plan.findUnique({
          where: { code: requestedPlanCode },
        })
      : Promise.resolve(null),
  ]);

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

  if (!existing) {
    const fallbackPlan =
      requestedPlan ??
      (await prisma.plan.findUnique({
        where: { code: PlanCode.STARTER },
      }));

    if (!fallbackPlan) {
      throw new Error("Nenhum plano local encontrado para criar a subscription.");
    }

    return prisma.subscription.create({
      data: {
        businessId: targetBusinessId,
        planId: fallbackPlan.id,
        provider: "MERCADOPAGO",
        status,
        billingInterval: interval,
        providerSubscriptionId: preapproval.id,
        providerPriceId: preapproval.preapproval_plan_id ?? null,
        providerCustomerId: preapproval.payer_id ? String(preapproval.payer_id) : null,
        currentPeriodStart,
        currentPeriodEnd: nextEndDate,
        lastWebhookReceivedAt: now,
        newBookingsBlockedAt: blockedAt,
      },
      include: { plan: true },
    });
  }

  return prisma.subscription.update({
    where: { id: existing.id },
    data: {
      planId: requestedPlan?.id ?? existing.planId,
      provider: "MERCADOPAGO",
      providerSubscriptionId: preapproval.id,
      providerPriceId: preapproval.preapproval_plan_id ?? existing.providerPriceId,
      providerCustomerId: preapproval.payer_id ? String(preapproval.payer_id) : existing.providerCustomerId,
      status,
      billingInterval: interval,
      currentPeriodStart,
      currentPeriodEnd: nextEndDate,
      lastWebhookReceivedAt: now,
      gracePeriodEndsAt:
        status === SubscriptionStatus.PAST_DUE ? endOfDay(now) : null,
      delinquentSince:
        status === SubscriptionStatus.PAST_DUE || status === SubscriptionStatus.UNPAID ? now : null,
      newBookingsBlockedAt: blockedAt,
    },
    include: { plan: true },
  });
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
  const plan = await prisma.plan.findUnique({
    where: { code: input.planCode },
  });

  if (!plan) {
    throw new Error("Plano local nao encontrado.");
  }

  const preapprovalPlanId = resolveMercadoPagoPlanId(input.planCode, input.interval);
  const amountInCents =
    input.interval === BillingInterval.YEARLY
      ? plan.yearlyPriceCents ?? plan.monthlyPriceCents
      : plan.monthlyPriceCents;

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
