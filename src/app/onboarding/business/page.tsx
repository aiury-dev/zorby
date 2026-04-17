import { redirect } from "next/navigation";
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

export default async function OnboardingBusinessPage() {
  const membership = await getCurrentMembership();

  if (!membership) {
    redirect("/login");
  }

  if (membership.business.onboardingStep !== "BUSINESS") {
    redirect(getOnboardingStepPath(membership.business.onboardingStep));
  }

  return (
    <OnboardingShell
      currentStep={1}
      title="Comece pela identidade do seu negócio"
      description="Vamos estruturar a base da sua presença online: nome comercial, categoria, contexto de atendimento e informações que reforçam confiança."
      sidebarTitle="Sua marca precisa parecer pronta desde o primeiro acesso"
      sidebarDescription="Esses dados alimentam a página pública, o painel administrativo e a comunicação com os clientes. Quanto mais claro estiver agora, melhor será a percepção do serviço."
      sidebarContent={
        <div className="space-y-4 text-sm">
          <div>
            <p className="font-semibold text-white">Checklist desta etapa</p>
            <p className="mt-1 leading-6 text-white/65">
              Defina um nome comercial forte, selecione a categoria certa e descreva seu negócio em poucas linhas objetivas.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-white/80">
            Slug reservado: <span className="font-semibold text-white">{membership.business.slug}</span>
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
              Nome, categoria e descrição aparecem no primeiro contato.
            </p>
          </div>
          <div className="rounded-2xl border border-[color:var(--color-border-default)] bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-fg-muted)]">
              Clareza comercial
            </p>
            <p className="mt-2 text-sm text-[color:var(--color-fg-default)]">
              Um perfil bem montado transmite organização e profissionalismo.
            </p>
          </div>
          <div className="rounded-2xl border border-[color:var(--color-border-default)] bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-fg-muted)]">
              Base do setup
            </p>
            <p className="mt-2 text-sm text-[color:var(--color-fg-default)]">
              As próximas etapas ficam mais rápidas quando esta base está certa.
            </p>
          </div>
        </div>
      }
    >
      <form action={saveBusinessStep} className="grid gap-8">
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

          <label className="space-y-2">
            <span className="text-sm font-semibold text-[color:var(--color-fg-default)]">Cidade</span>
            <input
              name="city"
              defaultValue={membership.business.city ?? ""}
              placeholder="Ex.: São Paulo"
              className="h-12 w-full rounded-2xl border border-[color:var(--color-border-default)] bg-white px-4 text-sm text-[color:var(--color-fg-default)] outline-none transition focus:border-[color:var(--color-brand-500)] focus:ring-4 focus:ring-blue-100"
            />
          </label>

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

        <div className="flex flex-wrap items-center justify-between gap-4 rounded-[28px] border border-[color:var(--color-border-default)] bg-slate-50 px-5 py-4">
          <p className="max-w-2xl text-sm leading-7 text-[color:var(--color-fg-muted)]">
            Você poderá refinar esses dados depois, mas já vale deixar tudo com cara de negócio pronto para receber clientes.
          </p>
          <button className="inline-flex h-12 items-center rounded-full bg-[color:var(--color-brand-500)] px-6 text-sm font-semibold text-white transition hover:bg-[color:var(--color-brand-600)]">
            Salvar e continuar
          </button>
        </div>
      </form>
    </OnboardingShell>
  );
}
