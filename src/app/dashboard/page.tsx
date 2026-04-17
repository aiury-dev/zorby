import Link from "next/link";
import { redirect } from "next/navigation";
import { formatInTimeZone } from "date-fns-tz";
import {
  AlertCircle,
  ArrowUpRight,
  CalendarDays,
  Clock,
  Sparkles,
  TrendingUp,
  Wrench,
  Zap,
} from "lucide-react";
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

  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [appointmentsToday, nextAppointments, revenueEstimate, pendingAlerts, alertBreakdown] =
    await Promise.all([
      prisma.appointment.count({
        where: {
          businessId: membership.businessId,
          startsAtUtc: { gte: startOfDay, lte: endOfDay },
        },
      }),
      prisma.appointment.findMany({
        where: {
          businessId: membership.businessId,
          startsAtUtc: { gte: now },
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
          createdAt: { gte: startOfMonth },
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
          createdAt: { gte: new Date(Date.now() - 1000 * 60 * 60 * 24) },
        },
        _count: { status: true },
      }),
    ]);

  const stats = [
    {
      label: "Agendamentos hoje",
      value: String(appointmentsToday),
      icon: CalendarDays,
      color: "var(--z-blue)",
    },
    {
      label: "Receita do mês",
      value: formatCurrencyBRL((revenueEstimate._sum.priceCents ?? 0) / 100),
      icon: TrendingUp,
      color: "var(--z-green)",
    },
    {
      label: "Alertas pendentes",
      value: String(pendingAlerts),
      icon: AlertCircle,
      color: pendingAlerts > 0 ? "var(--z-amber)" : "var(--z-green)",
    },
    {
      label: "Próximos (5)",
      value: String(nextAppointments.length),
      icon: Clock,
      color: "var(--z-blue)",
    },
  ] as const;

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[28px] border border-[rgba(79,142,247,0.18)] bg-[linear-gradient(140deg,#0f1b4a_0%,#0d1538_38%,#0a0f1a_100%)] p-6 shadow-[0_28px_70px_rgba(5,10,25,0.28)] md:p-8">
        <div className="grid gap-8 xl:grid-cols-[1.08fr_0.92fr] xl:items-start">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/60">
              <Sparkles className="size-3.5" />
              Dashboard
            </div>

            <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-[1.02] tracking-[-0.05em] text-white md:text-5xl [font-family:var(--font-display)]">
              Sua operação de hoje, em um lugar só.
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/62 md:text-[15px]">
              Veja os próximos atendimentos, acompanhe alertas e acesse os módulos
              principais sem sair do fluxo.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/dashboard/agenda"
                className="inline-flex items-center gap-2 rounded-[14px] bg-[var(--z-blue)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--z-blue-hover)]"
              >
                Ver agenda
                <ArrowUpRight className="size-4" />
              </Link>
              <Link
                href="/dashboard/servicos"
                className="inline-flex items-center gap-2 rounded-[14px] border border-white/10 bg-white/6 px-4 py-2.5 text-sm font-semibold text-white/82 transition hover:bg-white/10"
              >
                Novo serviço
                <Wrench className="size-4" />
              </Link>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <div className="rounded-[18px] border border-white/10 bg-white/[0.07] p-4 backdrop-blur">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/38">
                    Próximo passo
                  </p>
                  <p className="mt-3 text-3xl font-semibold leading-tight text-white [font-family:var(--font-display)]">
                    Operação em tempo real
                  </p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-white/8 text-white/70">
                  <Zap className="size-4" />
                </div>
              </div>
            </div>

            <div className="rounded-[18px] border border-white/10 bg-white/[0.05] p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/38">
                Resumo rápido
              </p>
              <p className="mt-3 text-sm leading-7 text-white/62">
                Você acompanha agenda, clientes, disponibilidade e cobrança no mesmo painel.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <article key={stat.label} className="z-card">
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: `color-mix(in srgb, ${stat.color} 14%, transparent)` }}>
                  <Icon size={17} style={{ color: stat.color }} />
                </div>
              </div>
              <p className="z-stat mt-4">{stat.value}</p>
              <p className="z-label mt-1">{stat.label}</p>
            </article>
          );
        })}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <article className="rounded-[24px] border border-white/8 bg-[var(--z-surface)] p-6 shadow-[0_18px_40px_rgba(5,10,25,0.18)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                Operação
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-white [font-family:var(--font-display)]">
                Ações mais usadas no dia a dia
              </h2>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-[12px] border border-white/8 bg-white/4 text-slate-300">
              <Zap className="size-4" />
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {[
              { href: "/dashboard/agenda", label: "Abrir agenda" },
              { href: "/dashboard/clientes", label: "Ver clientes" },
              { href: "/dashboard/disponibilidade", label: "Ajustar disponibilidade" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-[16px] border border-white/8 bg-[var(--z-surface-3)] px-4 py-4 text-sm font-semibold text-slate-100 transition hover:border-white/14 hover:bg-[rgba(255,255,255,0.06)]"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </article>

        <article className="rounded-[24px] border border-white/8 bg-[var(--z-surface)] p-6 shadow-[0_18px_40px_rgba(5,10,25,0.18)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                Resumo
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-white [font-family:var(--font-display)]">
                Próximos atendimentos
              </h2>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-[12px] border border-white/8 bg-white/4 text-slate-300">
              <CalendarDays className="size-4" />
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {nextAppointments.length ? (
              nextAppointments.slice(0, 3).map((appointment) => (
                <div
                  key={appointment.id}
                  className="rounded-[16px] border border-white/8 bg-[var(--z-surface-3)] px-4 py-4"
                >
                  <p className="font-semibold text-slate-50">{appointment.customerNameSnapshot}</p>
                  <p className="mt-1 text-sm text-slate-400">
                    {appointment.serviceNameSnapshot} com {appointment.professional.displayName}
                  </p>
                  <p className="mt-3 text-sm font-medium text-slate-200">
                    {formatInTimeZone(
                      appointment.startsAtUtc,
                      membership.business.timezone,
                      "dd/MM 'às' HH:mm",
                    )}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-[16px] border border-dashed border-white/10 px-4 py-5 text-sm text-slate-400">
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
