import Link from "next/link";
import { redirect } from "next/navigation";
import { formatInTimeZone } from "date-fns-tz";
import {
  ArrowRight,
  CalendarClock,
  CircleAlert,
  Coins,
  Sparkles,
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
      caption: "agendamentos nesta data",
      icon: CalendarClock,
    },
    {
      label: "Confirmados",
      value: String(nextAppointments.filter((appointment) => appointment.status === "CONFIRMED").length),
      caption: "prontos para atendimento",
      icon: Sparkles,
    },
    {
      label: "Receita do dia",
      value: formatCurrencyBRL(revenueEstimate._sum.priceCents ?? 0),
      caption: "estimativa do calendário",
      icon: Coins,
    },
  ] as const;

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[24px] border border-[rgba(37,99,235,0.2)] bg-[linear-gradient(140deg,#112060_0%,#0e1b50_40%,#0a1435_100%)] p-6 shadow-[0_28px_70px_rgba(13,17,23,0.20)] md:p-8">
        <div className="grid gap-8 xl:grid-cols-[1fr_auto] xl:items-start">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-white/60">
              <Sparkles className="size-3.5" />
              Dashboard
            </div>
            <h1 className="max-w-3xl text-4xl font-semibold leading-[1.06] tracking-[-0.04em] text-white md:text-5xl [font-family:var(--font-display)]">
              Sua operação de hoje, em um lugar só.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/60 md:text-[15px]">
              Veja os próximos atendimentos, acompanhe alertas e acesse os módulos principais sem
              sair do fluxo.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[410px] xl:grid-cols-1">
            {cards.map((card) => {
              const Icon = card.icon;

              return (
                <article
                  key={card.label}
                  className="rounded-[18px] border border-white/10 bg-white/[0.07] p-4 backdrop-blur"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/38">
                        {card.label}
                      </p>
                      <p className="mt-3 text-4xl font-semibold leading-none text-white [font-family:var(--font-display)]">
                        {card.value}
                      </p>
                      <p className="mt-3 text-xs text-white/38">{card.caption}</p>
                    </div>
                    <div className="flex size-9 items-center justify-center rounded-[10px] bg-white/8 text-white/60">
                      <Icon className="size-4" />
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        <div className="mt-6 rounded-[18px] border border-white/10 bg-[rgba(255,255,255,0.06)] p-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/38">
                Próximos passos
              </p>
              <p className="mt-1 text-lg font-semibold text-white [font-family:var(--font-display)]">
                Mantenha agenda, clientes e disponibilidade sempre alinhados.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href="/dashboard/agenda"
                className="inline-flex items-center gap-2 rounded-[12px] border border-white/10 bg-white/8 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/12"
              >
                Ver agenda
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/dashboard/servicos"
                className="inline-flex items-center gap-2 rounded-[12px] bg-[color:var(--color-brand-500)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[color:var(--color-brand-600)]"
              >
                Novo serviço
                <Wrench className="size-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
        <article className="rounded-[24px] border border-white/8 bg-[var(--navy-2)] p-6 shadow-[0_18px_40px_rgba(13,17,23,0.18)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                Operação
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-white [font-family:var(--font-display)]">
                Ações mais usadas no dia a dia
              </h2>
            </div>
            <div className="flex size-10 items-center justify-center rounded-[12px] border border-white/8 bg-white/4 text-slate-300">
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
                className="rounded-[16px] border border-white/8 bg-[var(--navy-3)] px-4 py-4 text-sm font-semibold text-slate-100 transition hover:border-white/14 hover:bg-[var(--navy-4)]"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </article>

        <article className="rounded-[24px] border border-white/8 bg-[var(--navy-2)] p-6 shadow-[0_18px_40px_rgba(13,17,23,0.18)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                Resumo
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-white [font-family:var(--font-display)]">
                Próximos atendimentos
              </h2>
            </div>
            <div className="flex size-10 items-center justify-center rounded-[12px] border border-white/8 bg-white/4 text-slate-300">
              <CalendarClock className="size-4" />
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {nextAppointments.length ? (
              nextAppointments.slice(0, 3).map((appointment) => (
                <div
                  key={appointment.id}
                  className="rounded-[16px] border border-white/8 bg-[var(--navy-3)] px-4 py-4"
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

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-[24px] border border-white/8 bg-[var(--navy-2)] p-5 shadow-[0_18px_40px_rgba(13,17,23,0.18)]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
            Agendamentos hoje
          </p>
          <p className="mt-3 text-4xl font-semibold text-white [font-family:var(--font-display)]">
            {appointmentsToday}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Total previsto para esta data dentro do calendário.
          </p>
        </article>

        <article className="rounded-[24px] border border-white/8 bg-[var(--navy-2)] p-5 shadow-[0_18px_40px_rgba(13,17,23,0.18)]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
            Receita estimada do mês
          </p>
          <p className="mt-3 text-4xl font-semibold text-white [font-family:var(--font-display)]">
            {formatCurrencyBRL(revenueEstimate._sum.priceCents ?? 0)}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Valor acumulado de reservas não canceladas.
          </p>
        </article>

        <article className="rounded-[24px] border border-white/8 bg-[var(--navy-2)] p-5 shadow-[0_18px_40px_rgba(13,17,23,0.18)]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
            Alertas pendentes
          </p>
          <div className="mt-3 flex items-center gap-3">
            <p className="text-4xl font-semibold text-white [font-family:var(--font-display)]">
              {pendingAlerts}
            </p>
            <div className="flex size-9 items-center justify-center rounded-[12px] bg-[rgba(217,119,6,0.12)] text-amber-400">
              <CircleAlert className="size-4" />
            </div>
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Cancelamentos e ações que merecem atenção imediata.
          </p>
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
