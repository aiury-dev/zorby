import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatCurrencyBRL } from "@/lib/utils";
import { requestAggregatedExportAction, requestFullExportAction } from "@/server/actions/dashboard";
import { getCurrentMembership } from "@/server/services/me";
import { getCurrentSubscription } from "@/server/services/plans";

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
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[color:var(--color-fg-muted)]">
          Relatorios
        </p>
        <h1 className="text-4xl font-semibold text-[color:var(--color-fg-default)]">Indicadores do negocio</h1>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        {statusCounts.map((item) => (
          <article
            key={item.status}
            className="rounded-[28px] border border-[color:var(--color-border-default)] bg-white p-5"
          >
            <p className="text-sm text-[color:var(--color-fg-muted)]">{item.status}</p>
            <p className="mt-4 text-3xl font-semibold text-[color:var(--color-fg-default)]">
              {item._count.status}
            </p>
          </article>
        ))}
        <article className="rounded-[28px] border border-[color:var(--color-border-default)] bg-white p-5">
          <p className="text-sm text-[color:var(--color-fg-muted)]">Receita estimada</p>
          <p className="mt-4 text-3xl font-semibold text-[color:var(--color-fg-default)]">
            {formatCurrencyBRL((revenue._sum.priceCents ?? 0) / 100)}
          </p>
        </article>
      </section>

      <section className="rounded-[28px] border border-[color:var(--color-border-default)] bg-white p-6">
        <h2 className="text-xl font-semibold text-[color:var(--color-fg-default)]">Servicos mais agendados</h2>
        <div className="mt-5 space-y-3">
          {serviceCounts.map((item) => (
            <div
              key={item.serviceNameSnapshot}
              className="flex items-center justify-between rounded-[20px] border border-[color:var(--color-border-default)] bg-slate-50 px-4 py-3"
            >
              <span className="text-sm font-medium text-[color:var(--color-fg-default)]">{item.serviceNameSnapshot}</span>
              <span className="text-sm text-[color:var(--color-fg-muted)]">{item._count.serviceNameSnapshot}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[28px] border border-[color:var(--color-border-default)] bg-white p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-[color:var(--color-fg-default)]">Exportacoes e LGPD</h2>
            <p className="mt-2 text-sm text-[color:var(--color-fg-muted)]">
              Gere exportacoes agregadas sempre que precisar e exportacao completa somente no plano Business.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <form action={requestAggregatedExportAction}>
              <button className="h-11 rounded-full border border-[color:var(--color-border-default)] px-5 text-sm font-semibold text-[color:var(--color-fg-default)]">
                Exportar agregado
              </button>
            </form>
            <form action={requestFullExportAction}>
              <button
                className="h-11 rounded-full bg-[color:var(--color-brand-500)] px-5 text-sm font-semibold text-white disabled:opacity-50"
                disabled={!currentSubscription?.plan.fullDataExportEnabled}
              >
                Exportacao completa
              </button>
            </form>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {exports.map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-3 rounded-[20px] border border-[color:var(--color-border-default)] bg-slate-50 px-4 py-3 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <p className="text-sm font-semibold text-[color:var(--color-fg-default)]">{item.scope}</p>
                <p className="mt-1 text-sm text-[color:var(--color-fg-muted)]">{item.status}</p>
              </div>
              {item.fileUrl ? (
                <a href={item.fileUrl} target="_blank" rel="noreferrer" className="text-sm font-semibold text-[color:var(--color-brand-500)]">
                  Abrir arquivo
                </a>
              ) : (
                <span className="text-sm text-[color:var(--color-fg-muted)]">Em processamento</span>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
