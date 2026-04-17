import { redirect } from "next/navigation";
import { BriefcaseBusiness, Sparkles, UserRound, UsersRound } from "lucide-react";
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

  const activeProfessionals = professionals.filter((professional) => professional.status === "ACTIVE").length;

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--color-border-default)] bg-[color:var(--color-surface-muted)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.26em] text-[color:var(--color-fg-muted)]">
            <UsersRound className="size-3.5 text-[color:var(--color-brand-500)]" />
            Profissionais
          </div>
          <h1 className="text-4xl font-semibold leading-tight text-[color:var(--color-fg-default)]">
            Monte uma equipe com boa apresentação e serviços bem vinculados.
          </h1>
          <p className="text-sm leading-7 text-[color:var(--color-fg-muted)] md:text-base">
            Cada profissional pode aparecer na página pública com foto, especialidade e serviços
            específicos, o que torna a escolha do cliente muito mais clara.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[430px]">
          <article className="rounded-[26px] border border-[color:var(--color-border-default)] bg-white p-4 shadow-[0_14px_36px_rgba(15,23,42,0.04)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--color-fg-muted)]">
              Equipe total
            </p>
            <p className="mt-3 text-3xl font-semibold text-[color:var(--color-fg-default)]">
              {professionals.length}
            </p>
          </article>
          <article className="rounded-[26px] border border-[color:var(--color-border-default)] bg-white p-4 shadow-[0_14px_36px_rgba(15,23,42,0.04)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--color-fg-muted)]">
              Ativos
            </p>
            <p className="mt-3 text-3xl font-semibold text-[color:var(--color-fg-default)]">
              {activeProfessionals}
            </p>
          </article>
          <article className="rounded-[26px] border border-[color:var(--color-border-default)] bg-white p-4 shadow-[0_14px_36px_rgba(15,23,42,0.04)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--color-fg-muted)]">
              Serviços ativos
            </p>
            <p className="mt-3 text-3xl font-semibold text-[color:var(--color-fg-default)]">
              {services.length}
            </p>
          </article>
        </div>
      </header>

      <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="rounded-[32px] border border-[color:var(--color-border-default)] bg-white p-6 shadow-[0_20px_50px_rgba(15,23,42,0.05)] md:p-7">
          <div className="max-w-2xl space-y-2">
            <h2 className="text-2xl font-semibold text-[color:var(--color-fg-default)]">
              Adicionar profissional
            </h2>
            <p className="text-sm leading-7 text-[color:var(--color-fg-muted)]">
              Crie perfis com nome, especialidade, foto e os serviços que cada pessoa está apta a
              atender.
            </p>
          </div>

          <form action={createProfessionalAction} className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label
                className="text-sm font-medium text-[color:var(--color-fg-default)]"
                htmlFor="displayName"
              >
                Nome de exibição
              </label>
              <input
                id="displayName"
                name="displayName"
                placeholder="Ex.: Ana Silva"
                className="h-12 w-full rounded-2xl border border-[color:var(--color-border-default)] px-4 text-sm text-[color:var(--color-fg-default)] outline-none transition focus:border-[color:var(--color-brand-500)]"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[color:var(--color-fg-default)]" htmlFor="roleLabel">
                Cargo ou especialidade
              </label>
              <input
                id="roleLabel"
                name="roleLabel"
                placeholder="Ex.: Barbeiro, Dermato funcional"
                className="h-12 w-full rounded-2xl border border-[color:var(--color-border-default)] px-4 text-sm text-[color:var(--color-fg-default)] outline-none transition focus:border-[color:var(--color-brand-500)]"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-[color:var(--color-fg-default)]" htmlFor="photoUrl">
                URL da foto
              </label>
              <input
                id="photoUrl"
                name="photoUrl"
                type="url"
                placeholder="https://..."
                className="h-12 w-full rounded-2xl border border-[color:var(--color-border-default)] px-4 text-sm text-[color:var(--color-fg-default)] outline-none transition focus:border-[color:var(--color-brand-500)]"
              />
            </div>

            <div className="rounded-[24px] border border-[color:var(--color-border-default)] bg-[color:var(--color-surface-muted)] p-4 md:col-span-2">
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

            <button className="inline-flex h-12 items-center justify-center rounded-2xl bg-[color:var(--color-brand-500)] px-6 text-sm font-semibold text-white shadow-[0_16px_32px_rgba(37,99,235,0.18)] transition hover:bg-[color:var(--color-brand-600)] md:w-fit">
              Salvar profissional
            </button>
          </form>
        </div>

        <div className="grid gap-4">
          <article className="rounded-[30px] border border-[color:var(--color-border-default)] bg-[linear-gradient(180deg,#0f172a_0%,#172554_100%)] p-6 text-white shadow-[0_24px_70px_rgba(15,23,42,0.16)]">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
                <Sparkles className="size-5" />
              </div>
              <div className="space-y-3">
                <h2 className="text-xl font-semibold">A página pública fica muito mais forte</h2>
                <p className="text-sm leading-7 text-white/72">
                  Foto, nome e especialidade bem organizados elevam a percepção de valor e ajudam o
                  cliente a confiar antes mesmo do primeiro atendimento.
                </p>
              </div>
            </div>
          </article>

          <article className="rounded-[28px] border border-[color:var(--color-border-default)] bg-white p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-[color:var(--color-surface-muted)] p-2.5 text-[color:var(--color-brand-500)]">
                <BriefcaseBusiness className="size-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[color:var(--color-fg-default)]">
                  Especialidades claras
                </p>
                <p className="mt-1 text-sm text-[color:var(--color-fg-muted)]">
                  Deixe explícito o papel de cada pessoa para evitar escolhas erradas.
                </p>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold text-[color:var(--color-fg-default)]">
            Equipe cadastrada
          </h2>
          <p className="mt-1 text-sm text-[color:var(--color-fg-muted)]">
            Revise quem está ativo e quais serviços cada perfil pode receber.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {professionals.map((professional) => (
            <article
              key={professional.id}
              className="rounded-[30px] border border-[color:var(--color-border-default)] bg-white p-5 shadow-[0_16px_36px_rgba(15,23,42,0.04)]"
            >
              <div className="flex items-start gap-4">
                {professional.photoUrl ? (
                  <img
                    src={professional.photoUrl}
                    alt={`Foto de ${professional.displayName}`}
                    className="h-16 w-16 rounded-[20px] object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-[20px] bg-[color:var(--color-surface-muted)] text-lg font-semibold text-[color:var(--color-brand-500)]">
                    {professional.displayName.slice(0, 1).toUpperCase()}
                  </div>
                )}

                <div className="min-w-0 flex-1 space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-lg font-semibold text-[color:var(--color-fg-default)]">
                      {professional.displayName}
                    </h2>
                    <span
                      className={[
                        "rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em]",
                        professional.status === "ACTIVE"
                          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
                          : "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
                      ].join(" ")}
                    >
                      {professional.status === "ACTIVE" ? "Ativo" : "Inativo"}
                    </span>
                  </div>

                  <p className="text-sm text-[color:var(--color-fg-muted)]">
                    {professional.roleLabel || "Sem especialidade configurada"}
                  </p>

                  <div className="flex flex-wrap gap-2">
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
                <button className="rounded-full border border-[color:var(--color-border-default)] px-4 py-2.5 text-sm font-semibold text-[color:var(--color-fg-default)] transition hover:bg-[color:var(--color-surface-muted)]">
                  {professional.status === "ACTIVE" ? "Desativar profissional" : "Reativar profissional"}
                </button>
              </form>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
