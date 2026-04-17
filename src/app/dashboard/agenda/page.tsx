import Link from "next/link";
import { redirect } from "next/navigation";
import { addDays, format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { fromZonedTime, formatInTimeZone } from "date-fns-tz";
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

const statusLabel: Record<AppointmentStatus, string> = {
  PENDING: "Pendente",
  CONFIRMED: "Confirmado",
  COMPLETED: "Concluído",
  CANCELLED: "Cancelado",
  NO_SHOW: "Não compareceu",
};

const statusClassName: Record<AppointmentStatus, string> = {
  PENDING: "bg-amber-50 text-amber-700",
  CONFIRMED: "bg-blue-50 text-blue-700",
  COMPLETED: "bg-emerald-50 text-emerald-700",
  CANCELLED: "bg-rose-50 text-rose-700",
  NO_SHOW: "bg-slate-200 text-slate-700",
};

function buildDayBounds(date: string, timezone: string) {
  const startLocal = `${date}T00:00:00`;
  const endLocal = `${date}T23:59:59.999`;

  return {
    startUtc: fromZonedTime(startLocal, timezone),
    endUtc: fromZonedTime(endLocal, timezone),
  };
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

  return (
    <div className="space-y-8">
      <header className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[color:var(--color-fg-muted)]">
            Agenda
          </p>
          <h1 className="text-4xl font-semibold text-[color:var(--color-fg-default)]">
            Dia a dia da operação
          </h1>
          <p className="max-w-3xl text-sm leading-7 text-[color:var(--color-fg-muted)]">
            Navegue por data, acompanhe o que ainda vai acontecer e atualize o status dos
            atendimentos sem sair da agenda.
          </p>
        </div>

        <div className="flex flex-col gap-3 rounded-[28px] border border-[color:var(--color-border-default)] bg-slate-50 p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-[color:var(--color-fg-muted)]">Data selecionada</p>
            <p className="mt-1 text-xl font-semibold text-[color:var(--color-fg-default)]">
              {formatInTimeZone(startUtc, membership.business.timezone, "EEEE, dd 'de' MMMM", {
                locale: ptBR,
              })}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/dashboard/agenda?date=${previousDate}`}
              className="rounded-full border border-[color:var(--color-border-default)] px-4 py-2 text-sm font-semibold text-[color:var(--color-fg-default)]"
            >
              Dia anterior
            </Link>
            <Link
              href={`/dashboard/agenda?date=${today}`}
              className="rounded-full border border-[color:var(--color-border-default)] px-4 py-2 text-sm font-semibold text-[color:var(--color-fg-default)]"
            >
              Hoje
            </Link>
            <Link
              href={`/dashboard/agenda?date=${nextDate}`}
              className="rounded-full bg-[color:var(--color-brand-500)] px-4 py-2 text-sm font-semibold text-white"
            >
              Próximo dia
            </Link>
          </div>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-[28px] border border-[color:var(--color-border-default)] bg-white p-5">
          <p className="text-sm text-[color:var(--color-fg-muted)]">Agendamentos do dia</p>
          <p className="mt-3 text-3xl font-semibold text-[color:var(--color-fg-default)]">
            {appointments.length}
          </p>
        </article>
        <article className="rounded-[28px] border border-[color:var(--color-border-default)] bg-white p-5">
          <p className="text-sm text-[color:var(--color-fg-muted)]">Ainda vão acontecer</p>
          <p className="mt-3 text-3xl font-semibold text-[color:var(--color-fg-default)]">
            {upcomingAppointments.length}
          </p>
        </article>
        <article className="rounded-[28px] border border-[color:var(--color-border-default)] bg-white p-5">
          <p className="text-sm text-[color:var(--color-fg-muted)]">Já passaram</p>
          <p className="mt-3 text-3xl font-semibold text-[color:var(--color-fg-default)]">
            {pastAppointments.length}
          </p>
        </article>
      </section>

      <section className="space-y-6">
        {appointments.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-[color:var(--color-border-default)] bg-slate-50 p-8 text-sm text-[color:var(--color-fg-muted)]">
            Nenhum agendamento encontrado nesta data.
          </div>
        ) : null}

        {[
          { title: "Próximos e em andamento", items: upcomingAppointments },
          { title: "Atendimentos que já passaram", items: pastAppointments },
        ]
          .filter((group) => group.items.length > 0)
          .map((group) => (
            <div key={group.title} className="space-y-4">
              <h2 className="text-xl font-semibold text-[color:var(--color-fg-default)]">
                {group.title}
              </h2>
              <div className="space-y-4">
                {group.items.map((appointment) => (
                  <article
                    key={appointment.id}
                    className="rounded-[28px] border border-[color:var(--color-border-default)] bg-white p-5"
                  >
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-lg font-semibold text-[color:var(--color-fg-default)]">
                            {appointment.customerNameSnapshot}
                          </h3>
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${statusClassName[appointment.status]}`}
                          >
                            {statusLabel[appointment.status]}
                          </span>
                        </div>
                        <p className="text-sm text-[color:var(--color-fg-muted)]">
                          {appointment.serviceNameSnapshot} com {appointment.professional.displayName}
                          {appointment.professional.roleLabel
                            ? ` · ${appointment.professional.roleLabel}`
                            : ""}
                        </p>
                        <div className="grid gap-2 text-sm text-[color:var(--color-fg-muted)] md:grid-cols-3">
                          <p>
                            Horário:{" "}
                            <span className="font-medium text-[color:var(--color-fg-default)]">
                              {formatInTimeZone(
                                appointment.startsAtUtc,
                                membership.business.timezone,
                                "HH:mm",
                              )}{" "}
                              até{" "}
                              {formatInTimeZone(
                                appointment.endsAtUtc,
                                membership.business.timezone,
                                "HH:mm",
                              )}
                            </span>
                          </p>
                          <p>
                            Telefone:{" "}
                            <span className="font-medium text-[color:var(--color-fg-default)]">
                              {formatPhone(appointment.customerPhoneSnapshot)}
                            </span>
                          </p>
                          <p>
                            Origem:{" "}
                            <span className="font-medium text-[color:var(--color-fg-default)]">
                              {appointment.source}
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 xl:max-w-[320px] xl:justify-end">
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
                              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                                appointment.status === action.status
                                  ? "border border-[color:var(--color-brand-500)] bg-blue-50 text-[color:var(--color-brand-600)]"
                                  : "border border-[color:var(--color-border-default)] text-[color:var(--color-fg-default)]"
                              }`}
                            >
                              {action.label}
                            </button>
                          </form>
                        ))}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ))}
      </section>
    </div>
  );
}
