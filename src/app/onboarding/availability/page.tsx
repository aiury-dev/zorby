import { redirect } from "next/navigation";
import { saveAvailabilityStep } from "@/server/actions/dashboard";
import { prisma } from "@/lib/prisma";
import { ensureDefaultProfessionalForBusiness } from "@/server/services/business";
import { getCurrentMembership } from "@/server/services/me";
import { getOnboardingStepPath } from "@/server/services/onboarding";

const weekdays = [
  { value: 0, label: "Segunda" },
  { value: 1, label: "Terca" },
  { value: 2, label: "Quarta" },
  { value: 3, label: "Quinta" },
  { value: 4, label: "Sexta" },
  { value: 5, label: "Sabado" },
  { value: 6, label: "Domingo" },
];

export default async function OnboardingAvailabilityPage() {
  const membership = await getCurrentMembership();

  if (!membership) {
    redirect("/login");
  }

  if (!["AVAILABILITY", "LINK", "COMPLETED"].includes(membership.business.onboardingStep)) {
    redirect(getOnboardingStepPath(membership.business.onboardingStep));
  }

  let professionals = await prisma.professional.findMany({
    where: { businessId: membership.businessId, deletedAt: null },
    orderBy: { createdAt: "asc" },
  });

  if (!professionals.length) {
    await ensureDefaultProfessionalForBusiness({
      businessId: membership.businessId,
      businessSlug: membership.business.slug,
      userId: membership.userId,
    });

    professionals = await prisma.professional.findMany({
      where: { businessId: membership.businessId, deletedAt: null },
      orderBy: { createdAt: "asc" },
    });
  }

  return (
    <main className="flex-1 bg-[linear-gradient(180deg,#f8fafc_0%,#eef4ff_100%)] px-4 py-10 md:px-6">
      <div className="mx-auto max-w-3xl space-y-6 rounded-[32px] border border-[color:var(--color-border-default)] bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.06),0_24px_60px_rgba(15,23,42,0.08)] md:p-10">
        <div className="space-y-3">
          <span className="inline-flex rounded-full border border-[color:var(--color-border-default)] bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-fg-muted)]">
            Etapa 3 de 5
          </span>
          <h1 className="text-3xl font-semibold text-[color:var(--color-fg-default)]">Configure a disponibilidade</h1>
          <p className="text-sm leading-7 text-[color:var(--color-fg-muted)]">
            Defina o primeiro bloco de atendimento do profissional.
          </p>
        </div>

        <form action={saveAvailabilityStep} className="grid gap-4 md:grid-cols-2">
          <select name="professionalId" className="h-11 rounded-2xl border border-[color:var(--color-border-default)] px-4">
            {professionals.map((professional) => (
              <option key={professional.id} value={professional.id}>
                {professional.displayName}
              </option>
            ))}
          </select>
          <select name="dayOfWeek" className="h-11 rounded-2xl border border-[color:var(--color-border-default)] px-4">
            {weekdays.map((day) => (
              <option key={day.value} value={day.value}>
                {day.label}
              </option>
            ))}
          </select>
          <input name="startMinutes" type="number" defaultValue="540" className="h-11 rounded-2xl border border-[color:var(--color-border-default)] px-4" />
          <input name="endMinutes" type="number" defaultValue="1080" className="h-11 rounded-2xl border border-[color:var(--color-border-default)] px-4" />
          <input name="slotIntervalMinutes" type="number" defaultValue="30" className="h-11 rounded-2xl border border-[color:var(--color-border-default)] px-4" />
          <button className="h-11 rounded-full bg-[color:var(--color-brand-500)] px-5 text-sm font-semibold text-white md:w-fit">
            Continuar
          </button>
        </form>
      </div>
    </main>
  );
}
