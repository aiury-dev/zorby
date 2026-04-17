import Link from "next/link";
import { redirect } from "next/navigation";
import { formatInTimeZone } from "date-fns-tz";
import { ArrowRight, CalendarClock, CircleAlert, Coins, Sparkles, Zap } from "lucide-react";
import { LiveDashboardFeed } from "@/components/dashboard/live-dashboard-feed";
import { prisma } from "@/lib/prisma";
import { formatCurrencyBRL } from "@/lib/utils";
import { getCurrentMembership } from "@/server/services/me";
import { getOnboardingStepPath } from "@/server/services/onboarding";

export default async function DashboardPage() {
  const membership = await getCurrentMembership();

  if (!membership) {
    redirect("/login");
  }

  if (membership.business.onboardingStep !== "COMPLETED") {
    redirect(getOnboardingStepPath(membership.business.onboardingStep));
  }

  const [appointmentsToday, nextAppointments, revenueEstimate, pendingAlerts, alertBreakdown] =
    await Promise.all([
      prisma.appointment.count({
        where: {
          businessId: membership.businessId,
          startsAtUtc: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lte: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        },
      }),
      prisma.appointment.findMany({
        where: {
          businessId: membership.businessId,
          startsAtUtc: { gte: new Date() },
        },
        orderBy: { startsAtUtc: "asc" },
        take: 5,
        include: {
          professional: { select: { displayName: true } },
        },
      }),
      prisma.appointment.aggregate({
        where: {
          businessId: membership.businessId,
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
          status: { not: "CANCELLED" },
        },
        _sum: { priceCents: true },
      }),
      prisma.appointment.count({
        where: {
          businessId: membership.businessId,
          OR: [{ status: "CANCELLED" }, { status: "PENDING" }],
        },
      }),
      prisma.appointment.groupBy({
        by: ["status"],
        where: {
          businessId: membership.businessId,
          createdAt: {
            gte: new Date(Date.now() - 1000 * 60 * 60 * 24),
          },
        },
        _count: { status: true },
      }),
    ]);

  const cards = [
    {
      label: "Agendamentos hoje",
      value: String(appointmentsToday),
      caption: "Reservas previstas para o dia",
      icon: CalendarClock,
      tone: "blue",
    },
    {
      label: "Receita estimada do mês",
      value: formatCurrencyBRL(revenueEstimate._sum.priceCents ?? 0),
      caption: "Valor acumulado de reservas não canceladas",
      icon: Coins,
      tone: "emerald",
    },
    {
      label: "Alertas pendentes",
      value: String(pendingAlerts),
      caption: "Cancelamentos e ações que merecem atenção",
      icon: CircleAlert,
      tone: "amber",
    },
  ] as const;

  return (
    <div className="space-y-8">
      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-[linear-gradient(135deg,#0f172a_0%,#163d78_42%,#1d72d8_100%)] p-6 text-white shadow-[0_24px_70px_rgba(15,23,42,0.18)] md:p-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-white/80">
            <Sparkles className="size-4" />
            Dashboard
          </div>

          <div className="mt-6 max-w-3xl space-y-4">
            <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
              Sua operação de hoje, em um lugar só.
            </h1>
            <p className="max-w-2xl text-base leading-8 text-white/78">
              Acompanhe próximos atendimentos, métricas rápidas e alertas importantes sem ficar
              pulando entre módulos.
            </p>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/dashboard/agenda"
              className="inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
            >
              Ver agenda
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/dashboard/servicos"
              className="inline-flex h-12 items-center rounded-full border border-white/15 bg-white/10 px-6 text-sm font-semibold text-white transition hover:bg-white/15"
            >
              Gerenciar serviços
            </Link>
          </div>
        </div>

        <div className="rounded-[32px] border border-[color:var(--color-border-default)] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-6 shadow-[0_16px_36px_rgba(15,23,42,0.06)] md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-fg-muted)]">
            Resumo do momento
          </p>
          <div className="mt-5 space-y-4">
            <div className="rounded-[24px] border border-[color:var(--color-border-default)] bg-white p-5">
              <p className="text-sm text-[color:var(--color-fg-muted)]">Próximos atendimentos</p>
              <p className="mt-2 text-3xl font-semibold text-[color:var(--color-fg-default)]">
                {nextAppointments.length}
              </p>
            </div>
            <div className="rounded-[24px] border border-[color:var(--color-border-default)] bg-white p-5">
              <p className="text-sm text-[color:var(--color-fg-muted)]">Estado da operação</p>
              <p className="mt-2 text-2xl font-semibold text-[color:var(--color-fg-default)]">
                Tempo real ativo
              </p>
              <p className="mt-2 text-sm leading-6 text-[color:var(--color-fg-muted)]">
                Acompanhe agenda, alertas e movimentação do negócio no mesmo painel.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;
          const toneClasses =
            card.tone === "emerald"
              ? "bg-emerald-50 text-emerald-700"
              : card.tone === "amber"
                ? "bg-amber-50 text-amber-700"
                : "bg-blue-50 text-blue-700";

          return (
            <article
              key={card.label}
              className="rounded-[28px] border border-[color:var(--color-border-default)] bg-white p-6 shadow-[0_12px_28px_rgba(15,23,42,0.05)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-[color:var(--color-fg-muted)]">{card.label}</p>
                  <p className="mt-4 text-3xl font-semibold text-[color:var(--color-fg-default)]">
                    {card.value}
                  </p>
                </div>
                <div className={`rounded-2xl p-3 ${toneClasses}`}>
                  <Icon className="size-5" />
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-[color:var(--color-fg-muted)]">{card.caption}</p>
            </article>
          );
        })}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-[30px] border border-[color:var(--color-border-default)] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-6 shadow-[0_12px_28px_rgba(15,23,42,0.05)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-fg-muted)]">
                Atalhos rápidos
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-[color:var(--color-fg-default)]">
                Ações mais usadas no dia a dia
              </h2>
            </div>
            <div className="rounded-2xl bg-blue-50 p-3 text-blue-700">
              <Zap className="size-5" />
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <Link
              href="/dashboard/agenda"
              className="rounded-[24px] border border-[color:var(--color-border-default)] bg-white px-5 py-5 text-sm font-semibold text-[color:var(--color-fg-default)] transition hover:border-[color:var(--color-border-strong)] hover:bg-slate-50"
            >
              Abrir agenda
            </Link>
            <Link
              href="/dashboard/clientes"
              className="rounded-[24px] border border-[color:var(--color-border-default)] bg-white px-5 py-5 text-sm font-semibold text-[color:var(--color-fg-default)] transition hover:border-[color:var(--color-border-strong)] hover:bg-slate-50"
            >
              Ver clientes
            </Link>
            <Link
              href="/dashboard/disponibilidade"
              className="rounded-[24px] border border-[color:var(--color-border-default)] bg-white px-5 py-5 text-sm font-semibold text-[color:var(--color-fg-default)] transition hover:border-[color:var(--color-border-strong)] hover:bg-slate-50"
            >
              Ajustar disponibilidade
            </Link>
          </div>
        </article>

        <article className="rounded-[30px] border border-[color:var(--color-border-default)] bg-white p-6 shadow-[0_12px_28px_rgba(15,23,42,0.05)]">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-fg-muted)]">
            Próximos atendimentos
          </p>
          <div className="mt-5 space-y-3">
            {nextAppointments.length ? (
              nextAppointments.slice(0, 3).map((appointment) => (
                <div
                  key={appointment.id}
                  className="rounded-[22px] border border-[color:var(--color-border-default)] bg-slate-50 px-4 py-4"
                >
                  <p className="font-semibold text-[color:var(--color-fg-default)]">
                    {appointment.customerNameSnapshot}
                  </p>
                  <p className="mt-1 text-sm text-[color:var(--color-fg-muted)]">
                    {appointment.serviceNameSnapshot} com {appointment.professional.displayName}
                  </p>
                  <p className="mt-2 text-sm font-medium text-[color:var(--color-fg-default)]">
                    {formatInTimeZone(appointment.startsAtUtc, membership.business.timezone, "dd/MM 'às' HH:mm")}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-[22px] border border-dashed border-[color:var(--color-border-default)] px-4 py-5 text-sm text-[color:var(--color-fg-muted)]">
                Ainda não há próximos agendamentos.
              </div>
            )}
          </div>
        </article>
      </section>

      <LiveDashboardFeed
        initialRecentAppointments={nextAppointments.map((appointment) => ({
          id: appointment.id,
          customerName: appointment.customerNameSnapshot,
          serviceName: `${appointment.serviceNameSnapshot} com ${appointment.professional.displayName}`,
          startsAtLabel: formatInTimeZone(
            appointment.startsAtUtc,
            membership.business.timezone,
            "dd/MM 'às' HH:mm",
          ),
          status: appointment.status,
        }))}
        initialAlerts={alertBreakdown.reduce<Record<string, number>>((accumulator, item) => {
          accumulator[item.status] = item._count.status;
          return accumulator;
        }, {})}
      />
    </div>
  );
}
