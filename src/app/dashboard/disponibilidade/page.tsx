import { redirect } from "next/navigation";
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

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[color:var(--color-fg-muted)]">
          Disponibilidade
        </p>
        <h1 className="text-4xl font-semibold text-[color:var(--color-fg-default)]">
          Horários de atendimento
        </h1>
      </header>

      <section className="rounded-[28px] border border-[color:var(--color-border-default)] bg-white p-6">
        <h2 className="text-xl font-semibold text-[color:var(--color-fg-default)]">
          Adicionar janela de atendimento
        </h2>
        <form action={createAvailabilityAction} className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <select
            name="professionalId"
            className="h-11 rounded-2xl border border-[color:var(--color-border-default)] px-4 text-sm text-[color:var(--color-fg-default)]"
            required
          >
            <option value="">Selecione o profissional</option>
            {professionals.map((professional) => (
              <option key={professional.id} value={professional.id}>
                {professional.displayName}
              </option>
            ))}
          </select>
          <select
            name="dayOfWeek"
            className="h-11 rounded-2xl border border-[color:var(--color-border-default)] px-4 text-sm text-[color:var(--color-fg-default)]"
            defaultValue="1"
          >
            {weekdays.map((label, index) => (
              <option key={label} value={index}>
                {label}
              </option>
            ))}
          </select>
          <input
            name="startMinutes"
            type="number"
            min="0"
            max="1439"
            defaultValue="540"
            placeholder="Início em minutos"
            className="h-11 rounded-2xl border border-[color:var(--color-border-default)] px-4"
          />
          <input
            name="endMinutes"
            type="number"
            min="0"
            max="1439"
            defaultValue="1080"
            placeholder="Fim em minutos"
            className="h-11 rounded-2xl border border-[color:var(--color-border-default)] px-4"
          />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-2 xl:col-span-1">
            <input
              name="slotIntervalMinutes"
              type="number"
              min="5"
              step="5"
              defaultValue="30"
              placeholder="Intervalo"
              className="h-11 rounded-2xl border border-[color:var(--color-border-default)] px-4"
            />
            <input
              name="capacity"
              type="number"
              min="1"
              defaultValue="1"
              placeholder="Capacidade"
              className="h-11 rounded-2xl border border-[color:var(--color-border-default)] px-4"
            />
          </div>
          <button className="h-11 rounded-full bg-[color:var(--color-brand-500)] px-5 text-sm font-semibold text-white md:w-fit xl:col-span-5">
            Salvar disponibilidade
          </button>
        </form>
      </section>

      <section className="grid gap-4">
        {availabilities.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-[color:var(--color-border-default)] bg-slate-50 p-8 text-sm text-[color:var(--color-fg-muted)]">
            Ainda não há horários configurados para a equipe.
          </div>
        ) : null}

        {availabilities.map((availability) => (
          <article
            key={availability.id}
            className="rounded-[28px] border border-[color:var(--color-border-default)] bg-white p-5"
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-[color:var(--color-fg-default)]">
                  {availability.professional.displayName}
                </h2>
                <p className="mt-1 text-sm text-[color:var(--color-fg-muted)]">
                  {weekdays[availability.dayOfWeek]} · {minutesToTime(availability.startMinutes)} às{" "}
                  {minutesToTime(availability.endMinutes)}
                </p>
                <p className="mt-2 text-sm text-[color:var(--color-fg-muted)]">
                  Intervalo de {availability.slotIntervalMinutes} min · Capacidade {availability.capacity}
                </p>
              </div>

              <form action={deleteAvailabilityAction}>
                <input type="hidden" name="availabilityId" value={availability.id} />
                <button className="rounded-full border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700">
                  Excluir faixa
                </button>
              </form>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
