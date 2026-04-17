import { redirect } from "next/navigation";
import { BarChart3, Download, ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatCurrencyBRL } from "@/lib/utils";
import { requestAggregatedExportAction, requestFullExportAction } from "@/server/actions/dashboard";
import { getCurrentMembership } from "@/server/services/me";
import { getCurrentSubscription } from "@/server/services/plans";

const statusLabels: Record<string, string> = {
  PENDING: "Pendentes",
  CONFIRMED: "Confirmados",
  COMPLETED: "Concluídos",
  CANCELLED: "Cancelados",
  NO_SHOW: "Não compareceram",
};

export default async function RelatoriosPage() {
  const membership = await getCurrentMembership();

  if (!membership) {
    redirect("/login");
  }

  const [statusCounts, serviceCounts, revenue, currentSubscription, exports] = await Promise.all([
    prisma.appointment.groupBy({
      by: ["status"],
      where: { businessId: membership.businessId },
      _count: { status: true },
    }),
    prisma.appointment.groupBy({
      by: ["serviceNameSnapshot"],
      where: { businessId: membership.businessId },
      _count: { serviceNameSnapshot: true },
      orderBy: { _count: { serviceNameSnapshot: "desc" } },
      take: 5,
    }),
    prisma.appointment.aggregate({
      where: {
        businessId: membership.businessId,
        status: { in: ["CONFIRMED", "COMPLETED"] },
      },
      _sum: { priceCents: true },
    }),
    getCurrentSubscription(membership.businessId),
    prisma.dataExport.findMany({
      where: { businessId: membership.businessId },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--color-border-default)] bg-[color:var(--color-surface-muted)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.26em] text-[color:var(--color-fg-muted)]">
            <BarChart3 className="size-3.5 text-[color:var(--color-brand-500)]" />
            Relatórios
          </div>
          <h1 className="text-4xl font-semibold leading-tight text-[color:var(--color-fg-default)]">
            Transforme a operação em leitura rápida para tomar decisões melhores.
          </h1>
          <p className="text-sm leading-7 text-[color:var(--color-fg-muted)] md:text-base">
            Acompanhe volume, receita estimada, serviços mais procurados e a fila de exportações de
            dados sem perder clareza.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[420px]">
          <article className="rounded-[26px] border border-[color:var(--color-border-default)] bg-white p-4 shadow-[0_14px_36px_rgba(15,23,42,0.04)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--color-fg-muted)]">
              Receita estimada
            </p>
            <p className="mt-3 text-3xl font-semibold text-[color:var(--color-fg-default)]">
              {formatCurrencyBRL(revenue._sum.priceCents ?? 0)}
            </p>
          </article>
          <article className="rounded-[26px] border border-[color:var(--color-border-default)] bg-white p-4 shadow-[0_14px_36px_rgba(15,23,42,0.04)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--color-fg-muted)]">
              Exportações recentes
            </p>
            <p className="mt-3 text-3xl font-semibold text-[color:var(--color-fg-default)]">
              {exports.length}
            </p>
          </article>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {statusCounts.map((item) => (
          <article
            key={item.status}
            className="rounded-[28px] border border-[color:var(--color-border-default)] bg-white p-5 shadow-[0_14px_36px_rgba(15,23,42,0.04)]"
          >
            <p className="text-sm text-[color:var(--color-fg-muted)]">
              {statusLabels[item.status] ?? item.status}
            </p>
            <p className="mt-4 text-3xl font-semibold text-[color:var(--color-fg-default)]">
              {item._count.status}
            </p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="rounded-[32px] border border-[color:var(--color-border-default)] bg-white p-6 shadow-[0_20px_50px_rgba(15,23,42,0.05)] md:p-7">
          <div>
            <h2 className="text-2xl font-semibold text-[color:var(--color-fg-default)]">
              Serviços mais agendados
            </h2>
            <p className="mt-1 text-sm text-[color:var(--color-fg-muted)]">
              Entenda rapidamente quais ofertas puxam a demanda do negócio.
            </p>
          </div>

          <div className="mt-6 space-y-3">
            {serviceCounts.length ? (
              serviceCounts.map((item, index) => (
                <div
                  key={item.serviceNameSnapshot}
                  className="flex items-center justify-between rounded-[22px] border border-[color:var(--color-border-default)] bg-[color:var(--color-surface-muted)] px-4 py-4"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[color:var(--color-fg-default)]">
                      {item.serviceNameSnapshot}
                    </p>
                    <p className="mt-1 text-sm text-[color:var(--color-fg-muted)]">
                      Ranking #{index + 1}
                    </p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-2 text-sm font-semibold text-[color:var(--color-fg-default)]">
                    {item._count.serviceNameSnapshot}
                  </span>
                </div>
              ))
            ) : (
              <div className="rounded-[24px] border border-dashed border-[color:var(--color-border-default)] bg-[color:var(--color-surface-muted)] p-6 text-sm text-[color:var(--color-fg-muted)]">
                Ainda não há dados suficientes para ranquear serviços.
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-4">
          <article className="rounded-[30px] border border-[color:var(--color-border-default)] bg-[linear-gradient(180deg,#0f172a_0%,#172554_100%)] p-6 text-white shadow-[0_24px_70px_rgba(15,23,42,0.16)]">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
                <ShieldCheck className="size-5" />
              </div>
              <div className="space-y-3">
                <h2 className="text-xl font-semibold">Exportações com responsabilidade</h2>
                <p className="text-sm leading-7 text-white/72">
                  O painel respeita o plano atual e mantém a trilha de exportações sempre visível
                  para a equipe.
                </p>
              </div>
            </div>
          </article>

          <article className="rounded-[28px] border border-[color:var(--color-border-default)] bg-white p-5">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-[color:var(--color-surface-muted)] p-2.5 text-[color:var(--color-brand-500)]">
                <Download className="size-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[color:var(--color-fg-default)]">
                  Exporte o que faz sentido
                </p>
                <p className="mt-2 text-sm leading-7 text-[color:var(--color-fg-muted)]">
                  Relatórios agregados ficam disponíveis para todos os planos. Exportação completa
                  depende do Business.
                </p>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section className="rounded-[32px] border border-[color:var(--color-border-default)] bg-white p-6 shadow-[0_20px_50px_rgba(15,23,42,0.05)] md:p-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-[color:var(--color-fg-default)]">
              Exportações e LGPD
            </h2>
            <p className="mt-1 text-sm text-[color:var(--color-fg-muted)]">
              Gere arquivos agregados sempre que precisar e destrave exportação completa no plano
              Business.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <form action={requestAggregatedExportAction}>
              <button className="h-12 rounded-2xl border border-[color:var(--color-border-default)] px-5 text-sm font-semibold text-[color:var(--color-fg-default)] transition hover:bg-[color:var(--color-surface-muted)]">
                Exportar agregado
              </button>
            </form>
            <form action={requestFullExportAction}>
              <button
                className="h-12 rounded-2xl bg-[color:var(--color-brand-500)] px-5 text-sm font-semibold text-white shadow-[0_16px_32px_rgba(37,99,235,0.18)] transition hover:bg-[color:var(--color-brand-600)] disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!currentSubscription?.plan.fullDataExportEnabled}
              >
                Exportação completa
              </button>
            </form>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {exports.length ? (
            exports.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-3 rounded-[22px] border border-[color:var(--color-border-default)] bg-[color:var(--color-surface-muted)] px-4 py-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-[color:var(--color-fg-default)]">
                    {item.scope}
                  </p>
                  <p className="mt-1 text-sm text-[color:var(--color-fg-muted)]">{item.status}</p>
                </div>
                {item.fileUrl ? (
                  <a
                    href={item.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-semibold text-[color:var(--color-brand-500)]"
                  >
                    Abrir arquivo
                  </a>
                ) : (
                  <span className="text-sm text-[color:var(--color-fg-muted)]">Em processamento</span>
                )}
              </div>
            ))
          ) : (
            <div className="rounded-[24px] border border-dashed border-[color:var(--color-border-default)] bg-[color:var(--color-surface-muted)] p-6 text-sm text-[color:var(--color-fg-muted)]">
              Nenhuma exportação recente por aqui.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
