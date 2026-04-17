import { redirect } from "next/navigation";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { saveAvailabilityStep } from "@/server/actions/dashboard";
import { prisma } from "@/lib/prisma";
import { ensureDefaultProfessionalForBusiness } from "@/server/services/business";
import { getCurrentMembership } from "@/server/services/me";
import { getOnboardingStepPath } from "@/server/services/onboarding";

const weekdays = [
  { value: 0, label: "Segunda-feira" },
  { value: 1, label: "Terça-feira" },
  { value: 2, label: "Quarta-feira" },
  { value: 3, label: "Quinta-feira" },
  { value: 4, label: "Sexta-feira" },
  { value: 5, label: "Sábado" },
  { value: 6, label: "Domingo" },
];

const timeOptions = [
  { value: 360, label: "06:00" },
  { value: 420, label: "07:00" },
  { value: 480, label: "08:00" },
  { value: 540, label: "09:00" },
  { value: 600, label: "10:00" },
  { value: 660, label: "11:00" },
  { value: 720, label: "12:00" },
  { value: 780, label: "13:00" },
  { value: 840, label: "14:00" },
  { value: 900, label: "15:00" },
  { value: 960, label: "16:00" },
  { value: 1020, label: "17:00" },
  { value: 1080, label: "18:00" },
  { value: 1140, label: "19:00" },
  { value: 1200, label: "20:00" },
  { value: 1260, label: "21:00" },
];

const intervalOptions = [
  { value: 15, label: "15 minutos" },
  { value: 30, label: "30 minutos" },
  { value: 45, label: "45 minutos" },
  { value: 60, label: "60 minutos" },
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
    <OnboardingShell
      currentStep={3}
      title="Defina o primeiro bloco da sua agenda"
      description="Agora vamos transformar seus serviços em horários reais. Escolha quem atende, em quais dias e com qual intervalo entre cada reserva."
      sidebarTitle="Agenda organizada é o que faz o link parecer profissional"
      sidebarDescription="Uma disponibilidade bem configurada evita conflito de horários, melhora a experiência do cliente e reduz retrabalho no atendimento."
      sidebarContent={
        <div className="space-y-4 text-sm">
          <div>
            <p className="font-semibold text-white">O que você está definindo aqui</p>
            <p className="mt-1 leading-6 text-white/65">
              Primeiro dia de atendimento, janela de horário e intervalo base entre reservas.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-white/80">
            Profissional padrão criado:{" "}
            <span className="font-semibold text-white">{professionals[0]?.displayName}</span>
          </div>
        </div>
      }
      headerContent={
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-[color:var(--color-border-default)] bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-fg-muted)]">
              Horário inicial
            </p>
            <p className="mt-2 text-sm text-[color:var(--color-fg-default)]">
              Comece com uma janela principal e refine depois no painel.
            </p>
          </div>
          <div className="rounded-2xl border border-[color:var(--color-border-default)] bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-fg-muted)]">
              Simplicidade
            </p>
            <p className="mt-2 text-sm text-[color:var(--color-fg-default)]">
              O objetivo agora é publicar rápido, não mapear toda a agenda perfeita.
            </p>
          </div>
          <div className="rounded-2xl border border-[color:var(--color-border-default)] bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-fg-muted)]">
              Evolução
            </p>
            <p className="mt-2 text-sm text-[color:var(--color-fg-default)]">
              Depois você poderá adicionar mais blocos, exceções e profissionais.
            </p>
          </div>
        </div>
      }
    >
      <form action={saveAvailabilityStep} className="grid gap-8">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="grid gap-6">
            <div className="grid gap-6 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-[color:var(--color-fg-default)]">Profissional</span>
                <select
                  name="professionalId"
                  className="h-12 w-full rounded-2xl border border-[color:var(--color-border-default)] bg-white px-4 text-sm outline-none transition focus:border-[color:var(--color-brand-500)] focus:ring-4 focus:ring-blue-100"
                >
                  {professionals.map((professional) => (
                    <option key={professional.id} value={professional.id}>
                      {professional.displayName}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-[color:var(--color-fg-default)]">Dia da semana</span>
                <select
                  name="dayOfWeek"
                  defaultValue={0}
                  className="h-12 w-full rounded-2xl border border-[color:var(--color-border-default)] bg-white px-4 text-sm outline-none transition focus:border-[color:var(--color-brand-500)] focus:ring-4 focus:ring-blue-100"
                >
                  {weekdays.map((day) => (
                    <option key={day.value} value={day.value}>
                      {day.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-[color:var(--color-fg-default)]">Início do atendimento</span>
                <select
                  name="startMinutes"
                  defaultValue={540}
                  className="h-12 w-full rounded-2xl border border-[color:var(--color-border-default)] bg-white px-4 text-sm outline-none transition focus:border-[color:var(--color-brand-500)] focus:ring-4 focus:ring-blue-100"
                >
                  {timeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-[color:var(--color-fg-default)]">Fim do atendimento</span>
                <select
                  name="endMinutes"
                  defaultValue={1080}
                  className="h-12 w-full rounded-2xl border border-[color:var(--color-border-default)] bg-white px-4 text-sm outline-none transition focus:border-[color:var(--color-brand-500)] focus:ring-4 focus:ring-blue-100"
                >
                  {timeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-semibold text-[color:var(--color-fg-default)]">Intervalo base dos slots</span>
                <select
                  name="slotIntervalMinutes"
                  defaultValue={30}
                  className="h-12 w-full rounded-2xl border border-[color:var(--color-border-default)] bg-white px-4 text-sm outline-none transition focus:border-[color:var(--color-brand-500)] focus:ring-4 focus:ring-blue-100"
                >
                  {intervalOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="flex justify-end">
              <button className="inline-flex h-12 items-center rounded-full bg-[color:var(--color-brand-500)] px-6 text-sm font-semibold text-white transition hover:bg-[color:var(--color-brand-600)]">
                Salvar disponibilidade e continuar
              </button>
            </div>
          </div>

          <aside className="rounded-[30px] border border-[color:var(--color-border-default)] bg-slate-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-fg-muted)]">
              Prévia da agenda
            </p>
            <div className="mt-4 space-y-3">
              <div className="rounded-2xl bg-white px-4 py-4">
                <p className="text-sm font-semibold text-[color:var(--color-fg-default)]">Dia inicial</p>
                <p className="mt-1 text-sm text-[color:var(--color-fg-muted)]">Segunda-feira</p>
              </div>
              <div className="rounded-2xl bg-white px-4 py-4">
                <p className="text-sm font-semibold text-[color:var(--color-fg-default)]">Janela sugerida</p>
                <p className="mt-1 text-sm text-[color:var(--color-fg-muted)]">09:00 até 18:00</p>
              </div>
              <div className="rounded-2xl bg-white px-4 py-4">
                <p className="text-sm font-semibold text-[color:var(--color-fg-default)]">Ritmo de agenda</p>
                <p className="mt-1 text-sm text-[color:var(--color-fg-muted)]">Slots de 30 minutos</p>
              </div>
            </div>
          </aside>
        </div>
      </form>
    </OnboardingShell>
  );
}
