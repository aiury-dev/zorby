import { redirect } from "next/navigation";
import { MapPin, ShieldCheck } from "lucide-react";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { saveBusinessStep } from "@/server/actions/dashboard";
import { getCurrentMembership } from "@/server/services/me";
import { getOnboardingStepPath } from "@/server/services/onboarding";

const categories = [
  { value: "HEALTH", label: "Saúde" },
  { value: "BEAUTY", label: "Beleza" },
  { value: "EDUCATION", label: "Educação" },
  { value: "CONSULTING", label: "Consultoria" },
  { value: "SPORTS", label: "Esportes" },
  { value: "OTHER", label: "Outros" },
];

export default async function OnboardingBusinessPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const membership = await getCurrentMembership();
  const params = (await searchParams) ?? {};
  const error = typeof params.error === "string" ? params.error : null;

  if (!membership) {
    redirect("/login");
  }

  if (membership.business.onboardingStep !== "BUSINESS") {
    redirect(getOnboardingStepPath(membership.business.onboardingStep));
  }

  return (
    <OnboardingShell
      currentStep={1}
      title="Comece pela identidade e localização do negócio"
      description="Vamos estruturar a base da sua presença online com os dados que o cliente final precisa ver para confiar, encontrar você e reservar."
      sidebarTitle="Seu negócio precisa parecer real, local e pronto para receber"
      sidebarDescription="Além do nome e da categoria, o endereço completo alimenta a descoberta por proximidade no app de agendamento e reforça a confiança na página pública."
      sidebarContent={
        <div className="space-y-4 text-sm">
          <div>
            <p className="font-semibold text-white">O que essa etapa destrava</p>
            <p className="mt-1 leading-6 text-white/65">
              Seu perfil público, a busca “perto de mim”, os detalhes do negócio e a base para o
              agendamento estilo app.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-white/80">
            Slug reservado: <span className="font-semibold text-white">{membership.business.slug}</span>
          </div>

          <div className="rounded-2xl border border-emerald-300/15 bg-emerald-400/10 px-4 py-3 text-white/78">
            Endereço completo = negócio elegível para aparecer por proximidade.
          </div>
        </div>
      }
      headerContent={
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-[color:var(--color-border-default)] bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-fg-muted)]">
              Página pública
            </p>
            <p className="mt-2 text-sm text-[color:var(--color-fg-default)]">
              Nome, categoria e endereço aparecem no primeiro contato.
            </p>
          </div>
          <div className="rounded-2xl border border-[color:var(--color-border-default)] bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-fg-muted)]">
              Busca local
            </p>
            <p className="mt-2 text-sm text-[color:var(--color-fg-default)]">
              O cliente consegue encontrar negócios próximos com mais facilidade.
            </p>
          </div>
          <div className="rounded-2xl border border-[color:var(--color-border-default)] bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-fg-muted)]">
              Base do setup
            </p>
            <p className="mt-2 text-sm text-[color:var(--color-fg-default)]">
              As próximas etapas ficam mais rápidas quando essa base está completa.
            </p>
          </div>
        </div>
      }
    >
      <form action={saveBusinessStep} className="grid gap-8">
        {error ? (
          <div className="rounded-[24px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-semibold text-[color:var(--color-fg-default)]">Nome do negócio</span>
            <input
              name="name"
              defaultValue={membership.business.name}
              placeholder="Ex.: Studio Aurora"
              className="h-12 w-full rounded-2xl border border-[color:var(--color-border-default)] bg-white px-4 text-sm text-[color:var(--color-fg-default)] outline-none transition focus:border-[color:var(--color-brand-500)] focus:ring-4 focus:ring-blue-100"
              required
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-[color:var(--color-fg-default)]">Categoria principal</span>
            <select
              name="category"
              defaultValue={membership.business.category}
              className="h-12 w-full rounded-2xl border border-[color:var(--color-border-default)] bg-white px-4 text-sm text-[color:var(--color-fg-default)] outline-none transition focus:border-[color:var(--color-brand-500)] focus:ring-4 focus:ring-blue-100"
            >
              {categories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2 lg:col-span-2">
            <span className="text-sm font-semibold text-[color:var(--color-fg-default)]">Endereço principal</span>
            <input
              name="addressLine1"
              defaultValue={membership.business.addressLine1 ?? ""}
              placeholder="Rua, avenida e número"
              className="h-12 w-full rounded-2xl border border-[color:var(--color-border-default)] bg-white px-4 text-sm text-[color:var(--color-fg-default)] outline-none transition focus:border-[color:var(--color-brand-500)] focus:ring-4 focus:ring-blue-100"
              required
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-[color:var(--color-fg-default)]">Complemento</span>
            <input
              name="addressLine2"
              defaultValue={membership.business.addressLine2 ?? ""}
              placeholder="Sala, andar, bloco (opcional)"
              className="h-12 w-full rounded-2xl border border-[color:var(--color-border-default)] bg-white px-4 text-sm text-[color:var(--color-fg-default)] outline-none transition focus:border-[color:var(--color-brand-500)] focus:ring-4 focus:ring-blue-100"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-[color:var(--color-fg-default)]">Bairro</span>
            <input
              name="neighborhood"
              defaultValue={membership.business.neighborhood ?? ""}
              placeholder="Ex.: Jardins"
              className="h-12 w-full rounded-2xl border border-[color:var(--color-border-default)] bg-white px-4 text-sm text-[color:var(--color-fg-default)] outline-none transition focus:border-[color:var(--color-brand-500)] focus:ring-4 focus:ring-blue-100"
              required
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-[color:var(--color-fg-default)]">Cidade</span>
            <input
              name="city"
              defaultValue={membership.business.city ?? ""}
              placeholder="Ex.: São Paulo"
              className="h-12 w-full rounded-2xl border border-[color:var(--color-border-default)] bg-white px-4 text-sm text-[color:var(--color-fg-default)] outline-none transition focus:border-[color:var(--color-brand-500)] focus:ring-4 focus:ring-blue-100"
              required
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-[color:var(--color-fg-default)]">Estado</span>
            <input
              name="state"
              defaultValue={membership.business.state ?? ""}
              placeholder="Ex.: SP"
              className="h-12 w-full rounded-2xl border border-[color:var(--color-border-default)] bg-white px-4 text-sm uppercase text-[color:var(--color-fg-default)] outline-none transition focus:border-[color:var(--color-brand-500)] focus:ring-4 focus:ring-blue-100"
              required
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-[color:var(--color-fg-default)]">CEP</span>
            <input
              name="postalCode"
              defaultValue={membership.business.postalCode ?? ""}
              placeholder="00000-000"
              className="h-12 w-full rounded-2xl border border-[color:var(--color-border-default)] bg-white px-4 text-sm text-[color:var(--color-fg-default)] outline-none transition focus:border-[color:var(--color-brand-500)] focus:ring-4 focus:ring-blue-100"
              required
            />
          </label>

          <input name="country" type="hidden" value={membership.business.country ?? "BR"} />

          <label className="space-y-2">
            <span className="text-sm font-semibold text-[color:var(--color-fg-default)]">Telefone</span>
            <input
              name="phone"
              defaultValue={membership.business.phone ?? ""}
              placeholder="(11) 99999-0000"
              className="h-12 w-full rounded-2xl border border-[color:var(--color-border-default)] bg-white px-4 text-sm text-[color:var(--color-fg-default)] outline-none transition focus:border-[color:var(--color-brand-500)] focus:ring-4 focus:ring-blue-100"
            />
          </label>

          <label className="space-y-2 lg:col-span-2">
            <span className="text-sm font-semibold text-[color:var(--color-fg-default)]">Fuso horário</span>
            <input
              name="timezone"
              defaultValue={membership.business.timezone}
              placeholder="America/Sao_Paulo"
              className="h-12 w-full rounded-2xl border border-[color:var(--color-border-default)] bg-white px-4 text-sm text-[color:var(--color-fg-default)] outline-none transition focus:border-[color:var(--color-brand-500)] focus:ring-4 focus:ring-blue-100"
            />
          </label>
        </div>

        <label className="space-y-2">
          <span className="text-sm font-semibold text-[color:var(--color-fg-default)]">Descrição curta</span>
          <textarea
            name="description"
            defaultValue={membership.business.description ?? ""}
            placeholder="Explique em poucas linhas o que você oferece, quem atende e qual experiência quer transmitir."
            className="min-h-[180px] w-full rounded-[28px] border border-[color:var(--color-border-default)] bg-white px-4 py-4 text-sm leading-7 text-[color:var(--color-fg-default)] outline-none transition focus:border-[color:var(--color-brand-500)] focus:ring-4 focus:ring-blue-100"
          />
        </label>

        <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[28px] border border-[color:var(--color-border-default)] bg-slate-50 px-5 py-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-[color:var(--color-fg-default)]">
              <MapPin className="size-4 text-[color:var(--color-brand-500)]" />
              Esse endereço será usado para descoberta por proximidade
            </p>
            <p className="mt-2 text-sm leading-7 text-[color:var(--color-fg-muted)]">
              O cliente final poderá encontrar seu negócio ao procurar serviços próximos. É isso que
              deixa a experiência mais parecida com um app de reserva real.
            </p>
          </div>

          <div className="rounded-[28px] border border-[color:var(--color-border-default)] bg-[linear-gradient(180deg,#f8fbff_0%,#eef5ff_100%)] px-5 py-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-[color:var(--color-fg-default)]">
              <ShieldCheck className="size-4 text-[color:var(--color-brand-500)]" />
              Base pronta para publicar
            </p>
            <p className="mt-2 text-sm leading-7 text-[color:var(--color-fg-muted)]">
              Nome, categoria, descrição e endereço já deixam o negócio preparado para a página
              pública e para o fluxo de descoberta.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 rounded-[28px] border border-[color:var(--color-border-default)] bg-slate-50 px-5 py-4">
          <p className="max-w-2xl text-sm leading-7 text-[color:var(--color-fg-muted)]">
            Você poderá refinar esses dados depois, mas o endereço completo já entra agora para o
            negócio nascer pronto para ser encontrado.
          </p>
          <button className="inline-flex h-12 items-center rounded-full bg-[color:var(--color-brand-500)] px-6 text-sm font-semibold text-white transition hover:bg-[color:var(--color-brand-600)]">
            Salvar e continuar
          </button>
        </div>
      </form>
    </OnboardingShell>
  );
}
