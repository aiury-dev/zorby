import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentMembership } from "@/server/services/me";
import { getOnboardingStepPath } from "@/server/services/onboarding";

export default async function OnboardingCompletedPage() {
  const membership = await getCurrentMembership();

  if (!membership) {
    redirect("/login");
  }

  if (membership.business.onboardingStep !== "COMPLETED") {
    redirect(getOnboardingStepPath(membership.business.onboardingStep));
  }

  const publicUrl = `${process.env.APP_URL ?? "http://localhost:3000"}/${membership.business.slug}`;

  return (
    <main className="flex-1 bg-[linear-gradient(180deg,#f8fafc_0%,#eef4ff_100%)] px-4 py-10 md:px-6">
      <div className="mx-auto max-w-3xl space-y-6 rounded-[32px] border border-[color:var(--color-border-default)] bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.06),0_24px_60px_rgba(15,23,42,0.08)] md:p-10">
        <div className="space-y-3">
          <span className="inline-flex rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
            Etapa 5 de 5
          </span>
          <h1 className="text-3xl font-semibold text-[color:var(--color-fg-default)]">
            Seu negocio ja esta pronto para receber agendamentos.
          </h1>
          <p className="text-sm leading-7 text-[color:var(--color-fg-muted)]">
            O onboarding foi concluido e sua pagina publica esta ativa. Agora voce pode compartilhar o link e acompanhar tudo pelo painel.
          </p>
        </div>

        <div className="rounded-[28px] border border-[color:var(--color-border-default)] bg-slate-50 p-5">
          <p className="text-sm font-medium text-[color:var(--color-fg-muted)]">Link publicado</p>
          <p className="mt-3 text-lg font-semibold text-[color:var(--color-fg-default)]">{publicUrl}</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/dashboard"
            className="inline-flex h-11 items-center rounded-full bg-[color:var(--color-brand-500)] px-5 text-sm font-semibold text-white"
          >
            Ir para o dashboard
          </Link>
          <Link
            href={`/${membership.business.slug}`}
            className="inline-flex h-11 items-center rounded-full border border-[color:var(--color-border-default)] px-5 text-sm font-semibold text-[color:var(--color-fg-default)]"
          >
            Abrir pagina publica
          </Link>
        </div>
      </div>
    </main>
  );
}
