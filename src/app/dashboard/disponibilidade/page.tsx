import { redirect } from "next/navigation";
import { Clock3, Layers3, TimerReset, UserRound } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { createAvailabilityAction, deleteAvailabilityAction } from "@/server/actions/dashboard";
import { getCurrentMembership } from "@/server/services/me";

const weekdays = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];

function minutesToTime(value: number) {
  const hours = Math.floor(value / 60)
    .toString()
    .padStart(2, "0");
  const minutes = (value % 60).toString().padStart(2, "0");

  return `${hours}:${minutes}`;
}

export default async function DisponibilidadePage() {
  const membership = await getCurrentMembership();

  if (!membership) {
    redirect("/login");
  }

  const [professionals, availabilities] = await Promise.all([
    prisma.professional.findMany({
      where: {
        businessId: membership.businessId,
        deletedAt: null,
      },
      orderBy: [{ sortOrder: "asc" }, { displayName: "asc" }],
      select: {
        id: true,
        displayName: true,
      },
    }),
    prisma.availability.findMany({
      where: {
        businessId: membership.businessId,
      },
      orderBy: [{ dayOfWeek: "asc" }, { startMinutes: "asc" }],
      include: {
        professional: {
          select: {
            displayName: true,
          },
        },
      },
    }),
  ]);

  const totalCapacity = availabilities.reduce((sum, item) => sum + item.capacity, 0);

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--color-border-default)] bg-[color:var(--color-surface-muted)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.26em] text-[color:var(--color-fg-muted)]">
            <Clock3 className="size-3.5 text-[color:var(--color-brand-500)]" />
            Disponibilidade
          </div>
          <h1 className="text-4xl font-semibold leading-tight text-[color:var(--color-fg-default)]">
            Deixe claro quando cada profissional pode receber novos agendamentos.
          </h1>
          <p className="text-sm leading-7 text-[color:var(--color-fg-muted)] md:text-base">
            A disponibilidade que você configurar aqui é exatamente o que o cliente verá na página
            pública. Se um horário for reservado, ele deixa de aparecer como opção.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[430px]">
          <article className="rounded-[26px] border border-[color:var(--color-border-default)] bg-white p-4 shadow-[0_14px_36px_rgba(15,23,42,0.04)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--color-fg-muted)]">
              Profissionais
            </p>
            <p className="mt-3 text-3xl font-semibold text-[color:var(--color-fg-default)]">
              {professionals.length}
            </p>
          </article>
          <article className="rounded-[26px] border border-[color:var(--color-border-default)] bg-white p-4 shadow-[0_14px_36px_rgba(15,23,42,0.04)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--color-fg-muted)]">
              Faixas ativas
            </p>
            <p className="mt-3 text-3xl font-semibold text-[color:var(--color-fg-default)]">
              {availabilities.length}
            </p>
          </article>
          <article className="rounded-[26px] border border-[color:var(--color-border-default)] bg-white p-4 shadow-[0_14px_36px_rgba(15,23,42,0.04)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--color-fg-muted)]">
              Capacidade total
            </p>
            <p className="mt-3 text-3xl font-semibold text-[color:var(--color-fg-default)]">
              {totalCapacity}
            </p>
          </article>
        </div>
      </header>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[32px] border border-[color:var(--color-border-default)] bg-white p-6 shadow-[0_20px_50px_rgba(15,23,42,0.05)] md:p-7">
          <div className="max-w-2xl space-y-2">
            <h2 className="text-2xl font-semibold text-[color:var(--color-fg-default)]">
              Criar nova faixa de atendimento
            </h2>
            <p className="text-sm leading-7 text-[color:var(--color-fg-muted)]">
              Escolha o profissional, o dia da semana e o intervalo exato em que ele ficará
              disponível para receber clientes.
            </p>
          </div>

          <form action={createAvailabilityAction} className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label
                className="text-sm font-medium text-[color:var(--color-fg-default)]"
                htmlFor="professionalId"
              >
                Profissional
              </label>
              <select
                id="professionalId"
                name="professionalId"
                className="h-12 w-full rounded-2xl border border-[color:var(--color-border-default)] bg-white px-4 text-sm text-[color:var(--color-fg-default)] outline-none transition focus:border-[color:var(--color-brand-500)]"
                required
              >
                <option value="">Selecione o profissional</option>
                {professionals.map((professional) => (
                  <option key={professional.id} value={professional.id}>
                    {professional.displayName}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[color:var(--color-fg-default)]" htmlFor="dayOfWeek">
                Dia da semana
              </label>
              <select
                id="dayOfWeek"
                name="dayOfWeek"
                className="h-12 w-full rounded-2xl border border-[color:var(--color-border-default)] bg-white px-4 text-sm text-[color:var(--color-fg-default)] outline-none transition focus:border-[color:var(--color-brand-500)]"
                defaultValue="1"
              >
                {weekdays.map((label, index) => (
                  <option key={label} value={index}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[color:var(--color-fg-default)]" htmlFor="startMinutes">
                Início
              </label>
              <input
                id="startMinutes"
                name="startMinutes"
                type="time"
                defaultValue="09:00"
                className="h-12 w-full rounded-2xl border border-[color:var(--color-border-default)] px-4 text-sm text-[color:var(--color-fg-default)] outline-none transition focus:border-[color:var(--color-brand-500)]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[color:var(--color-fg-default)]" htmlFor="endMinutes">
                Fim
              </label>
              <input
                id="endMinutes"
                name="endMinutes"
                type="time"
                defaultValue="18:00"
                className="h-12 w-full rounded-2xl border border-[color:var(--color-border-default)] px-4 text-sm text-[color:var(--color-fg-default)] outline-none transition focus:border-[color:var(--color-brand-500)]"
              />
            </div>

            <div className="space-y-2">
              <label
                className="text-sm font-medium text-[color:var(--color-fg-default)]"
                htmlFor="slotIntervalMinutes"
              >
                Intervalo dos horários
              </label>
              <select
                id="slotIntervalMinutes"
                name="slotIntervalMinutes"
                className="h-12 w-full rounded-2xl border border-[color:var(--color-border-default)] bg-white px-4 text-sm text-[color:var(--color-fg-default)] outline-none transition focus:border-[color:var(--color-brand-500)]"
                defaultValue="30"
              >
                {[5, 10, 15, 20, 30, 45, 60].map((interval) => (
                  <option key={interval} value={interval}>
                    {interval} minutos
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[color:var(--color-fg-default)]" htmlFor="capacity">
                Capacidade simultânea
              </label>
              <input
                id="capacity"
                name="capacity"
                type="number"
                min="1"
                defaultValue="1"
                className="h-12 w-full rounded-2xl border border-[color:var(--color-border-default)] px-4 text-sm text-[color:var(--color-fg-default)] outline-none transition focus:border-[color:var(--color-brand-500)]"
              />
            </div>

            <button className="inline-flex h-12 items-center justify-center rounded-2xl bg-[color:var(--color-brand-500)] px-6 text-sm font-semibold text-white shadow-[0_16px_32px_rgba(37,99,235,0.18)] transition hover:bg-[color:var(--color-brand-600)] md:w-fit">
              Salvar disponibilidade
            </button>
          </form>
        </div>

        <aside className="grid gap-4">
          <article className="rounded-[30px] border border-[color:var(--color-border-default)] bg-[linear-gradient(180deg,#0f172a_0%,#172554_100%)] p-6 text-white shadow-[0_24px_70px_rgba(15,23,42,0.16)]">
            <div className="space-y-3">
              <div className="inline-flex size-11 items-center justify-center rounded-2xl border border-white/10 bg-white/10">
                <UserRound className="size-5" />
              </div>
              <h3 className="text-xl font-semibold">O profissional escolhe os horários</h3>
              <p className="text-sm leading-7 text-white/70">
                O cliente só consegue reservar dentro das janelas configuradas aqui. Quando um
                horário é escolhido, ele sai automaticamente da lista pública.
              </p>
            </div>
          </article>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
            <article className="rounded-[26px] border border-[color:var(--color-border-default)] bg-white p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-[color:var(--color-surface-muted)] p-2.5 text-[color:var(--color-brand-500)]">
                  <TimerReset className="size-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[color:var(--color-fg-default)]">
                    Intervalos consistentes
                  </p>
                  <p className="mt-1 text-sm text-[color:var(--color-fg-muted)]">
                    Escolha blocos de 15, 30 ou 60 minutos para facilitar a agenda.
                  </p>
                </div>
              </div>
            </article>

            <article className="rounded-[26px] border border-[color:var(--color-border-default)] bg-white p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-[color:var(--color-surface-muted)] p-2.5 text-[color:var(--color-brand-500)]">
                  <Layers3 className="size-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[color:var(--color-fg-default)]">
                    Capacidade por faixa
                  </p>
                  <p className="mt-1 text-sm text-[color:var(--color-fg-muted)]">
                    Ideal para aulas, atendimentos em grupo ou múltiplos encaixes.
                  </p>
                </div>
              </div>
            </article>
          </div>
        </aside>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-[color:var(--color-fg-default)]">
              Faixas já configuradas
            </h2>
            <p className="mt-1 text-sm text-[color:var(--color-fg-muted)]">
              Revise e remova horários da equipe sempre que a operação mudar.
            </p>
          </div>
        </div>

        {availabilities.length === 0 ? (
          <div className="rounded-[30px] border border-dashed border-[color:var(--color-border-default)] bg-[color:var(--color-surface-muted)] p-8 text-center text-sm text-[color:var(--color-fg-muted)]">
            Ainda não há janelas de atendimento configuradas para a equipe.
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {availabilities.map((availability) => (
              <article
                key={availability.id}
                className="rounded-[28px] border border-[color:var(--color-border-default)] bg-white p-5 shadow-[0_16px_36px_rgba(15,23,42,0.04)]"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex size-11 items-center justify-center rounded-2xl bg-[color:var(--color-surface-muted)] text-[color:var(--color-brand-500)]">
                        <UserRound className="size-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-[color:var(--color-fg-default)]">
                          {availability.professional.displayName}
                        </h3>
                        <p className="text-sm text-[color:var(--color-fg-muted)]">
                          {weekdays[availability.dayOfWeek]}
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="rounded-[20px] bg-[color:var(--color-surface-muted)] px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--color-fg-muted)]">
                          Período
                        </p>
                        <p className="mt-2 text-sm font-semibold text-[color:var(--color-fg-default)]">
                          {minutesToTime(availability.startMinutes)} às{" "}
                          {minutesToTime(availability.endMinutes)}
                        </p>
                      </div>
                      <div className="rounded-[20px] bg-[color:var(--color-surface-muted)] px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--color-fg-muted)]">
                          Intervalo
                        </p>
                        <p className="mt-2 text-sm font-semibold text-[color:var(--color-fg-default)]">
                          {availability.slotIntervalMinutes} min
                        </p>
                      </div>
                      <div className="rounded-[20px] bg-[color:var(--color-surface-muted)] px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--color-fg-muted)]">
                          Capacidade
                        </p>
                        <p className="mt-2 text-sm font-semibold text-[color:var(--color-fg-default)]">
                          {availability.capacity} simultâneo(s)
                        </p>
                      </div>
                    </div>
                  </div>

                  <form action={deleteAvailabilityAction}>
                    <input type="hidden" name="availabilityId" value={availability.id} />
                    <button className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100">
                      Excluir faixa
                    </button>
                  </form>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
