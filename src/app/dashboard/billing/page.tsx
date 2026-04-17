import { BillingInterval, PlanCode } from "@/generated/prisma/enums";
import { redirect } from "next/navigation";
import { CreditCard, ShieldCheck, Sparkles } from "lucide-react";
import { cancelSubscriptionAction, startSubscriptionCheckoutAction } from "@/server/actions/dashboard";
import { getCurrentMembership } from "@/server/services/me";
import { getCurrentSubscription, getPlanState } from "@/server/services/plans";
import { getMercadoPagoManagementLink } from "@/server/services/subscriptions";
import { prisma } from "@/lib/prisma";
import { formatCurrencyBRL } from "@/lib/utils";

function formatSubscriptionStatus(status?: string | null) {
  if (!status) {
    return "Sem assinatura";
  }

  const labelMap: Record<string, string> = {
    ACTIVE: "Ativa",
    TRIALING: "Em teste",
    PAST_DUE: "Em atraso",
    UNPAID: "Não paga",
    CANCELED: "Cancelada",
    CANCELLED: "Cancelada",
  };

  return labelMap[status] ?? status;
}

export default async function BillingPage() {
  const membership = await getCurrentMembership();

  if (!membership) {
    redirect("/login");
  }

  const [plans, subscription, planState] = await Promise.all([
    prisma.plan.findMany({
      orderBy: { monthlyPriceCents: "asc" },
    }),
    getCurrentSubscription(membership.businessId),
    getPlanState(membership.businessId),
  ]);

  const managementLink = subscription?.providerSubscriptionId
    ? await getMercadoPagoManagementLink(subscription.providerSubscriptionId)
    : null;

  return (
    <div className="space-y-8">
      <header className="overflow-hidden rounded-[32px] border border-[color:var(--color-border-default)] bg-[linear-gradient(135deg,#0f172a_0%,#1d4ed8_100%)] p-6 text-white shadow-[0_24px_70px_rgba(15,23,42,0.18)] md:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.26em] text-white/72">
              <CreditCard className="size-3.5" />
              Assinatura
            </div>
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold leading-tight text-white md:text-[2.75rem]">
                Gerencie planos, cobrança e status do negócio sem sair do painel.
              </h1>
              <p className="text-sm leading-7 text-white/72 md:text-base">
                Assine, acompanhe o status atual e mantenha a operação pronta para receber novos
                agendamentos com segurança.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[420px]">
            <article className="rounded-[24px] border border-white/10 bg-white/10 p-4 backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/55">
                Plano atual
              </p>
              <p className="mt-3 text-2xl font-semibold">{subscription?.plan.name ?? "Sem plano"}</p>
              <p className="mt-2 text-sm text-white/65">
                {subscription?.billingInterval === BillingInterval.YEARLY ? "Anual" : "Mensal"}
              </p>
            </article>
            <article className="rounded-[24px] border border-white/10 bg-white/10 p-4 backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/55">
                Status
              </p>
              <p className="mt-3 text-2xl font-semibold">
                {formatSubscriptionStatus(subscription?.status)}
              </p>
              <p className="mt-2 text-sm text-white/65">
                {planState.canAcceptNewBookings
                  ? "Novos agendamentos liberados"
                  : "Novos agendamentos bloqueados"}
              </p>
            </article>
          </div>
        </div>
      </header>

      <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="rounded-[32px] border border-[color:var(--color-border-default)] bg-white p-6 shadow-[0_20px_50px_rgba(15,23,42,0.05)] md:p-7">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="max-w-2xl space-y-2">
              <h2 className="text-2xl font-semibold text-[color:var(--color-fg-default)]">
                Situação da cobrança
              </h2>
              <p className="text-sm leading-7 text-[color:var(--color-fg-muted)]">
                Mantenha a assinatura regularizada para continuar recebendo novos agendamentos sem
                interrupção.
              </p>
            </div>
            <span
              className={[
                "inline-flex h-fit rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em]",
                planState.canAcceptNewBookings
                  ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
                  : "bg-rose-50 text-rose-700 ring-1 ring-rose-100",
              ].join(" ")}
            >
              {planState.canAcceptNewBookings ? "Operação liberada" : "Ação necessária"}
            </span>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <article className="rounded-[24px] border border-[color:var(--color-border-default)] bg-[color:var(--color-surface-muted)] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--color-fg-muted)]">
                Plano
              </p>
              <p className="mt-3 text-xl font-semibold text-[color:var(--color-fg-default)]">
                {subscription?.plan.name ?? "Sem assinatura"}
              </p>
              <p className="mt-2 text-sm text-[color:var(--color-fg-muted)]">
                {subscription?.status
                  ? `Status atual: ${formatSubscriptionStatus(subscription.status)}`
                  : "Ainda não existe uma assinatura ativa."}
              </p>
            </article>

            <article className="rounded-[24px] border border-[color:var(--color-border-default)] bg-[color:var(--color-surface-muted)] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--color-fg-muted)]">
                Novos agendamentos
              </p>
              <p className="mt-3 text-xl font-semibold text-[color:var(--color-fg-default)]">
                {planState.canAcceptNewBookings ? "Permitidos" : "Bloqueados"}
              </p>
              <p className="mt-2 text-sm text-[color:var(--color-fg-muted)]">
                {planState.canAcceptNewBookings
                  ? "Seu link público segue disponível normalmente."
                  : "Regularize a cobrança para voltar a receber reservas automaticamente."}
              </p>
            </article>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {managementLink ? (
              <a
                href={managementLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-12 items-center rounded-full border border-[color:var(--color-border-default)] px-5 text-sm font-semibold text-[color:var(--color-fg-default)] transition hover:bg-[color:var(--color-surface-muted)]"
              >
                Abrir cobrança no Mercado Pago
              </a>
            ) : null}
            {subscription?.providerSubscriptionId ? (
              <form action={cancelSubscriptionAction}>
                <button className="h-12 rounded-full bg-[color:var(--color-danger)] px-5 text-sm font-semibold text-white shadow-[0_16px_32px_rgba(220,38,38,0.16)] transition hover:opacity-95">
                  Cancelar assinatura
                </button>
              </form>
            ) : null}
          </div>
        </div>

        <div className="grid gap-4">
          <article className="rounded-[30px] border border-[color:var(--color-border-default)] bg-[linear-gradient(180deg,#0f172a_0%,#172554_100%)] p-6 text-white shadow-[0_24px_70px_rgba(15,23,42,0.16)]">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
                <Sparkles className="size-5" />
              </div>
              <div className="space-y-3">
                <h2 className="text-xl font-semibold">Cresça sem mudar de plataforma</h2>
                <p className="text-sm leading-7 text-white/72">
                  Os planos acompanham a operação do negócio e destravam equipe, domínio próprio,
                  automações e exportações mais completas.
                </p>
              </div>
            </div>
          </article>

          <article className="rounded-[28px] border border-[color:var(--color-border-default)] bg-white p-5">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-[color:var(--color-surface-muted)] p-2.5 text-[color:var(--color-brand-500)]">
                <ShieldCheck className="size-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[color:var(--color-fg-default)]">
                  Nada de taxa por agendamento
                </p>
                <p className="mt-2 text-sm leading-7 text-[color:var(--color-fg-muted)]">
                  O faturamento da plataforma continua sendo apenas a assinatura. Seus serviços não
                  sofrem percentual adicional.
                </p>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold text-[color:var(--color-fg-default)]">
            Escolha o plano ideal
          </h2>
          <p className="mt-1 text-sm text-[color:var(--color-fg-muted)]">
            Compare limites, recursos e contrate mensal ou anual direto pelo painel.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {plans.map((plan) => {
            const isCurrentPlan = subscription?.plan.code === plan.code;

            return (
              <article
                key={plan.id}
                className={[
                  "rounded-[30px] border bg-white p-6 shadow-[0_16px_36px_rgba(15,23,42,0.04)]",
                  isCurrentPlan
                    ? "border-[color:var(--color-brand-500)] shadow-[0_20px_46px_rgba(37,99,235,0.12)]"
                    : "border-[color:var(--color-border-default)]",
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-2xl font-semibold text-[color:var(--color-fg-default)]">
                      {plan.name}
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-[color:var(--color-fg-muted)]">
                      {plan.description ?? "Plano profissional para uma operação recorrente."}
                    </p>
                  </div>
                  {isCurrentPlan ? (
                    <span className="rounded-full bg-emerald-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700 ring-1 ring-emerald-100">
                      Atual
                    </span>
                  ) : null}
                </div>

                <div className="mt-6 space-y-2">
                  {plan.monthlyPriceCents ? (
                    <p className="text-3xl font-semibold text-[color:var(--color-fg-default)]">
                      {formatCurrencyBRL(plan.monthlyPriceCents)}
                      <span className="ml-1 text-base font-medium text-[color:var(--color-fg-muted)]">
                        /mês
                      </span>
                    </p>
                  ) : null}
                  {plan.yearlyPriceCents ? (
                    <p className="text-sm text-[color:var(--color-fg-muted)]">
                      {formatCurrencyBRL(plan.yearlyPriceCents)} /ano
                    </p>
                  ) : null}
                </div>

                <div className="mt-6 space-y-3 text-sm text-[color:var(--color-fg-muted)]">
                  <p>Profissionais: {plan.maxProfessionals ?? "Ilimitado"}</p>
                  <p>Serviços: {plan.maxServices ?? "Ilimitado"}</p>
                  <p>Agendamentos por mês: {plan.maxMonthlyAppointments ?? "Ilimitado"}</p>
                </div>

                <div className="mt-6 flex flex-col gap-3">
                  <form action={startSubscriptionCheckoutAction}>
                    <input type="hidden" name="planCode" value={plan.code} />
                    <input type="hidden" name="interval" value={BillingInterval.MONTHLY} />
                    <button
                      className="h-12 w-full rounded-2xl bg-[color:var(--color-brand-500)] px-5 text-sm font-semibold text-white shadow-[0_16px_32px_rgba(37,99,235,0.18)] transition hover:bg-[color:var(--color-brand-600)] disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={isCurrentPlan && subscription?.billingInterval === BillingInterval.MONTHLY}
                    >
                      Assinar mensal
                    </button>
                  </form>

                  {plan.code !== PlanCode.STARTER && plan.yearlyPriceCents ? (
                    <form action={startSubscriptionCheckoutAction}>
                      <input type="hidden" name="planCode" value={plan.code} />
                      <input type="hidden" name="interval" value={BillingInterval.YEARLY} />
                      <button
                        className="h-12 w-full rounded-2xl border border-[color:var(--color-border-default)] px-5 text-sm font-semibold text-[color:var(--color-fg-default)] transition hover:bg-[color:var(--color-surface-muted)] disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={isCurrentPlan && subscription?.billingInterval === BillingInterval.YEARLY}
                      >
                        Assinar anual
                      </button>
                    </form>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
