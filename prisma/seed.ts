import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { BillingProvider, PlanCode, PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL ?? "",
});

const prisma = new PrismaClient({ adapter });

async function seedPlans() {
  await prisma.plan.upsert({
    where: { code: PlanCode.STARTER },
    update: {},
    create: {
      code: PlanCode.STARTER,
      name: "Starter",
      description: "Plano de entrada para profissionais solo.",
      billingProvider: BillingProvider.MERCADOPAGO,
      trialDays: 14,
      monthlyPriceCents: 4900,
      maxProfessionals: 1,
      maxServices: 3,
      maxMonthlyAppointments: 100,
      maxLocations: 1,
      remindersEnabled: true,
    },
  });

  await prisma.plan.upsert({
    where: { code: PlanCode.PRO },
    update: {},
    create: {
      code: PlanCode.PRO,
      name: "Pro",
      description: "Plano para equipes pequenas com automações e domínio próprio.",
      billingProvider: BillingProvider.MERCADOPAGO,
      monthlyPriceCents: 9900,
      yearlyPriceCents: 89000,
      maxProfessionals: 3,
      maxLocations: 1,
      customDomainEnabled: true,
      whatsappEnabled: true,
      remindersEnabled: true,
      scheduleBlocksEnabled: true,
      basicReportsEnabled: true,
      googleCalendarEnabled: true,
    },
  });

  await prisma.plan.upsert({
    where: { code: PlanCode.BUSINESS },
    update: {},
    create: {
      code: PlanCode.BUSINESS,
      name: "Business",
      description: "Plano para operações maiores com multiunidades e integrações.",
      billingProvider: BillingProvider.MERCADOPAGO,
      monthlyPriceCents: 19900,
      yearlyPriceCents: 189000,
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
  });
}

async function main() {
  await seedPlans();
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("Erro ao popular os planos iniciais.", error);
    await prisma.$disconnect();
    process.exit(1);
  });
