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
import { AppointmentStatus } from "@/lib/domain-enums";
import { formatPhone } from "@/lib/utils";
import { updateAppointmentStatusAction } from "@/server/actions/dashboard";
import { getAppointmentsForBusinessDateFromFirestore } from "@/server/services/firestore-read";
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
    badgeClassName:
      "bg-[var(--z-amber-dim)] text-[var(--z-amber)] ring-1 ring-[rgba(251,191,36,0.18)]",
    icon: Clock3,
  },
  CONFIRMED: {
    label: "Confirmado",
    badgeClassName:
      "bg-[var(--z-blue-dim)] text-[var(--z-blue)] ring-1 ring-[rgba(79,142,247,0.18)]",
    icon: CheckCircle2,
  },
  COMPLETED: {
    label: "Concluído",
    badgeClassName:
      "bg-[var(--z-green-dim)] text-[var(--z-green)] ring-1 ring-[rgba(52,211,153,0.18)]",
    icon: CheckCircle2,
  },
  CANCELLED: {
    label: "Cancelado",
    badgeClassName:
      "bg-[var(--z-red-dim)] text-[var(--z-red)] ring-1 ring-[rgba(248,113,113,0.18)]",
    icon: XCircle,
  },
  NO_SHOW: {
    label: "Não compareceu",
    badgeClassName: "bg-white/8 text-slate-300 ring-1 ring-white/10",
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

  const appointments = await getAppointmentsForBusinessDateFromFirestore({
    businessId: membership.businessId,
    startUtc,
    endUtc,
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
      <header className="overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(135deg,rgba(15,23,42,0.96)_0%,rgba(29,78,216,0.92)_100%)] p-6 text-white shadow-[0_24px_70px_rgba(15,23,42,0.18)] md:p-8">
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
              className="inline-flex items-center gap-2 rounded-full border border-[rgba(79,142,247,0.32)] bg-[var(--z-blue)] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(79,142,247,0.18)] transition hover:bg-[var(--z-blue-hover)]"
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
        <section className="rounded-[32px] border border-dashed border-white/10 bg-[var(--z-surface)] p-8 text-center shadow-[0_18px_40px_rgba(5,10,25,0.16)]">
          <div className="mx-auto flex max-w-md flex-col items-center gap-4">
            <div className="rounded-2xl border border-white/8 bg-[var(--z-surface-3)] p-3 shadow-[0_12px_28px_rgba(5,10,25,0.12)]">
              <CalendarRange className="size-6 text-[var(--z-blue)]" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-white">
                Nenhum horário reservado nesta data
              </h2>
              <p className="text-sm leading-7 text-slate-400">
                Quando novos clientes escolherem um horário disponível, eles aparecerão aqui com
                status e ações rápidas.
              </p>
            </div>
          </div>
        </section>
      ) : null}

      {[
        {
          title: "Próximos atendimentos",
          subtitle: "O que ainda vai acontecer hoje",
          items: upcomingAppointments,
        },
        {
          title: "Atendimentos finalizados",
          subtitle: "Tudo que já passou nesta data",
          items: pastAppointments,
        },
      ]
        .filter((group) => group.items.length > 0)
        .map((group) => (
          <section key={group.title} className="space-y-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-white">{group.title}</h2>
                <p className="mt-1 text-sm text-slate-400">{group.subtitle}</p>
              </div>
              <p className="text-sm font-medium text-slate-500">
                {group.items.length} {group.items.length === 1 ? "registro" : "registros"}
              </p>
            </div>

            <div className="grid gap-4">
              {group.items.map((appointment) => {
                const status = statusMeta[appointment.status as AppointmentStatus];
                const StatusIcon = status.icon;

                return (
                  <article
                    key={appointment.id}
                    className="overflow-hidden rounded-[30px] border border-white/8 bg-[var(--z-surface)] shadow-[0_20px_50px_rgba(5,10,25,0.16)]"
                  >
                    <div className="border-b border-white/8 px-5 py-4 md:px-6">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center gap-3">
                            <div className="flex size-11 items-center justify-center rounded-2xl bg-[var(--z-surface-3)] text-[var(--z-blue)]">
                              <UserRound className="size-5" />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-white">
                                {appointment.customerNameSnapshot}
                              </h3>
                              <p className="text-sm text-slate-400">
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
                            <span className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                              {appointment.source}
                            </span>
                          </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[470px]">
                          <div className="rounded-[22px] bg-[var(--z-surface-3)] px-4 py-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                              Horário
                            </p>
                            <p className="mt-2 text-sm font-semibold text-white">
                              {formatAppointmentPeriod(
                                appointment.startsAtUtc,
                                appointment.endsAtUtc,
                                membership.business.timezone,
                              )}
                            </p>
                          </div>
                          <div className="rounded-[22px] bg-[var(--z-surface-3)] px-4 py-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                              Contato
                            </p>
                            <p className="mt-2 text-sm font-semibold text-white">
                              {formatPhone(appointment.customerPhoneSnapshot)}
                            </p>
                          </div>
                          <div className="rounded-[22px] bg-[var(--z-surface-3)] px-4 py-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                              Valor
                            </p>
                            <p className="mt-2 text-sm font-semibold text-white">
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
                        <p className="text-sm text-slate-400">
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
                                  ? "border-transparent bg-[var(--z-blue)] text-white shadow-[0_14px_28px_rgba(79,142,247,0.18)]"
                                  : "border-white/10 bg-[var(--z-surface-3)] text-slate-200 hover:bg-white/6",
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
