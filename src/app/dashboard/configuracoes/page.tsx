import { redirect } from "next/navigation";
import { Input } from "@/components/ui/input";
import { prisma } from "@/lib/prisma";
import { saveBusinessSettingsAction } from "@/server/actions/dashboard";
import { getCurrentMembership } from "@/server/services/me";

export default async function ConfiguracoesPage() {
  const membership = await getCurrentMembership();

  if (!membership) {
    redirect("/login");
  }

  const business = await prisma.business.findUnique({
    where: { id: membership.businessId },
    select: {
      name: true,
      slug: true,
      bookingTitle: true,
      description: true,
      phone: true,
      logoUrl: true,
      coverImageUrl: true,
      cancellationPolicyText: true,
      minimumLeadTimeMinutes: true,
      cancellationNoticeMinutes: true,
      brandPrimaryColor: true,
      brandSecondaryColor: true,
    },
  });

  if (!business) {
    redirect("/dashboard");
  }

  const publicUrl = `${process.env.APP_URL ?? "http://localhost:3000"}/${business.slug}`;

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[color:var(--color-fg-muted)]">
          Configurações
        </p>
        <h1 className="text-4xl font-semibold text-[color:var(--color-fg-default)]">
          Marca, políticas e página pública
        </h1>
        <p className="max-w-3xl text-sm leading-7 text-[color:var(--color-fg-muted)]">
          Ajuste o que aparece para o cliente final, incluindo logo, foto de capa, cores e regras
          de cancelamento.
        </p>
      </header>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <form
          action={saveBusinessSettingsAction}
          className="space-y-6 rounded-[28px] border border-[color:var(--color-border-default)] bg-white p-6"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-[color:var(--color-fg-default)]" htmlFor="bookingTitle">
                Título da página pública
              </label>
              <Input
                id="bookingTitle"
                name="bookingTitle"
                defaultValue={business.bookingTitle ?? business.name}
                placeholder="Ex.: Agende seu horário com Studio Aurora"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-[color:var(--color-fg-default)]" htmlFor="description">
                Descrição
              </label>
              <textarea
                id="description"
                name="description"
                defaultValue={business.description ?? ""}
                placeholder="Explique seu atendimento, especialidades e diferenciais."
                className="min-h-[140px] w-full rounded-2xl border border-[color:var(--color-border-default)] px-4 py-3 text-sm text-[color:var(--color-fg-default)] placeholder:text-[color:var(--color-fg-muted)] focus:border-[color:var(--color-brand-500)] focus:outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[color:var(--color-fg-default)]" htmlFor="phone">
                Telefone principal
              </label>
              <Input
                id="phone"
                name="phone"
                defaultValue={business.phone ?? ""}
                placeholder="(11) 99999-0000"
              />
            </div>
            <div className="space-y-2">
              <label
                className="text-sm font-medium text-[color:var(--color-fg-default)]"
                htmlFor="minimumLeadTimeMinutes"
              >
                Antecedência mínima para agendar
              </label>
              <Input
                id="minimumLeadTimeMinutes"
                name="minimumLeadTimeMinutes"
                type="number"
                min="0"
                step="15"
                defaultValue={business.minimumLeadTimeMinutes}
              />
            </div>
            <div className="space-y-2">
              <label
                className="text-sm font-medium text-[color:var(--color-fg-default)]"
                htmlFor="cancellationNoticeMinutes"
              >
                Antecedência mínima para cancelar
              </label>
              <Input
                id="cancellationNoticeMinutes"
                name="cancellationNoticeMinutes"
                type="number"
                min="0"
                step="15"
                defaultValue={business.cancellationNoticeMinutes}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[color:var(--color-fg-default)]" htmlFor="brandPrimaryColor">
                Cor principal
              </label>
              <Input
                id="brandPrimaryColor"
                name="brandPrimaryColor"
                type="text"
                defaultValue={business.brandPrimaryColor ?? "#1664E8"}
              />
            </div>
            <div className="space-y-2">
              <label
                className="text-sm font-medium text-[color:var(--color-fg-default)]"
                htmlFor="brandSecondaryColor"
              >
                Cor secundária
              </label>
              <Input
                id="brandSecondaryColor"
                name="brandSecondaryColor"
                type="text"
                defaultValue={business.brandSecondaryColor ?? "#1254C7"}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-[color:var(--color-fg-default)]" htmlFor="logoUrl">
                URL da logo
              </label>
              <Input
                id="logoUrl"
                name="logoUrl"
                type="url"
                defaultValue={business.logoUrl ?? ""}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-[color:var(--color-fg-default)]" htmlFor="coverImageUrl">
                URL da foto de capa
              </label>
              <Input
                id="coverImageUrl"
                name="coverImageUrl"
                type="url"
                defaultValue={business.coverImageUrl ?? ""}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label
                className="text-sm font-medium text-[color:var(--color-fg-default)]"
                htmlFor="cancellationPolicyText"
              >
                Política de cancelamento
              </label>
              <textarea
                id="cancellationPolicyText"
                name="cancellationPolicyText"
                defaultValue={business.cancellationPolicyText ?? ""}
                placeholder="Ex.: cancelamentos com menos de 2 horas de antecedência não são aceitos."
                className="min-h-[120px] w-full rounded-2xl border border-[color:var(--color-border-default)] px-4 py-3 text-sm text-[color:var(--color-fg-default)] placeholder:text-[color:var(--color-fg-muted)] focus:border-[color:var(--color-brand-500)] focus:outline-none"
              />
            </div>
          </div>

          <button className="rounded-full bg-[color:var(--color-brand-500)] px-5 py-3 text-sm font-semibold text-white">
            Salvar configurações
          </button>
        </form>

        <aside className="space-y-4">
          <div className="rounded-[28px] border border-[color:var(--color-border-default)] bg-white p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[color:var(--color-fg-muted)]">
              Preview rápido
            </p>
            <div className="mt-4 overflow-hidden rounded-[24px] border border-[color:var(--color-border-default)]">
              <div
                className="h-32 bg-cover bg-center"
                style={{
                  backgroundColor: business.brandPrimaryColor ?? "#1664E8",
                  backgroundImage: business.coverImageUrl ? `url(${business.coverImageUrl})` : undefined,
                }}
              />
              <div className="space-y-3 p-5">
                <div className="flex items-center gap-3">
                  {business.logoUrl ? (
                    <img
                      src={business.logoUrl}
                      alt={`Logo de ${business.name}`}
                      className="h-14 w-14 rounded-2xl object-cover"
                    />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-lg font-semibold text-slate-700">
                      {business.name.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-lg font-semibold text-[color:var(--color-fg-default)]">
                      {business.bookingTitle ?? business.name}
                    </p>
                    <p className="text-sm text-[color:var(--color-fg-muted)]">
                      {business.description || "Sua página pública vai refletir essas informações."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-[color:var(--color-border-default)] bg-slate-50 p-6">
            <p className="text-sm font-medium text-[color:var(--color-fg-default)]">
              URL pública ativa
            </p>
            <p className="mt-2 break-all text-sm text-[color:var(--color-fg-muted)]">{publicUrl}</p>
          </div>
        </aside>
      </section>
    </div>
  );
}
