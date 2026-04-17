import { redirect } from "next/navigation";
import { Globe, ImageIcon, MapPin, Palette, ShieldCheck } from "lucide-react";
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
      addressLine1: true,
      addressLine2: true,
      neighborhood: true,
      city: true,
      state: true,
      postalCode: true,
      country: true,
      latitude: true,
      longitude: true,
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
      <header className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--color-border-default)] bg-[color:var(--color-surface-muted)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.26em] text-[color:var(--color-fg-muted)]">
            <Palette className="size-3.5 text-[color:var(--color-brand-500)]" />
            Configurações
          </div>
          <h1 className="text-4xl font-semibold leading-tight text-[color:var(--color-fg-default)]">
            Marca, políticas e experiência pública com acabamento profissional.
          </h1>
          <p className="text-sm leading-7 text-[color:var(--color-fg-muted)] md:text-base">
            Ajuste o que o cliente vê, personalize cores, refine o posicionamento da página,
            complete o endereço do negócio e defina as regras de cancelamento.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[430px]">
          <article className="rounded-[26px] border border-[color:var(--color-border-default)] bg-white p-4 shadow-[0_14px_36px_rgba(15,23,42,0.04)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--color-fg-muted)]">
              Descoberta local
            </p>
            <p className="mt-3 text-lg font-semibold text-[color:var(--color-fg-default)]">
              {business.latitude && business.longitude ? "Pronta" : "Complete o endereço"}
            </p>
          </article>
          <article className="rounded-[26px] border border-[color:var(--color-border-default)] bg-white p-4 shadow-[0_14px_36px_rgba(15,23,42,0.04)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--color-fg-muted)]">
              Cor principal
            </p>
            <div className="mt-3 flex items-center gap-3">
              <span
                className="block size-5 rounded-full ring-4 ring-[color:var(--color-surface-muted)]"
                style={{ backgroundColor: business.brandPrimaryColor ?? "#1664E8" }}
              />
              <p className="text-sm font-semibold text-[color:var(--color-fg-default)]">
                {business.brandPrimaryColor ?? "#1664E8"}
              </p>
            </div>
          </article>
          <article className="rounded-[26px] border border-[color:var(--color-border-default)] bg-white p-4 shadow-[0_14px_36px_rgba(15,23,42,0.04)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--color-fg-muted)]">
              Lead time
            </p>
            <p className="mt-3 text-lg font-semibold text-[color:var(--color-fg-default)]">
              {business.minimumLeadTimeMinutes} min
            </p>
          </article>
        </div>
      </header>

      <section className="grid gap-6 xl:grid-cols-[1.18fr_0.82fr]">
        <form
          action={saveBusinessSettingsAction}
          className="space-y-6 rounded-[32px] border border-[color:var(--color-border-default)] bg-white p-6 shadow-[0_20px_50px_rgba(15,23,42,0.05)] md:p-7"
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
                className="min-h-[140px] w-full rounded-2xl border border-[color:var(--color-border-default)] px-4 py-3 text-sm text-[color:var(--color-fg-default)] placeholder:text-[color:var(--color-fg-muted)] outline-none transition focus:border-[color:var(--color-brand-500)]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[color:var(--color-fg-default)]" htmlFor="phone">
                Telefone principal
              </label>
              <Input id="phone" name="phone" defaultValue={business.phone ?? ""} placeholder="(11) 99999-0000" />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-[color:var(--color-fg-default)]" htmlFor="addressLine1">
                Endereço principal
              </label>
              <Input
                id="addressLine1"
                name="addressLine1"
                defaultValue={business.addressLine1 ?? ""}
                placeholder="Rua, avenida e número"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[color:var(--color-fg-default)]" htmlFor="addressLine2">
                Complemento
              </label>
              <Input
                id="addressLine2"
                name="addressLine2"
                defaultValue={business.addressLine2 ?? ""}
                placeholder="Sala, andar, bloco"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[color:var(--color-fg-default)]" htmlFor="neighborhood">
                Bairro
              </label>
              <Input
                id="neighborhood"
                name="neighborhood"
                defaultValue={business.neighborhood ?? ""}
                placeholder="Ex.: Jardins"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[color:var(--color-fg-default)]" htmlFor="city">
                Cidade
              </label>
              <Input
                id="city"
                name="city"
                defaultValue={business.city ?? ""}
                placeholder="Ex.: São Paulo"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[color:var(--color-fg-default)]" htmlFor="state">
                Estado
              </label>
              <Input
                id="state"
                name="state"
                defaultValue={business.state ?? ""}
                placeholder="Ex.: SP"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[color:var(--color-fg-default)]" htmlFor="postalCode">
                CEP
              </label>
              <Input
                id="postalCode"
                name="postalCode"
                defaultValue={business.postalCode ?? ""}
                placeholder="00000-000"
                required
              />
            </div>

            <input name="country" type="hidden" value={business.country ?? "BR"} />

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
                className="min-h-[120px] w-full rounded-2xl border border-[color:var(--color-border-default)] px-4 py-3 text-sm text-[color:var(--color-fg-default)] placeholder:text-[color:var(--color-fg-muted)] outline-none transition focus:border-[color:var(--color-brand-500)]"
              />
            </div>
          </div>

          <button className="inline-flex h-12 items-center justify-center rounded-2xl bg-[color:var(--color-brand-500)] px-6 text-sm font-semibold text-white shadow-[0_16px_32px_rgba(37,99,235,0.18)] transition hover:bg-[color:var(--color-brand-600)]">
            Salvar configurações
          </button>
        </form>

        <aside className="space-y-4">
          <article className="overflow-hidden rounded-[30px] border border-[color:var(--color-border-default)] bg-white shadow-[0_20px_50px_rgba(15,23,42,0.05)]">
            <div
              className="relative h-40 bg-cover bg-center"
              style={{
                backgroundColor: business.brandPrimaryColor ?? "#1664E8",
                backgroundImage: business.coverImageUrl ? `url(${business.coverImageUrl})` : undefined,
              }}
            >
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.10),rgba(15,23,42,0.56))]" />
              <div className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-white/80 backdrop-blur">
                <ImageIcon className="size-3.5" />
                Preview
              </div>
            </div>
            <div className="space-y-4 p-5">
              <div className="flex items-start gap-4">
                {business.logoUrl ? (
                  <img
                    src={business.logoUrl}
                    alt={`Logo de ${business.name}`}
                    className="h-14 w-14 rounded-[18px] object-cover"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-[color:var(--color-surface-muted)] text-lg font-semibold text-[color:var(--color-brand-500)]">
                    {business.name.slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-lg font-semibold text-[color:var(--color-fg-default)]">
                    {business.bookingTitle ?? business.name}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-[color:var(--color-fg-muted)]">
                    {business.description || "Sua página pública vai refletir essas informações."}
                  </p>
                  <p className="mt-3 text-sm font-medium text-[color:var(--color-fg-default)]">
                    {[business.addressLine1, business.neighborhood, business.city, business.state]
                      .filter(Boolean)
                      .join(", ") || "Defina o endereço para aparecer na busca por proximidade."}
                  </p>
                </div>
              </div>
            </div>
          </article>

          <article className="rounded-[28px] border border-[color:var(--color-border-default)] bg-white p-5">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-[color:var(--color-surface-muted)] p-2.5 text-[color:var(--color-brand-500)]">
                <Globe className="size-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[color:var(--color-fg-default)]">URL pública ativa</p>
                <p className="mt-2 break-all text-sm text-[color:var(--color-fg-muted)]">{publicUrl}</p>
              </div>
            </div>
          </article>

          <article className="rounded-[28px] border border-[color:var(--color-border-default)] bg-white p-5">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-[color:var(--color-surface-muted)] p-2.5 text-[color:var(--color-brand-500)]">
                <MapPin className="size-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[color:var(--color-fg-default)]">Busca por proximidade</p>
                <p className="mt-2 text-sm leading-7 text-[color:var(--color-fg-muted)]">
                  {business.latitude && business.longitude
                    ? "Seu negócio já pode aparecer primeiro para clientes próximos no fluxo /agendar."
                    : "Complete o endereço para habilitar o posicionamento por distância no app de agendamento."}
                </p>
              </div>
            </div>
          </article>

          <article className="rounded-[28px] border border-[color:var(--color-border-default)] bg-[linear-gradient(180deg,#0f172a_0%,#172554_100%)] p-5 text-white">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/10 p-2.5">
                <ShieldCheck className="size-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">Regras claras geram menos atrito</p>
                <p className="mt-2 text-sm leading-7 text-white/72">
                  Antecedência mínima, política de cancelamento, apresentação do negócio e um
                  endereço correto melhoram a confiança antes do clique final.
                </p>
              </div>
            </div>
          </article>
        </aside>
      </section>
    </div>
  );
}
