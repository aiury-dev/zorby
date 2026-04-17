import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowUpRight,
  BadgeCheck,
  CalendarDays,
  Globe2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { publishBookingLinkAction } from "@/server/actions/dashboard";
import { getCurrentMembership } from "@/server/services/me";
import { getOnboardingStepPath } from "@/server/services/onboarding";

export default async function OnboardingLinkPage() {
  const membership = await getCurrentMembership();

  if (!membership) {
    redirect("/login");
  }

  if (!["LINK", "COMPLETED"].includes(membership.business.onboardingStep)) {
    redirect(getOnboardingStepPath(membership.business.onboardingStep));
  }

  const appUrl = process.env.APP_URL ?? "http://localhost:3000";
  const publicUrl = `${appUrl}/${membership.business.slug}`;

  return (
    <OnboardingShell
      currentStep={4}
      title="Sua página pública está pronta para estrear"
      description="Agora é a etapa em que tudo ganha forma de produto real. Seu link já está montado, com catálogo e disponibilidade configurados. Falta só publicar."
      sidebarTitle="Hora de transformar configuração em presença digital"
      sidebarDescription="Depois de publicar, você já pode compartilhar o link em bio, WhatsApp, Instagram, anúncios e qualquer ponto de contato com clientes."
      sidebarContent={
        <div className="space-y-4 text-sm">
          <div>
            <p className="font-semibold text-white">O que acontece ao publicar</p>
            <p className="mt-1 leading-6 text-white/65">
              O link fica ativo, a página começa a aceitar agendamentos e o setup inicial é
              concluído.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-white/80">
            URL final: <span className="break-all font-semibold text-white">{publicUrl}</span>
          </div>
        </div>
      }
      headerContent={
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-[color:var(--color-border-default)] bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-fg-muted)]">
              Link compartilhável
            </p>
            <p className="mt-2 text-sm text-[color:var(--color-fg-default)]">
              Perfeito para bio, mensagem automática e campanhas.
            </p>
          </div>
          <div className="rounded-2xl border border-[color:var(--color-border-default)] bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-fg-muted)]">
              Visual profissional
            </p>
            <p className="mt-2 text-sm text-[color:var(--color-fg-default)]">
              A primeira impressão do cliente já passa organização.
            </p>
          </div>
          <div className="rounded-2xl border border-[color:var(--color-border-default)] bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-fg-muted)]">
              Operação pronta
            </p>
            <p className="mt-2 text-sm text-[color:var(--color-fg-default)]">
              Seu negócio já pode testar reservas reais daqui a pouco.
            </p>
          </div>
        </div>
      }
    >
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1.2fr)_360px]">
        <div className="space-y-6">
          <section className="overflow-hidden rounded-[34px] border border-slate-200 bg-[linear-gradient(145deg,#0f172a_0%,#163d78_48%,#1d72d8_100%)] p-6 text-white shadow-[0_20px_50px_rgba(15,23,42,0.22)] md:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-white/80">
                <Sparkles className="size-4" />
                Pronta para publicação
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-100">
                <BadgeCheck className="size-4" />
                Setup validado
              </div>
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_240px]">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/60">
                  Link público
                </p>
                <p className="mt-4 break-all text-2xl font-semibold leading-tight md:text-[2rem]">
                  {publicUrl}
                </p>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-white/75">
                  Esse é o endereço que você poderá divulgar para receber agendamentos sem depender
                  de conversa manual. Ele já está montado com o slug do seu negócio.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <form action={publishBookingLinkAction}>
                    <button className="inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-slate-950 transition hover:scale-[1.01] hover:bg-slate-100">
                      Publicar minha página
                      <ArrowUpRight className="size-4" />
                    </button>
                  </form>

                  <Link
                    href={`/${membership.business.slug}`}
                    className="inline-flex h-12 items-center rounded-full border border-white/15 bg-white/10 px-6 text-sm font-semibold text-white transition hover:bg-white/15"
                  >
                    Ver prévia da página
                  </Link>
                </div>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-white/10 p-5 backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/55">
                  Status de lançamento
                </p>
                <div className="mt-4 space-y-3">
                  <div className="rounded-2xl bg-white/10 px-4 py-4">
                    <p className="text-sm font-semibold text-white">Slug</p>
                    <p className="mt-1 text-sm text-white/70">{membership.business.slug}</p>
                  </div>
                  <div className="rounded-2xl bg-white/10 px-4 py-4">
                    <p className="text-sm font-semibold text-white">Agenda</p>
                    <p className="mt-1 text-sm text-white/70">Configurada e pronta para reservas</p>
                  </div>
                  <div className="rounded-2xl bg-white/10 px-4 py-4">
                    <p className="text-sm font-semibold text-white">Catálogo</p>
                    <p className="mt-1 text-sm text-white/70">Visível na página pública</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
            <section className="rounded-[30px] border border-[color:var(--color-border-default)] bg-white p-6 shadow-[0_12px_28px_rgba(15,23,42,0.05)]">
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
                  <Globe2 className="size-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-[color:var(--color-fg-default)]">
                    O cliente verá uma página pronta para converter
                  </h2>
                  <p className="mt-1 text-sm text-[color:var(--color-fg-muted)]">
                    O fluxo foi pensado para ser direto, claro e confiável.
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl border border-[color:var(--color-border-default)] bg-slate-50 px-4 py-4">
                  <p className="text-sm font-semibold text-[color:var(--color-fg-default)]">
                    Serviços organizados
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--color-fg-muted)]">
                    Catálogo limpo, com duração e preço visíveis.
                  </p>
                </div>
                <div className="rounded-2xl border border-[color:var(--color-border-default)] bg-slate-50 px-4 py-4">
                  <p className="text-sm font-semibold text-[color:var(--color-fg-default)]">
                    Horários em tempo real
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--color-fg-muted)]">
                    O cliente encontra vagas disponíveis sem esperar resposta.
                  </p>
                </div>
                <div className="rounded-2xl border border-[color:var(--color-border-default)] bg-slate-50 px-4 py-4">
                  <p className="text-sm font-semibold text-[color:var(--color-fg-default)]">
                    Reserva em poucos cliques
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--color-fg-muted)]">
                    Menos fricção para quem quer agendar agora.
                  </p>
                </div>
              </div>
            </section>

            <aside className="rounded-[30px] border border-[color:var(--color-border-default)] bg-slate-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-fg-muted)]">
                Checklist final
              </p>
              <div className="mt-5 space-y-3">
                <div className="rounded-2xl bg-white px-4 py-4">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="mt-0.5 size-5 text-emerald-600" />
                    <div>
                      <p className="text-sm font-semibold text-[color:var(--color-fg-default)]">
                        Dados essenciais preenchidos
                      </p>
                      <p className="mt-1 text-sm text-[color:var(--color-fg-muted)]">
                        Marca, serviços e disponibilidade já estão definidos.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl bg-white px-4 py-4">
                  <div className="flex items-start gap-3">
                    <CalendarDays className="mt-0.5 size-5 text-sky-700" />
                    <div>
                      <p className="text-sm font-semibold text-[color:var(--color-fg-default)]">
                        Agenda pronta para teste
                      </p>
                      <p className="mt-1 text-sm text-[color:var(--color-fg-muted)]">
                        Vale fazer um agendamento de ponta a ponta logo após publicar.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>

        <aside className="rounded-[34px] border border-[color:var(--color-border-default)] bg-[linear-gradient(180deg,#f8fbff_0%,#eef5ff_100%)] p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-fg-muted)]">
            Prévia de percepção
          </p>

          <div className="mt-5 rounded-[30px] border border-slate-200 bg-white p-4 shadow-[0_14px_30px_rgba(15,23,42,0.06)]">
            <div className="rounded-[24px] bg-[linear-gradient(135deg,#0f172a_0%,#16427f_55%,#1f6fe5_100%)] p-5 text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/55">
                Página pública
              </p>
              <p className="mt-4 text-xl font-semibold">
                {membership.business.bookingTitle || membership.business.name}
              </p>
              <p className="mt-2 text-sm leading-6 text-white/75">
                Visual limpo, horários disponíveis e agendamento sem depender de contato manual.
              </p>
            </div>

            <div className="mt-4 space-y-3">
              <div className="rounded-2xl border border-[color:var(--color-border-default)] px-4 py-3">
                <p className="text-sm font-semibold text-[color:var(--color-fg-default)]">
                  Primeiro impacto
                </p>
                <p className="mt-1 text-sm text-[color:var(--color-fg-muted)]">
                  “Esse negócio parece organizado e fácil de agendar.”
                </p>
              </div>
              <div className="rounded-2xl border border-[color:var(--color-border-default)] px-4 py-3">
                <p className="text-sm font-semibold text-[color:var(--color-fg-default)]">
                  Canal ideal
                </p>
                <p className="mt-1 text-sm text-[color:var(--color-fg-muted)]">
                  Bio do Instagram, WhatsApp e campanhas locais.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </OnboardingShell>
  );
}
