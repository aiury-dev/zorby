import { BillingInterval, PlanCode } from "@/generated/prisma/enums";
import { redirect } from "next/navigation";
import { cancelSubscriptionAction, startSubscriptionCheckoutAction } from "@/server/actions/dashboard";
import { getCurrentMembership } from "@/server/services/me";
import { getCurrentSubscription, getPlanState } from "@/server/services/plans";
import { getMercadoPagoManagementLink } from "@/server/services/subscriptions";
import { prisma } from "@/lib/prisma";
import { formatCurrencyBRL } from "@/lib/utils";

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
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[color:var(--color-fg-muted)]">
          Assinatura
        </p>
        <h1 className="text-4xl font-semibold text-[color:var(--color-fg-default)]">
          Assinatura e cobrança
        </h1>
        <p className="max-w-2xl text-sm leading-7 text-[color:var(--color-fg-muted)]">
          Crie sua assinatura, acompanhe o status e gerencie o plano do seu negócio sem sair do
          painel.
        </p>
      </header>

      <section className="rounded-[28px] border border-[color:var(--color-border-default)] bg-white p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-[color:var(--color-fg-default)]">Status atual</h2>
            <p className="mt-2 text-sm text-[color:var(--color-fg-muted)]">
              Plano: {subscription?.plan.name ?? "Sem assinatura"} · Status: {subscription?.status ?? "N/A"}
            </p>
            <p className="mt-2 text-sm text-[color:var(--color-fg-muted)]">
              {planState.canAcceptNewBookings
                ? "Seu negócio pode receber novos agendamentos."
                : "Novos agendamentos estão bloqueados até a regularização da assinatura."}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {managementLink ? (
              <a
                href={managementLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-11 items-center rounded-full border border-[color:var(--color-border-default)] px-5 text-sm font-semibold text-[color:var(--color-fg-default)]"
              >
                Abrir cobrança no Mercado Pago
              </a>
            ) : null}
            {subscription?.providerSubscriptionId ? (
              <form action={cancelSubscriptionAction}>
                <button className="h-11 rounded-full bg-[color:var(--color-danger)] px-5 text-sm font-semibold text-white">
                  Cancelar assinatura
                </button>
              </form>
            ) : null}
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {plans.map((plan) => {
          const isCurrentPlan = subscription?.plan.code === plan.code;

          return (
            <article
              key={plan.id}
              className="rounded-[28px] border border-[color:var(--color-border-default)] bg-white p-6"
            >
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-2xl font-semibold text-[color:var(--color-fg-default)]">
                  {plan.name}
                </h2>
                {isCurrentPlan ? (
                  <span className="rounded-full bg-emerald-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                    Atual
                  </span>
                ) : null}
              </div>

              <p className="mt-3 text-sm leading-6 text-[color:var(--color-fg-muted)]">
                {plan.description ?? "Plano profissional para operação recorrente."}
              </p>

              <div className="mt-6 space-y-2">
                {plan.monthlyPriceCents ? (
                  <p className="text-lg font-semibold text-[color:var(--color-fg-default)]">
                    {formatCurrencyBRL(plan.monthlyPriceCents)} / mês
                  </p>
                ) : null}
                {plan.yearlyPriceCents ? (
                  <p className="text-sm text-[color:var(--color-fg-muted)]">
                    {formatCurrencyBRL(plan.yearlyPriceCents)} / ano
                  </p>
                ) : null}
              </div>

              <div className="mt-6 space-y-2 text-sm text-[color:var(--color-fg-muted)]">
                <p>Profissionais: {plan.maxProfessionals ?? "Ilimitado"}</p>
                <p>Serviços: {plan.maxServices ?? "Ilimitado"}</p>
                <p>Agendamentos/mês: {plan.maxMonthlyAppointments ?? "Ilimitado"}</p>
              </div>

              <div className="mt-6 flex flex-col gap-3">
                <form action={startSubscriptionCheckoutAction}>
                  <input type="hidden" name="planCode" value={plan.code} />
                  <input type="hidden" name="interval" value={BillingInterval.MONTHLY} />
                  <button
                    className="h-11 w-full rounded-full bg-[color:var(--color-brand-500)] px-5 text-sm font-semibold text-white disabled:opacity-50"
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
                      className="h-11 w-full rounded-full border border-[color:var(--color-border-default)] px-5 text-sm font-semibold text-[color:var(--color-fg-default)] disabled:opacity-50"
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
      </section>
    </div>
  );
}
