import { redirect } from "next/navigation";
import { saveBusinessStep } from "@/server/actions/dashboard";
import { getCurrentMembership } from "@/server/services/me";
import { getOnboardingStepPath } from "@/server/services/onboarding";

const categories = [
  { value: "HEALTH", label: "Saude" },
  { value: "BEAUTY", label: "Beleza" },
  { value: "EDUCATION", label: "Educacao" },
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
    <main className="flex-1 bg-[linear-gradient(180deg,#f8fafc_0%,#eef4ff_100%)] px-4 py-10 md:px-6">
      <div className="mx-auto max-w-3xl space-y-6 rounded-[32px] border border-[color:var(--color-border-default)] bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.06),0_24px_60px_rgba(15,23,42,0.08)] md:p-10">
        <div className="space-y-3">
          <span className="inline-flex rounded-full border border-[color:var(--color-border-default)] bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-fg-muted)]">
            Etapa 1 de 5
          </span>
          <h1 className="text-3xl font-semibold text-[color:var(--color-fg-default)]">Dados do negocio</h1>
          <p className="text-sm leading-7 text-[color:var(--color-fg-muted)]">
            Vamos configurar a base do seu perfil publico e do painel.
          </p>
        </div>

        <form action={saveBusinessStep} className="grid gap-4">
          <input
            name="name"
            defaultValue={membership.business.name}
            placeholder="Nome do negocio"
            className="h-11 rounded-2xl border border-[color:var(--color-border-default)] px-4"
            required
          />
          <select
            name="category"
            defaultValue={membership.business.category}
            className="h-11 rounded-2xl border border-[color:var(--color-border-default)] px-4"
          >
            {categories.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
          <input
            name="city"
            defaultValue={membership.business.city ?? ""}
            placeholder="Cidade"
            className="h-11 rounded-2xl border border-[color:var(--color-border-default)] px-4"
          />
          <input
            name="phone"
            defaultValue={membership.business.phone ?? ""}
            placeholder="Telefone"
            className="h-11 rounded-2xl border border-[color:var(--color-border-default)] px-4"
          />
          <input
            name="timezone"
            defaultValue={membership.business.timezone}
            placeholder="America/Sao_Paulo"
            className="h-11 rounded-2xl border border-[color:var(--color-border-default)] px-4"
          />
          <textarea
            name="description"
            defaultValue={membership.business.description ?? ""}
            placeholder="Descreva rapidamente seu negocio"
            className="min-h-[140px] rounded-2xl border border-[color:var(--color-border-default)] px-4 py-3"
          />
          <button className="h-11 rounded-full bg-[color:var(--color-brand-500)] px-5 text-sm font-semibold text-white md:w-fit">
            Continuar
          </button>
        </form>
      </div>
    </main>
  );
}
