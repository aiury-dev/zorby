import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowUpRight,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  Gauge,
  Rocket,
  Share2,
} from "lucide-react";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
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
    <OnboardingShell
      currentStep={5}
      accent="success"
      title="Seu negócio está pronto para começar a receber agendamentos"
      description="O setup inicial foi concluído. Sua página pública já pode ser compartilhada e o painel está pronto para acompanhar reservas, horários e próximos ajustes."
      sidebarTitle="Agora começa a fase de uso real"
      sidebarDescription="A partir daqui, o foco deixa de ser configuração e passa a ser divulgação, teste com clientes reais e refinamento da operação."
      sidebarContent={
        <div className="space-y-4 text-sm">
          <div>
            <p className="font-semibold text-white">Resultado final</p>
            <p className="mt-1 leading-6 text-white/65">
              Página publicada, agenda ativa e estrutura pronta para validar seus primeiros
              agendamentos.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-white/80">
            Link ativo: <span className="break-all font-semibold text-white">{publicUrl}</span>
          </div>
        </div>
      }
      headerContent={
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
              Publicado
            </p>
            <p className="mt-2 text-sm text-[color:var(--color-fg-default)]">
              Sua página já pode receber visitas e reservas.
            </p>
          </div>
          <div className="rounded-2xl border border-[color:var(--color-border-default)] bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-fg-muted)]">
              Painel pronto
            </p>
            <p className="mt-2 text-sm text-[color:var(--color-fg-default)]">
              Serviços, agenda e disponibilidade já estão configurados.
            </p>
          </div>
          <div className="rounded-2xl border border-[color:var(--color-border-default)] bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-fg-muted)]">
              Próximo foco
            </p>
            <p className="mt-2 text-sm text-[color:var(--color-fg-default)]">
              Divulgar o link e testar um agendamento completo.
            </p>
          </div>
        </div>
      }
    >
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1.2fr)_360px]">
        <div className="space-y-6">
          <section className="overflow-hidden rounded-[34px] border border-emerald-100 bg-[linear-gradient(135deg,#052e16_0%,#0f5132_38%,#059669_100%)] p-6 text-white shadow-[0_24px_60px_rgba(5,46,22,0.22)] md:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-white/85">
                <CheckCircle2 className="size-4" />
                Setup concluído com sucesso
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-100">
                <BadgeCheck className="size-4" />
                Página ativa
              </div>
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_240px]">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/60">
                  Link publicado
                </p>
                <p className="mt-4 break-all text-2xl font-semibold leading-tight md:text-[2rem]">
                  {publicUrl}
                </p>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-white/78">
                  Esse é o endereço que você pode colocar na bio do Instagram, no WhatsApp, no
                  Google Business Profile e em qualquer canal onde queira captar reservas online.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href="/dashboard"
                    className="inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-emerald-950 transition hover:scale-[1.01] hover:bg-emerald-50"
                  >
                    Ir para o dashboard
                    <ArrowUpRight className="size-4" />
                  </Link>
                  <Link
                    href={`/${membership.business.slug}`}
                    className="inline-flex h-12 items-center rounded-full border border-white/15 bg-white/10 px-6 text-sm font-semibold text-white transition hover:bg-white/15"
                  >
                    Abrir página pública
                  </Link>
                </div>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-white/10 p-5 backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/55">
                  Pronto para usar
                </p>
                <div className="mt-4 space-y-3">
                  <div className="rounded-2xl bg-white/10 px-4 py-4">
                    <p className="text-sm font-semibold text-white">Status</p>
                    <p className="mt-1 text-sm text-white/70">Publicado e operando</p>
                  </div>
                  <div className="rounded-2xl bg-white/10 px-4 py-4">
                    <p className="text-sm font-semibold text-white">Slug</p>
                    <p className="mt-1 text-sm text-white/70">{membership.business.slug}</p>
                  </div>
                  <div className="rounded-2xl bg-white/10 px-4 py-4">
                    <p className="text-sm font-semibold text-white">Próxima ação</p>
                    <p className="mt-1 text-sm text-white/70">Divulgar e validar com clientes</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-3">
            <article className="rounded-[30px] border border-[color:var(--color-border-default)] bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                <Share2 className="size-5" />
              </div>
              <h2 className="mt-4 text-base font-semibold text-[color:var(--color-fg-default)]">
                Compartilhe seu link
              </h2>
              <p className="mt-2 text-sm leading-7 text-[color:var(--color-fg-muted)]">
                Coloque o endereço na bio, no WhatsApp e nas mensagens automáticas.
              </p>
            </article>

            <article className="rounded-[30px] border border-[color:var(--color-border-default)] bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
                <CalendarDays className="size-5" />
              </div>
              <h2 className="mt-4 text-base font-semibold text-[color:var(--color-fg-default)]">
                Faça um teste real
              </h2>
              <p className="mt-2 text-sm leading-7 text-[color:var(--color-fg-muted)]">
                Simule uma reserva do início ao fim para validar a experiência do cliente.
              </p>
            </article>

            <article className="rounded-[30px] border border-[color:var(--color-border-default)] bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
                <Gauge className="size-5" />
              </div>
              <h2 className="mt-4 text-base font-semibold text-[color:var(--color-fg-default)]">
                Refine com dados reais
              </h2>
              <p className="mt-2 text-sm leading-7 text-[color:var(--color-fg-muted)]">
                Ajuste horários, textos e serviços depois de observar os primeiros agendamentos.
              </p>
            </article>
          </section>
        </div>

        <aside className="rounded-[34px] border border-[color:var(--color-border-default)] bg-[linear-gradient(180deg,#f8fbff_0%,#eef5ff_100%)] p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-fg-muted)]">
            Próxima missão
          </p>

          <div className="mt-5 rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_14px_30px_rgba(15,23,42,0.06)]">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                <Rocket className="size-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[color:var(--color-fg-default)]">
                  Saída do onboarding
                </p>
                <p className="mt-1 text-sm text-[color:var(--color-fg-muted)]">
                  Agora o foco é ativação de uso.
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <div className="rounded-2xl border border-[color:var(--color-border-default)] px-4 py-4">
                <p className="text-sm font-semibold text-[color:var(--color-fg-default)]">
                  1. Compartilhar o link
                </p>
                <p className="mt-1 text-sm text-[color:var(--color-fg-muted)]">
                  Coloque o endereço nos seus canais principais.
                </p>
              </div>
              <div className="rounded-2xl border border-[color:var(--color-border-default)] px-4 py-4">
                <p className="text-sm font-semibold text-[color:var(--color-fg-default)]">
                  2. Fazer um agendamento teste
                </p>
                <p className="mt-1 text-sm text-[color:var(--color-fg-muted)]">
                  Confirme se a experiência está fluida do começo ao fim.
                </p>
              </div>
              <div className="rounded-2xl border border-[color:var(--color-border-default)] px-4 py-4">
                <p className="text-sm font-semibold text-[color:var(--color-fg-default)]">
                  3. Ajustar o que for necessário
                </p>
                <p className="mt-1 text-sm text-[color:var(--color-fg-muted)]">
                  Refine disponibilidade, catálogo e branding com calma.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </OnboardingShell>
  );
}
