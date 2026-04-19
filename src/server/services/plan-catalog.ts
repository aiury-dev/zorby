import { BillingInterval, BillingProvider, PlanCode } from "@/lib/domain-enums";

export type StaticPlan = {
  id: string;
  code: PlanCode;
  name: string;
  description: string | null;
  billingProvider: BillingProvider;
  trialDays: number;
  monthlyPriceCents: number | null;
  yearlyPriceCents: number | null;
  maxProfessionals: number | null;
  maxServices: number | null;
  maxMonthlyAppointments: number | null;
  maxLocations: number | null;
  customDomainEnabled: boolean;
  whatsappEnabled: boolean;
  remindersEnabled: boolean;
  scheduleBlocksEnabled: boolean;
  basicReportsEnabled: boolean;
  advancedReportsEnabled: boolean;
  googleCalendarEnabled: boolean;
  advancedBrandingEnabled: boolean;
  prepaymentEnabled: boolean;
  publicApiEnabled: boolean;
  fullDataExportEnabled: boolean;
  prioritySupportEnabled: boolean;
};

const STATIC_PLANS: StaticPlan[] = [
  {
    id: "plan_starter",
    code: PlanCode.STARTER,
    name: "Starter",
    description: "Plano de entrada para profissionais solo.",
    billingProvider: BillingProvider.MERCADOPAGO,
    trialDays: 14,
    monthlyPriceCents: 4900,
    yearlyPriceCents: null,
    maxProfessionals: 1,
    maxServices: 3,
    maxMonthlyAppointments: 100,
    maxLocations: 1,
    customDomainEnabled: false,
    whatsappEnabled: false,
    remindersEnabled: true,
    scheduleBlocksEnabled: false,
    basicReportsEnabled: false,
    advancedReportsEnabled: false,
    googleCalendarEnabled: false,
    advancedBrandingEnabled: false,
    prepaymentEnabled: false,
    publicApiEnabled: false,
    fullDataExportEnabled: false,
    prioritySupportEnabled: false,
  },
  {
    id: "plan_pro",
    code: PlanCode.PRO,
    name: "Pro",
    description: "Plano para equipes pequenas com automações e domínio próprio.",
    billingProvider: BillingProvider.MERCADOPAGO,
    trialDays: 0,
    monthlyPriceCents: 9900,
    yearlyPriceCents: 89000,
    maxProfessionals: 3,
    maxServices: null,
    maxMonthlyAppointments: null,
    maxLocations: 1,
    customDomainEnabled: true,
    whatsappEnabled: true,
    remindersEnabled: true,
    scheduleBlocksEnabled: true,
    basicReportsEnabled: true,
    advancedReportsEnabled: false,
    googleCalendarEnabled: true,
    advancedBrandingEnabled: false,
    prepaymentEnabled: false,
    publicApiEnabled: false,
    fullDataExportEnabled: false,
    prioritySupportEnabled: false,
  },
  {
    id: "plan_business",
    code: PlanCode.BUSINESS,
    name: "Business",
    description: "Plano para operações maiores com multiunidades e integrações.",
    billingProvider: BillingProvider.MERCADOPAGO,
    trialDays: 0,
    monthlyPriceCents: 19900,
    yearlyPriceCents: 189000,
    maxProfessionals: null,
    maxServices: null,
    maxMonthlyAppointments: null,
    maxLocations: null,
    customDomainEnabled: true,
    whatsappEnabled: true,
    remindersEnabled: true,
    scheduleBlocksEnabled: true,
    basicReportsEnabled: true,
    advancedReportsEnabled: true,
    googleCalendarEnabled: true,
    advancedBrandingEnabled: true,
    prepaymentEnabled: true,
    publicApiEnabled: true,
    fullDataExportEnabled: true,
    prioritySupportEnabled: true,
  },
];

export function getPlansCatalog() {
  return [...STATIC_PLANS].sort(
    (left, right) =>
      (left.monthlyPriceCents ?? Number.MAX_SAFE_INTEGER) -
      (right.monthlyPriceCents ?? Number.MAX_SAFE_INTEGER),
  );
}

export function getPlanByCode(planCode: PlanCode) {
  return STATIC_PLANS.find((plan) => plan.code === planCode) ?? null;
}

export function getPlanPriceCents(plan: StaticPlan, interval: BillingInterval) {
  return interval === BillingInterval.YEARLY
    ? plan.yearlyPriceCents ?? plan.monthlyPriceCents
    : plan.monthlyPriceCents;
}
