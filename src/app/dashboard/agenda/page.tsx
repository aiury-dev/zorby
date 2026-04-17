import Link from "next/link";
import { redirect } from "next/navigation";
import { addDays, format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import {
  ArrowLeft,
  ArrowRight,
  CalendarRange,
  CheckCircle2,
  Clock3,
  UserRound,
  XCircle,
} from "lucide-react";
import { AppointmentStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { formatPhone } from "@/lib/utils";
import { updateAppointmentStatusAction } from "@/server/actions/dashboard";
import { getCurrentMembership } from "@/server/services/me";

type AgendaPageProps = {
  searchParams: Promise<{
    date?: string;
  }>;
};

const statusMeta: Record<
  AppointmentStatus,
  { label: string; badgeClassName: string; icon: typeof Clock3 }
> = {
  PENDING: {
    label: "Pendente",
    badgeClassName: "bg-amber-50 text-amber-700 ring-1 ring-amber-100",
    icon: Clock3,
  },
  CONFIRMED: {
    label: "Confirmado",
    badgeClassName: "bg-blue-50 text-blue-700 ring-1 ring-blue-100",
    icon: CheckCircle2,
  },
  COMPLETED: {
    label: "Concluído",
    badgeClassName: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
    icon: CheckCircle2,
  },
  CANCELLED: {
    label: "Cancelado",
    badgeClassName: "bg-rose-50 text-rose-700 ring-1 ring-rose-100",
    icon: XCircle,
  },
  NO_SHOW: {
    label: "Não compareceu",
    badgeClassName: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
    icon: XCircle,
  },
};

function buildDayBounds(date: string, timezone: string) {
  return {
    startUtc: fromZonedTime(`${date}T00:00:00`, timezone),
    endUtc: fromZonedTime(`${date}T23:59:59.999`, timezone),
  };
}

function formatAppointmentPeriod(start: Date, end: Date, timezone: string) {
  return `${formatInTimeZone(start, timezone, "HH:mm")} - ${formatInTimeZone(end, timezone, "HH:mm")}`;
}

export default async function AgendaPage({ searchParams }: AgendaPageProps) {
  const membership = await getCurrentMembership();

  if (!membership) {
    redirect("/login");
  }

  const params = await searchParams;
  const today = formatInTimeZone(new Date(), membership.business.timezone, "yyyy-MM-dd");
  const selectedDate =
    params.date && /^\d{4}-\d{2}-\d{2}$/.test(params.date) ? params.date : today;
  const { startUtc, endUtc } = buildDayBounds(selectedDate, membership.business.timezone);

  const appointments = await prisma.appointment.findMany({
    where: {
      businessId: membership.businessId,
      startsAtUtc: {
        gte: startUtc,
        lte: endUtc,
      },
    },
    orderBy: { startsAtUtc: "asc" },
    take: 100,
    include: {
      professional: {
        select: {
          displayName: true,
          roleLabel: true,
        },
      },
    },
  });

  const selectedDateObject = parseISO(selectedDate);
  const previousDate = format(addDays(selectedDateObject, -1), "yyyy-MM-dd");
  const nextDate = format(addDays(selectedDateObject, 1), "yyyy-MM-dd");
  const now = new Date();
  const upcomingAppointments = appointments.filter((appointment) => appointment.endsAtUtc >= now);
  const pastAppointments = appointments.filter((appointment) => appointment.endsAtUtc < now);
  const confirmedAppointments = appointments.filter(
    (appointment) => appointment.status === AppointmentStatus.CONFIRMED,
  ).length;
  const totalRevenueCents = appointments.reduce(
    (sum, appointment) =>
      appointment.status === AppointmentStatus.CANCELLED ? sum : sum + appointment.priceCents,
    0,
  );
  const prettySelectedDate = formatInTimeZone(
    startUtc,
    membership.business.timezone,
    "EEEE, dd 'de' MMMM",
    { locale: ptBR },
  );

  return (
    <div className="space-y-8">
      <header className="overflow-hidden rounded-[32px] border border-[color:var(--color-border-default)] bg-[linear-gradient(135deg,rgba(15,23,42,0.96)_0%,rgba(29,78,216,0.92)_100%)] p-6 text-white shadow-[0_24px_70px_rgba(15,23,42,0.18)] md:p-8">
        <div className="flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.26em] text-white/72">
              <CalendarRange className="size-3.5" />
              Agenda
            </div>
            <div className="space-y-3">
              <h1 className="max-w-2xl text-3xl font-semibold leading-tight text-white md:text-[2.75rem]">
                Controle o dia da sua operação com clareza e ritmo.
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-white/72 md:text-base">
                Veja quem vai chegar, quem já foi atendido e atualize o status de cada horário
                sem sair da agenda.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[420px]">
            <article className="rounded-[24px] border border-white/10 bg-white/10 p-4 backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/55">
                Hoje
              </p>
              <p className="mt-3 text-3xl font-semibold">{appointments.length}</p>
              <p className="mt-2 text-sm text-white/65">agendamentos nesta data</p>
            </article>
            <article className="rounded-[24px] border border-white/10 bg-white/10 p-4 backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/55">
                Confirmados
              </p>
              <p className="mt-3 text-3xl font-semibold">{confirmedAppointments}</p>
              <p className="mt-2 text-sm text-white/65">prontos para atendimento</p>
            </article>
            <article className="rounded-[24px] border border-white/10 bg-white/10 p-4 backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/55">
                Receita do dia
              </p>
              <p className="mt-3 text-3xl font-semibold">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(totalRevenueCents / 100)}
              </p>
              <p className="mt-2 text-sm text-white/65">estimativa do calendário</p>
            </article>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-4 rounded-[28px] border border-white/10 bg-white/8 p-4 backdrop-blur md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/55">
              Data selecionada
            </p>
            <p className="mt-2 text-2xl font-semibold capitalize">{prettySelectedDate}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/dashboard/agenda?date=${previousDate}`}
              className="inline-flex items-center gap-2 rounded-full border border-white/16 bg-white/8 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/14"
            >
              <ArrowLeft className="size-4" />
              Dia anterior
            </Link>
            <Link
              href={`/dashboard/agenda?date=${today}`}
              className="inline-flex items-center gap-2 rounded-full border border-white/16 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
            >
              Hoje
            </Link>
            <Link
              href={`/dashboard/agenda?date=${nextDate}`}
              className="inline-flex items-center gap-2 rounded-full border border-white/16 bg-white/8 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/14"
            >
              Próximo dia
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </header>

      {appointments.length === 0 ? (
        <section className="rounded-[32px] border border-dashed border-[color:var(--color-border-default)] bg-[color:var(--color-surface-muted)] p-8 text-center">
          <div className="mx-auto flex max-w-md flex-col items-center gap-4">
            <div className="rounded-2xl bg-white p-3 shadow-[0_12px_28px_rgba(15,23,42,0.06)]">
              <CalendarRange className="size-6 text-[color:var(--color-brand-500)]" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-[color:var(--color-fg-default)]">
                Nenhum horário reservado nesta data
              </h2>
              <p className="text-sm leading-7 text-[color:var(--color-fg-muted)]">
                Quando novos clientes escolherem um horário disponível, eles aparecerão aqui com
                status e ações rápidas.
              </p>
            </div>
          </div>
        </section>
      ) : null}

      {[
        { title: "Próximos atendimentos", subtitle: "O que ainda vai acontecer hoje", items: upcomingAppointments },
        { title: "Atendimentos finalizados", subtitle: "Tudo que já passou nesta data", items: pastAppointments },
      ]
        .filter((group) => group.items.length > 0)
        .map((group) => (
          <section key={group.title} className="space-y-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-[color:var(--color-fg-default)]">
                  {group.title}
                </h2>
                <p className="mt-1 text-sm text-[color:var(--color-fg-muted)]">{group.subtitle}</p>
              </div>
              <p className="text-sm font-medium text-[color:var(--color-fg-muted)]">
                {group.items.length} {group.items.length === 1 ? "registro" : "registros"}
              </p>
            </div>

            <div className="grid gap-4">
              {group.items.map((appointment) => {
                const status = statusMeta[appointment.status];
                const StatusIcon = status.icon;

                return (
                  <article
                    key={appointment.id}
                    className="overflow-hidden rounded-[30px] border border-[color:var(--color-border-default)] bg-white shadow-[0_20px_50px_rgba(15,23,42,0.04)]"
                  >
                    <div className="border-b border-[color:var(--color-border-default)] px-5 py-4 md:px-6">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center gap-3">
                            <div className="flex size-11 items-center justify-center rounded-2xl bg-[color:var(--color-surface-muted)] text-[color:var(--color-brand-500)]">
                              <UserRound className="size-5" />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-[color:var(--color-fg-default)]">
                                {appointment.customerNameSnapshot}
                              </h3>
                              <p className="text-sm text-[color:var(--color-fg-muted)]">
                                {appointment.serviceNameSnapshot} com {appointment.professional.displayName}
                                {appointment.professional.roleLabel
                                  ? ` • ${appointment.professional.roleLabel}`
                                  : ""}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <span
                              className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] ${status.badgeClassName}`}
                            >
                              <StatusIcon className="size-3.5" />
                              {status.label}
                            </span>
                            <span className="rounded-full border border-[color:var(--color-border-default)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-fg-muted)]">
                              {appointment.source}
                            </span>
                          </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[470px]">
                          <div className="rounded-[22px] bg-[color:var(--color-surface-muted)] px-4 py-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--color-fg-muted)]">
                              Horário
                            </p>
                            <p className="mt-2 text-sm font-semibold text-[color:var(--color-fg-default)]">
                              {formatAppointmentPeriod(
                                appointment.startsAtUtc,
                                appointment.endsAtUtc,
                                membership.business.timezone,
                              )}
                            </p>
                          </div>
                          <div className="rounded-[22px] bg-[color:var(--color-surface-muted)] px-4 py-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--color-fg-muted)]">
                              Contato
                            </p>
                            <p className="mt-2 text-sm font-semibold text-[color:var(--color-fg-default)]">
                              {formatPhone(appointment.customerPhoneSnapshot)}
                            </p>
                          </div>
                          <div className="rounded-[22px] bg-[color:var(--color-surface-muted)] px-4 py-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--color-fg-muted)]">
                              Valor
                            </p>
                            <p className="mt-2 text-sm font-semibold text-[color:var(--color-fg-default)]">
                              {new Intl.NumberFormat("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              }).format(appointment.priceCents / 100)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-4 px-5 py-4 md:px-6 lg:flex-row lg:items-center lg:justify-between">
                      <div className="max-w-2xl">
                        <p className="text-sm text-[color:var(--color-fg-muted)]">
                          Atualize o status do horário conforme o atendimento evolui. Isso mantém o
                          histórico do cliente e os relatórios sempre consistentes.
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { label: "Confirmar", status: AppointmentStatus.CONFIRMED },
                          { label: "Concluir", status: AppointmentStatus.COMPLETED },
                          { label: "Não compareceu", status: AppointmentStatus.NO_SHOW },
                          { label: "Cancelar", status: AppointmentStatus.CANCELLED },
                        ].map((action) => (
                          <form key={action.status} action={updateAppointmentStatusAction}>
                            <input type="hidden" name="appointmentId" value={appointment.id} />
                            <input type="hidden" name="status" value={action.status} />
                            <button
                              className={[
                                "rounded-full border px-4 py-2.5 text-sm font-semibold transition",
                                appointment.status === action.status
                                  ? "border-transparent bg-[color:var(--color-brand-500)] text-white shadow-[0_14px_28px_rgba(37,99,235,0.18)]"
                                  : "border-[color:var(--color-border-default)] bg-white text-[color:var(--color-fg-default)] hover:bg-[color:var(--color-surface-muted)]",
                              ].join(" ")}
                            >
                              {action.label}
                            </button>
                          </form>
                        ))}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ))}
    </div>
  );
}
