import { redirect } from "next/navigation";
import { Layers3, Palette, Sparkles, Wrench } from "lucide-react";
import { createServiceAction, toggleServiceStatusAction } from "@/server/actions/dashboard";
import { prisma } from "@/lib/prisma";
import { formatCurrencyBRL } from "@/lib/utils";
import { getCurrentMembership } from "@/server/services/me";

export default async function ServicosPage() {
  const membership = await getCurrentMembership();

  if (!membership) {
    redirect("/login");
  }

  const services = await prisma.service.findMany({
    where: { businessId: membership.businessId, deletedAt: null },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    include: {
      variants: {
        where: { deletedAt: null },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      },
    },
  });

  const activeServices = services.filter((service) => service.isActive).length;

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--color-border-default)] bg-[color:var(--color-surface-muted)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.26em] text-[color:var(--color-fg-muted)]">
            <Wrench className="size-3.5 text-[color:var(--color-brand-500)]" />
            Serviços
          </div>
          <h1 className="text-4xl font-semibold leading-tight text-[color:var(--color-fg-default)]">
            Organize seu catálogo com clareza, preço e posicionamento visual.
          </h1>
          <p className="text-sm leading-7 text-[color:var(--color-fg-muted)] md:text-base">
            Os serviços cadastrados aqui aparecem no agendamento público e ajudam o cliente a
            entender exatamente o que pode reservar.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[430px]">
          <article className="rounded-[26px] border border-[color:var(--color-border-default)] bg-white p-4 shadow-[0_14px_36px_rgba(15,23,42,0.04)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--color-fg-muted)]">
              Total
            </p>
            <p className="mt-3 text-3xl font-semibold text-[color:var(--color-fg-default)]">
              {services.length}
            </p>
          </article>
          <article className="rounded-[26px] border border-[color:var(--color-border-default)] bg-white p-4 shadow-[0_14px_36px_rgba(15,23,42,0.04)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--color-fg-muted)]">
              Ativos
            </p>
            <p className="mt-3 text-3xl font-semibold text-[color:var(--color-fg-default)]">
              {activeServices}
            </p>
          </article>
          <article className="rounded-[26px] border border-[color:var(--color-border-default)] bg-white p-4 shadow-[0_14px_36px_rgba(15,23,42,0.04)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--color-fg-muted)]">
              Variações
            </p>
            <p className="mt-3 text-3xl font-semibold text-[color:var(--color-fg-default)]">
              {services.reduce((sum, service) => sum + service.variants.length, 0)}
            </p>
          </article>
        </div>
      </header>

      <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="rounded-[32px] border border-[color:var(--color-border-default)] bg-white p-6 shadow-[0_20px_50px_rgba(15,23,42,0.05)] md:p-7">
          <div className="max-w-2xl space-y-2">
            <h2 className="text-2xl font-semibold text-[color:var(--color-fg-default)]">
              Adicionar novo serviço
            </h2>
            <p className="text-sm leading-7 text-[color:var(--color-fg-muted)]">
              Defina nome, duração, preço, cor e descrição para manter o catálogo visualmente
              consistente e fácil de vender.
            </p>
          </div>

          <form action={createServiceAction} className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[color:var(--color-fg-default)]" htmlFor="name">
                Nome do serviço
              </label>
              <input
                id="name"
                name="name"
                placeholder="Ex.: Corte feminino"
                className="h-12 w-full rounded-2xl border border-[color:var(--color-border-default)] px-4 text-sm text-[color:var(--color-fg-default)] outline-none transition focus:border-[color:var(--color-brand-500)]"
                required
              />
            </div>

            <div className="space-y-2">
              <label
                className="text-sm font-medium text-[color:var(--color-fg-default)]"
                htmlFor="durationMinutes"
              >
                Duração
              </label>
              <input
                id="durationMinutes"
                name="durationMinutes"
                type="number"
                min="5"
                step="5"
                placeholder="45"
                className="h-12 w-full rounded-2xl border border-[color:var(--color-border-default)] px-4 text-sm text-[color:var(--color-fg-default)] outline-none transition focus:border-[color:var(--color-brand-500)]"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[color:var(--color-fg-default)]" htmlFor="price">
                Preço em reais
              </label>
              <input
                id="price"
                name="price"
                type="number"
                min="0"
                step="0.01"
                placeholder="89.90"
                className="h-12 w-full rounded-2xl border border-[color:var(--color-border-default)] px-4 text-sm text-[color:var(--color-fg-default)] outline-none transition focus:border-[color:var(--color-brand-500)]"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[color:var(--color-fg-default)]" htmlFor="colorHex">
                Cor de identificação
              </label>
              <input
                id="colorHex"
                name="colorHex"
                type="text"
                placeholder="#1664E8"
                className="h-12 w-full rounded-2xl border border-[color:var(--color-border-default)] px-4 text-sm text-[color:var(--color-fg-default)] outline-none transition focus:border-[color:var(--color-brand-500)]"
                defaultValue="#1664E8"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-[color:var(--color-fg-default)]" htmlFor="description">
                Descrição curta
              </label>
              <textarea
                id="description"
                name="description"
                placeholder="Explique o que está incluso, para quem é ideal e detalhes importantes."
                className="min-h-[140px] w-full rounded-2xl border border-[color:var(--color-border-default)] px-4 py-3 text-sm text-[color:var(--color-fg-default)] outline-none transition focus:border-[color:var(--color-brand-500)]"
              />
            </div>

            <button className="inline-flex h-12 items-center justify-center rounded-2xl bg-[color:var(--color-brand-500)] px-6 text-sm font-semibold text-white shadow-[0_16px_32px_rgba(37,99,235,0.18)] transition hover:bg-[color:var(--color-brand-600)] md:w-fit">
              Salvar serviço
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
                <h2 className="text-xl font-semibold">Cada serviço ajuda a vender melhor</h2>
                <p className="text-sm leading-7 text-white/72">
                  Nome forte, preço claro e descrição objetiva aumentam a confiança do cliente na
                  hora de escolher um horário.
                </p>
              </div>
            </div>
          </article>

          <article className="rounded-[28px] border border-[color:var(--color-border-default)] bg-white p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-[color:var(--color-surface-muted)] p-2.5 text-[color:var(--color-brand-500)]">
                <Palette className="size-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[color:var(--color-fg-default)]">
                  Organização visual
                </p>
                <p className="mt-1 text-sm text-[color:var(--color-fg-muted)]">
                  Cores ajudam a reconhecer rapidamente os serviços na agenda.
                </p>
              </div>
            </div>
          </article>

          <article className="rounded-[28px] border border-[color:var(--color-border-default)] bg-white p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-[color:var(--color-surface-muted)] p-2.5 text-[color:var(--color-brand-500)]">
                <Layers3 className="size-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[color:var(--color-fg-default)]">
                  Variações prontas
                </p>
                <p className="mt-1 text-sm text-[color:var(--color-fg-muted)]">
                  Use versões como curto, médio e longo para encaixar o mesmo serviço com mais precisão.
                </p>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold text-[color:var(--color-fg-default)]">
            Catálogo publicado
          </h2>
          <p className="mt-1 text-sm text-[color:var(--color-fg-muted)]">
            Tudo que está ativo pode aparecer no fluxo de agendamento público.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {services.map((service) => (
            <article
              key={service.id}
              className="rounded-[30px] border border-[color:var(--color-border-default)] bg-white p-5 shadow-[0_16px_36px_rgba(15,23,42,0.04)]"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span
                      className="block size-4 rounded-full ring-4 ring-[color:var(--color-surface-muted)]"
                      style={{ backgroundColor: service.colorHex ?? undefined }}
                    />
                    <div>
                      <h3 className="text-lg font-semibold text-[color:var(--color-fg-default)]">
                        {service.name}
                      </h3>
                      <p className="text-sm text-[color:var(--color-fg-muted)]">
                        {service.durationMinutes} min • {formatCurrencyBRL(service.priceCents)}
                      </p>
                    </div>
                  </div>

                  {service.description ? (
                    <p className="text-sm leading-7 text-[color:var(--color-fg-muted)]">
                      {service.description}
                    </p>
                  ) : null}

                  {service.variants.length ? (
                    <div className="flex flex-wrap gap-2">
                      {service.variants.map((variant) => (
                        <span
                          key={variant.id}
                          className="rounded-full border border-[color:var(--color-border-default)] px-3 py-2 text-xs font-semibold text-[color:var(--color-fg-muted)]"
                        >
                          {variant.name}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>

                <span
                  className={[
                    "inline-flex h-fit rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em]",
                    service.isActive
                      ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
                      : "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
                  ].join(" ")}
                >
                  {service.isActive ? "Ativo" : "Pausado"}
                </span>
              </div>

              <form action={toggleServiceStatusAction} className="mt-5">
                <input type="hidden" name="serviceId" value={service.id} />
                <button className="rounded-full border border-[color:var(--color-border-default)] px-4 py-2.5 text-sm font-semibold text-[color:var(--color-fg-default)] transition hover:bg-[color:var(--color-surface-muted)]">
                  {service.isActive ? "Desativar serviço" : "Reativar serviço"}
                </button>
              </form>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
