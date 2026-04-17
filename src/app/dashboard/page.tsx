import Link from "next/link";
import { redirect } from "next/navigation";
import { formatInTimeZone } from "date-fns-tz";
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
    { label: "Agendamentos hoje", value: String(appointmentsToday) },
    {
      label: "Receita estimada do mês",
      value: formatCurrencyBRL(revenueEstimate._sum.priceCents ?? 0),
    },
    { label: "Alertas pendentes", value: String(pendingAlerts) },
    { label: "Próximo passo", value: "Operação em tempo real" },
  ];

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[color:var(--color-fg-muted)]">
            Dashboard
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-[color:var(--color-fg-default)]">
            Sua operação de hoje, em um lugar só.
          </h1>
          <p className="max-w-2xl text-sm leading-7 text-[color:var(--color-fg-muted)]">
            Veja os próximos atendimentos, acompanhe alertas e acesse os módulos principais sem
            sair do fluxo.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/dashboard/agenda"
            className="rounded-full bg-[color:var(--color-brand-500)] px-5 py-3 text-sm font-semibold text-white"
          >
            Ver agenda
          </Link>
          <Link
            href="/dashboard/servicos"
            className="rounded-full border border-[color:var(--color-border-default)] px-5 py-3 text-sm font-semibold text-[color:var(--color-fg-default)]"
          >
            Novo serviço
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <article
            key={card.label}
            className="rounded-[28px] border border-[color:var(--color-border-default)] bg-slate-50 p-5"
          >
            <p className="text-sm text-[color:var(--color-fg-muted)]">{card.label}</p>
            <p className="mt-4 text-3xl font-semibold text-[color:var(--color-fg-default)]">
              {card.value}
            </p>
          </article>
        ))}
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
