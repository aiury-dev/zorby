import Link from "next/link";
import { redirect } from "next/navigation";
import { createServiceAction } from "@/server/actions/dashboard";
import { prisma } from "@/lib/prisma";
import { getCurrentMembership } from "@/server/services/me";
import { getOnboardingStepPath } from "@/server/services/onboarding";
import { getCurrentSubscription } from "@/server/services/plans";

type OnboardingServicesPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function OnboardingServicesPage({ searchParams }: OnboardingServicesPageProps) {
  const membership = await getCurrentMembership();

  if (!membership) {
    redirect("/login");
  }

  if (!["SERVICES", "AVAILABILITY", "LINK", "COMPLETED"].includes(membership.business.onboardingStep)) {
    redirect(getOnboardingStepPath(membership.business.onboardingStep));
  }

  const services = await prisma.service.findMany({
    where: { businessId: membership.businessId, deletedAt: null },
    orderBy: { createdAt: "desc" },
  });
  const subscription = await getCurrentSubscription(membership.businessId);
  const maxServices = subscription?.plan.maxServices ?? null;
  const servicesLimitReached = typeof maxServices === "number" && services.length >= maxServices;
  const params = searchParams ? await searchParams : {};
  const error = typeof params.error === "string" ? params.error : null;

  return (
    <main className="flex-1 bg-[linear-gradient(180deg,#f8fafc_0%,#eef4ff_100%)] px-4 py-10 md:px-6">
      <div className="mx-auto max-w-4xl space-y-6 rounded-[32px] border border-[color:var(--color-border-default)] bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.06),0_24px_60px_rgba(15,23,42,0.08)] md:p-10">
        <div className="space-y-3">
          <span className="inline-flex rounded-full border border-[color:var(--color-border-default)] bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-fg-muted)]">
            Etapa 2 de 5
          </span>
          <h1 className="text-3xl font-semibold text-[color:var(--color-fg-default)]">Cadastre seus serviços</h1>
          <p className="text-sm leading-7 text-[color:var(--color-fg-muted)]">
            Pelo menos um serviço ativo já deixa o seu link pronto para começar.
          </p>
          {maxServices ? (
            <p className="text-sm font-medium text-[color:var(--color-fg-muted)]">
              Você está usando {services.length} de {maxServices} serviços disponíveis no plano atual.
            </p>
          ) : null}
        </div>

        {error ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <p className="font-medium">Não foi possível salvar o serviço.</p>
            <p className="mt-1">{error}</p>
          </div>
        ) : null}

        <form action={createServiceAction} className="grid gap-4 md:grid-cols-2">
          <input name="name" placeholder="Nome do serviço" className="h-11 rounded-2xl border border-[color:var(--color-border-default)] px-4 disabled:bg-slate-50" required disabled={servicesLimitReached} />
          <input name="durationMinutes" type="number" min="5" step="5" placeholder="Duração (min)" className="h-11 rounded-2xl border border-[color:var(--color-border-default)] px-4 disabled:bg-slate-50" required disabled={servicesLimitReached} />
          <input name="price" type="number" min="0" step="0.01" placeholder="Preço em reais" className="h-11 rounded-2xl border border-[color:var(--color-border-default)] px-4 disabled:bg-slate-50" required disabled={servicesLimitReached} />
          <input name="colorHex" defaultValue="#1664E8" className="h-11 rounded-2xl border border-[color:var(--color-border-default)] px-4 disabled:bg-slate-50" disabled={servicesLimitReached} />
          <textarea name="description" placeholder="Descrição do serviço" className="min-h-[120px] rounded-2xl border border-[color:var(--color-border-default)] px-4 py-3 md:col-span-2 disabled:bg-slate-50" disabled={servicesLimitReached} />
          <button disabled={servicesLimitReached} className="h-11 rounded-full bg-[color:var(--color-brand-500)] px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300 md:w-fit">
            {servicesLimitReached ? "Limite de serviços atingido" : "Salvar serviço"}
          </button>
        </form>

        <div className="space-y-3">
          {services.map((service) => (
            <div
              key={service.id}
              className="flex items-center justify-between rounded-[24px] border border-[color:var(--color-border-default)] bg-slate-50 px-4 py-3"
            >
              <span className="font-medium text-[color:var(--color-fg-default)]">{service.name}</span>
              <span className="text-sm text-[color:var(--color-fg-muted)]">{service.durationMinutes} min</span>
            </div>
          ))}
        </div>

        {services.length ? (
          <Link
            href="/onboarding/availability"
            className="inline-flex h-11 items-center rounded-full border border-[color:var(--color-border-default)] px-5 text-sm font-semibold text-[color:var(--color-fg-default)]"
          >
            Continuar para disponibilidade
          </Link>
        ) : null}
      </div>
    </main>
  );
}
