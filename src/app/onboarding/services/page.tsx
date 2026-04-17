import { redirect } from "next/navigation";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { continueToAvailabilityAction, createServiceAction } from "@/server/actions/dashboard";
import { prisma } from "@/lib/prisma";
import { formatCurrencyBRL } from "@/lib/utils";
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
    <OnboardingShell
      currentStep={2}
      title="Monte um catálogo enxuto e bem apresentado"
      description="Escolha os serviços que mais representam a sua operação agora. Você não precisa colocar tudo de uma vez, só o suficiente para publicar com clareza."
      sidebarTitle="Seu catálogo vende antes mesmo da conversa"
      sidebarDescription="Nome, duração e valor ajudam o cliente a decidir mais rápido. Um catálogo limpo transmite organização e reduz dúvidas."
      sidebarContent={
        <div className="space-y-4 text-sm">
          <div>
            <p className="font-semibold text-white">Plano atual</p>
            <p className="mt-1 leading-6 text-white/65">
              {subscription?.plan.name ?? "Starter"} com{" "}
              {maxServices ? `${services.length} de ${maxServices} serviços em uso` : "serviços ilimitados"}.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-white/80">
            Dica: comece com os serviços mais procurados e refine o catálogo depois.
          </div>
        </div>
      }
      headerContent={
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-[color:var(--color-border-default)] bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-fg-muted)]">
              Clareza
            </p>
            <p className="mt-2 text-sm text-[color:var(--color-fg-default)]">
              Use nomes simples, diretos e reconhecíveis para quem vai agendar.
            </p>
          </div>
          <div className="rounded-2xl border border-[color:var(--color-border-default)] bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-fg-muted)]">
              Ritmo
            </p>
            <p className="mt-2 text-sm text-[color:var(--color-fg-default)]">
              A duração correta ajuda a agenda a ficar consistente desde o início.
            </p>
          </div>
          <div className="rounded-2xl border border-[color:var(--color-border-default)] bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-fg-muted)]">
              Valor percebido
            </p>
            <p className="mt-2 text-sm text-[color:var(--color-fg-default)]">
              Exibir preço aumenta transparência e filtra clientes com mais intenção.
            </p>
          </div>
        </div>
      }
    >
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1.2fr)_360px]">
        <div className="space-y-6">
          {error ? (
            <div className="rounded-[24px] border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
              <p className="font-semibold">Não foi possível salvar o serviço.</p>
              <p className="mt-1 leading-6">{error}</p>
            </div>
          ) : null}

          <form action={createServiceAction} className="rounded-[30px] border border-[color:var(--color-border-default)] bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)] md:p-6">
            <div className="grid gap-5 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-[color:var(--color-fg-default)]">Nome do serviço</span>
                <input
                  name="name"
                  placeholder="Ex.: Corte feminino"
                  className="h-12 w-full rounded-2xl border border-[color:var(--color-border-default)] bg-white px-4 text-sm outline-none transition focus:border-[color:var(--color-brand-500)] focus:ring-4 focus:ring-blue-100 disabled:bg-slate-50"
                  required
                  disabled={servicesLimitReached}
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-[color:var(--color-fg-default)]">Duração</span>
                <input
                  name="durationMinutes"
                  type="number"
                  min="5"
                  step="5"
                  placeholder="Ex.: 45"
                  className="h-12 w-full rounded-2xl border border-[color:var(--color-border-default)] bg-white px-4 text-sm outline-none transition focus:border-[color:var(--color-brand-500)] focus:ring-4 focus:ring-blue-100 disabled:bg-slate-50"
                  required
                  disabled={servicesLimitReached}
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-[color:var(--color-fg-default)]">Preço em reais</span>
                <input
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Ex.: 120"
                  className="h-12 w-full rounded-2xl border border-[color:var(--color-border-default)] bg-white px-4 text-sm outline-none transition focus:border-[color:var(--color-brand-500)] focus:ring-4 focus:ring-blue-100 disabled:bg-slate-50"
                  required
                  disabled={servicesLimitReached}
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-[color:var(--color-fg-default)]">Cor de identificação</span>
                <input
                  name="colorHex"
                  defaultValue="#1664E8"
                  placeholder="#1664E8"
                  className="h-12 w-full rounded-2xl border border-[color:var(--color-border-default)] bg-white px-4 text-sm outline-none transition focus:border-[color:var(--color-brand-500)] focus:ring-4 focus:ring-blue-100 disabled:bg-slate-50"
                  disabled={servicesLimitReached}
                />
              </label>

              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-semibold text-[color:var(--color-fg-default)]">Descrição opcional</span>
                <textarea
                  name="description"
                  placeholder="Descreva rapidamente o que está incluído, para quem é indicado e o que o cliente pode esperar."
                  className="min-h-[150px] w-full rounded-[24px] border border-[color:var(--color-border-default)] bg-white px-4 py-4 text-sm leading-7 outline-none transition focus:border-[color:var(--color-brand-500)] focus:ring-4 focus:ring-blue-100 disabled:bg-slate-50"
                  disabled={servicesLimitReached}
                />
              </label>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-[24px] bg-slate-50 px-4 py-4">
              <p className="max-w-xl text-sm leading-7 text-[color:var(--color-fg-muted)]">
                {servicesLimitReached
                  ? "Você atingiu o limite do plano atual. Continue para a próxima etapa ou faça upgrade depois no painel."
                  : "Salve um serviço e repita quantas vezes precisar antes de avançar para a configuração da agenda."}
              </p>
              <button
                disabled={servicesLimitReached}
                className="inline-flex h-12 items-center rounded-full bg-[color:var(--color-brand-500)] px-6 text-sm font-semibold text-white transition hover:bg-[color:var(--color-brand-600)] disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {servicesLimitReached ? "Limite do plano atingido" : "Salvar serviço"}
              </button>
            </div>
          </form>

          {services.length ? (
            <form action={continueToAvailabilityAction} className="flex justify-end">
              <button className="inline-flex h-12 items-center rounded-full border border-[color:var(--color-border-default)] bg-white px-6 text-sm font-semibold text-[color:var(--color-fg-default)] transition hover:border-[color:var(--color-border-strong)]">
                Continuar para disponibilidade
              </button>
            </form>
          ) : null}
        </div>

        <aside className="space-y-4">
          <div className="rounded-[30px] border border-[color:var(--color-border-default)] bg-slate-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-fg-muted)]">
              Catálogo atual
            </p>
            <p className="mt-2 text-sm leading-7 text-[color:var(--color-fg-muted)]">
              O cliente verá estes serviços na sua página pública.
            </p>
          </div>

          <div className="space-y-3">
            {services.length ? (
              services.map((service) => (
                <article
                  key={service.id}
                  className="rounded-[28px] border border-[color:var(--color-border-default)] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.05)]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <span
                          className="mt-1 inline-flex size-3 rounded-full"
                          style={{ backgroundColor: service.colorHex || "#1664E8" }}
                        />
                        <h2 className="text-base font-semibold text-[color:var(--color-fg-default)]">
                          {service.name}
                        </h2>
                      </div>
                      {service.description ? (
                        <p className="mt-3 text-sm leading-6 text-[color:var(--color-fg-muted)]">
                          {service.description}
                        </p>
                      ) : null}
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-semibold text-[color:var(--color-fg-default)]">
                        {service.durationMinutes} min
                      </p>
                      <p className="mt-1 text-sm text-[color:var(--color-fg-muted)]">
                        {formatCurrencyBRL(service.priceCents)}
                      </p>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-[28px] border border-dashed border-[color:var(--color-border-default)] bg-white p-6 text-sm leading-7 text-[color:var(--color-fg-muted)]">
                Ainda não há serviços cadastrados. Salve pelo menos um item para liberar a próxima etapa.
              </div>
            )}
          </div>
        </aside>
      </div>
    </OnboardingShell>
  );
}
