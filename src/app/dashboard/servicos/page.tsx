import { redirect } from "next/navigation";
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

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[color:var(--color-fg-muted)]">
          Serviços
        </p>
        <h1 className="text-4xl font-semibold text-[color:var(--color-fg-default)]">
          Catálogo do negócio
        </h1>
      </header>

      <section className="rounded-[28px] border border-[color:var(--color-border-default)] bg-white p-6">
        <h2 className="text-xl font-semibold text-[color:var(--color-fg-default)]">Novo serviço</h2>
        <form action={createServiceAction} className="mt-5 grid gap-4 md:grid-cols-2">
          <input
            name="name"
            placeholder="Nome do serviço"
            className="h-11 rounded-2xl border border-[color:var(--color-border-default)] px-4"
            required
          />
          <input
            name="durationMinutes"
            type="number"
            min="5"
            step="5"
            placeholder="Duração (min)"
            className="h-11 rounded-2xl border border-[color:var(--color-border-default)] px-4"
            required
          />
          <input
            name="price"
            type="number"
            min="0"
            step="0.01"
            placeholder="Preço em reais"
            className="h-11 rounded-2xl border border-[color:var(--color-border-default)] px-4"
            required
          />
          <input
            name="colorHex"
            type="text"
            placeholder="#1664E8"
            className="h-11 rounded-2xl border border-[color:var(--color-border-default)] px-4"
            defaultValue="#1664E8"
          />
          <textarea
            name="description"
            placeholder="Descrição curta"
            className="min-h-[120px] rounded-2xl border border-[color:var(--color-border-default)] px-4 py-3 md:col-span-2"
          />
          <button className="h-11 rounded-full bg-[color:var(--color-brand-500)] px-5 text-sm font-semibold text-white md:w-fit">
            Salvar serviço
          </button>
        </form>
      </section>

      <section className="grid gap-4">
        {services.map((service) => (
          <article
            key={service.id}
            className="rounded-[28px] border border-[color:var(--color-border-default)] bg-white p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-[color:var(--color-fg-default)]">
                  {service.name}
                </h2>
                <p className="mt-1 text-sm text-[color:var(--color-fg-muted)]">
                  {service.durationMinutes} min · {formatCurrencyBRL(service.priceCents)}
                </p>
              </div>
              <span className="rounded-full bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-fg-muted)]">
                {service.isActive ? "Ativo" : "Pausado"}
              </span>
            </div>
            {service.description ? (
              <p className="mt-3 text-sm leading-6 text-[color:var(--color-fg-muted)]">
                {service.description}
              </p>
            ) : null}
            {service.variants.length ? (
              <div className="mt-4 flex flex-wrap gap-2">
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
            <form action={toggleServiceStatusAction} className="mt-4">
              <input type="hidden" name="serviceId" value={service.id} />
              <button className="rounded-full border border-[color:var(--color-border-default)] px-4 py-2 text-sm font-semibold text-[color:var(--color-fg-default)]">
                {service.isActive ? "Desativar serviço" : "Reativar serviço"}
              </button>
            </form>
          </article>
        ))}
      </section>
    </div>
  );
}
