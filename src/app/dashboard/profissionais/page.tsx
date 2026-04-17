import { redirect } from "next/navigation";
import { createProfessionalAction, toggleProfessionalStatusAction } from "@/server/actions/dashboard";
import { prisma } from "@/lib/prisma";
import { getCurrentMembership } from "@/server/services/me";

export default async function ProfissionaisPage() {
  const membership = await getCurrentMembership();

  if (!membership) {
    redirect("/login");
  }

  const [professionals, services] = await Promise.all([
    prisma.professional.findMany({
      where: { businessId: membership.businessId, deletedAt: null },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      include: {
        services: {
          include: {
            service: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    }),
    prisma.service.findMany({
      where: {
        businessId: membership.businessId,
        deletedAt: null,
        isActive: true,
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        name: true,
      },
    }),
  ]);

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[color:var(--color-fg-muted)]">
          Profissionais
        </p>
        <h1 className="text-4xl font-semibold text-[color:var(--color-fg-default)]">
          Equipe, foto e serviços atendidos
        </h1>
      </header>

      <section className="rounded-[28px] border border-[color:var(--color-border-default)] bg-white p-6">
        <h2 className="text-xl font-semibold text-[color:var(--color-fg-default)]">
          Adicionar profissional
        </h2>
        <form action={createProfessionalAction} className="mt-5 grid gap-4 md:grid-cols-2">
          <input
            name="displayName"
            placeholder="Nome de exibição"
            className="h-11 rounded-2xl border border-[color:var(--color-border-default)] px-4"
            required
          />
          <input
            name="roleLabel"
            placeholder="Cargo ou especialidade"
            className="h-11 rounded-2xl border border-[color:var(--color-border-default)] px-4"
          />
          <input
            name="photoUrl"
            type="url"
            placeholder="URL da foto do profissional"
            className="h-11 rounded-2xl border border-[color:var(--color-border-default)] px-4 md:col-span-2"
          />

          <div className="rounded-[24px] border border-[color:var(--color-border-default)] bg-slate-50 p-4 md:col-span-2">
            <p className="text-sm font-semibold text-[color:var(--color-fg-default)]">
              Serviços atendidos
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {services.length ? (
                services.map((service) => (
                  <label
                    key={service.id}
                    className="flex items-center gap-3 rounded-2xl border border-[color:var(--color-border-default)] bg-white px-4 py-3 text-sm text-[color:var(--color-fg-default)]"
                  >
                    <input type="checkbox" name="serviceIds" value={service.id} className="h-4 w-4" />
                    <span>{service.name}</span>
                  </label>
                ))
              ) : (
                <p className="text-sm text-[color:var(--color-fg-muted)]">
                  Cadastre um serviço antes de vincular profissionais.
                </p>
              )}
            </div>
          </div>

          <button className="h-11 rounded-full bg-[color:var(--color-brand-500)] px-5 text-sm font-semibold text-white md:w-fit">
            Salvar profissional
          </button>
        </form>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {professionals.map((professional) => (
          <article
            key={professional.id}
            className="rounded-[28px] border border-[color:var(--color-border-default)] bg-white p-5"
          >
            <div className="flex items-start gap-4">
              {professional.photoUrl ? (
                <img
                  src={professional.photoUrl}
                  alt={`Foto de ${professional.displayName}`}
                  className="h-16 w-16 rounded-2xl object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-lg font-semibold text-slate-700">
                  {professional.displayName.slice(0, 1).toUpperCase()}
                </div>
              )}

              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-lg font-semibold text-[color:var(--color-fg-default)]">
                    {professional.displayName}
                  </h2>
                  <span className="rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-fg-muted)]">
                    {professional.status === "ACTIVE" ? "Ativo" : "Inativo"}
                  </span>
                </div>
                <p className="mt-2 text-sm text-[color:var(--color-fg-muted)]">
                  {professional.roleLabel || "Sem cargo configurado"}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {professional.services.length ? (
                    professional.services.map((service) => (
                      <span
                        key={service.id}
                        className="rounded-full border border-[color:var(--color-border-default)] px-3 py-2 text-xs font-semibold text-[color:var(--color-fg-muted)]"
                      >
                        {service.service.name}
                      </span>
                    ))
                  ) : (
                    <span className="rounded-full bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
                      Sem serviços vinculados
                    </span>
                  )}
                </div>
              </div>
            </div>
            <form action={toggleProfessionalStatusAction} className="mt-5">
              <input type="hidden" name="professionalId" value={professional.id} />
              <button className="rounded-full border border-[color:var(--color-border-default)] px-4 py-2 text-sm font-semibold text-[color:var(--color-fg-default)]">
                {professional.status === "ACTIVE" ? "Desativar profissional" : "Reativar profissional"}
              </button>
            </form>
          </article>
        ))}
      </section>
    </div>
  );
}
