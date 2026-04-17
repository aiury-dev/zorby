import type { ReactNode } from "react";
import {
  Building2,
  CalendarClock,
  CheckCircle2,
  Link2,
  NotebookPen,
  Sparkles,
} from "lucide-react";

const onboardingSteps = [
  {
    title: "Dados do negócio",
    description: "Nome, contexto e presença inicial da sua marca.",
    icon: Building2,
  },
  {
    title: "Serviços",
    description: "Monte o catálogo que o cliente verá ao agendar.",
    icon: NotebookPen,
  },
  {
    title: "Disponibilidade",
    description: "Organize a agenda base e o ritmo do atendimento.",
    icon: CalendarClock,
  },
  {
    title: "Link público",
    description: "Revise o endereço final e prepare a publicação.",
    icon: Link2,
  },
  {
    title: "Concluído",
    description: "Tudo pronto para começar a receber agendamentos.",
    icon: CheckCircle2,
  },
];

type OnboardingShellProps = {
  currentStep: number;
  title: string;
  description: string;
  accent?: "brand" | "success";
  sidebarTitle?: string;
  sidebarDescription?: string;
  sidebarContent?: ReactNode;
  headerContent?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
};

export function OnboardingShell({
  currentStep,
  title,
  description,
  accent = "brand",
  sidebarTitle = "Crie uma experiência com cara de marca pronta para vender",
  sidebarDescription = "Essas primeiras decisões moldam a confiança do cliente, a clareza do painel e a qualidade do seu fluxo de agendamento.",
  sidebarContent,
  headerContent,
  children,
  footer,
}: OnboardingShellProps) {
  const accentPalette =
    accent === "success"
      ? {
          badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
          progress: "from-emerald-500 via-teal-500 to-cyan-500",
        }
      : {
          badge:
            "border-[color:var(--color-border-default)] bg-white text-[color:var(--color-fg-muted)]",
          progress: "from-[color:var(--color-brand-500)] via-sky-500 to-cyan-400",
        };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#dbeafe_0%,transparent_24%),radial-gradient(circle_at_bottom_right,#bfdbfe_0%,transparent_18%),linear-gradient(180deg,#f8fafc_0%,#eef4ff_100%)] px-4 py-6 md:px-6 md:py-10">
      <div className="mx-auto grid w-full max-w-7xl gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="overflow-hidden rounded-[38px] border border-white/15 bg-[linear-gradient(180deg,#07101d_0%,#0c1f3d_36%,#134a84_100%)] p-6 text-white shadow-[0_32px_90px_rgba(15,23,42,0.32)] md:p-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex size-12 items-center justify-center rounded-2xl border border-white/10 bg-white/10 backdrop-blur">
                <Sparkles className="size-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/50">
                  Zorby Setup
                </p>
                <p className="mt-1 text-lg font-semibold">Onboarding guiado</p>
              </div>
            </div>
            <div className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-sm text-white/70">
              0{currentStep}/05
            </div>
          </div>

          <div className="mt-8 rounded-[30px] border border-white/10 bg-white/[0.06] p-5">
            <div className="flex items-center justify-between text-sm text-white/70">
              <span>Progresso do setup</span>
              <span>{Math.round((currentStep / 5) * 100)}%</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${accentPalette.progress}`}
                style={{ width: `${(currentStep / 5) * 100}%` }}
              />
            </div>
            <p className="mt-4 text-sm leading-7 text-white/70">
              A ideia aqui é publicar rápido, com aparência profissional e sem deixar pontas
              soltas na experiência do cliente.
            </p>

            <div className="mt-5 grid grid-cols-5 gap-2">
              {onboardingSteps.map((step, index) => {
                const active = index + 1 <= currentStep;

                return (
                  <div
                    key={step.title}
                    className={[
                      "flex h-11 items-center justify-center rounded-2xl border text-sm font-semibold transition",
                      active
                        ? "border-white/10 bg-white/12 text-white"
                        : "border-white/10 bg-white/[0.03] text-white/40",
                    ].join(" ")}
                  >
                    0{index + 1}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-[1.7rem] font-semibold leading-tight">{sidebarTitle}</h2>
            <p className="mt-4 text-sm leading-7 text-white/70">{sidebarDescription}</p>
          </div>

          <div className="mt-8 space-y-3">
            {onboardingSteps.map((step, index) => {
              const Icon = step.icon;
              const state =
                index + 1 < currentStep ? "done" : index + 1 === currentStep ? "current" : "upcoming";

              return (
                <div
                  key={step.title}
                  className={[
                    "rounded-[24px] border px-4 py-4 transition-colors",
                    state === "current"
                      ? "border-white/20 bg-white/12 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]"
                      : state === "done"
                        ? "border-emerald-300/20 bg-emerald-400/10"
                        : "border-white/10 bg-white/[0.03]",
                  ].join(" ")}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={[
                        "mt-0.5 flex size-11 shrink-0 items-center justify-center rounded-2xl border",
                        state === "done"
                          ? "border-emerald-300/25 bg-emerald-400/18 text-emerald-100"
                          : state === "current"
                            ? "border-white/20 bg-white/10 text-white"
                            : "border-white/10 bg-white/[0.04] text-white/60",
                      ].join(" ")}
                    >
                      <Icon className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.24em] text-white/40">
                          0{index + 1}
                        </span>
                        <p className="text-sm font-semibold">{step.title}</p>
                      </div>
                      <p className="mt-2 text-xs leading-6 text-white/60">{step.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {sidebarContent ? (
            <div className="mt-8 rounded-[30px] border border-white/10 bg-white/[0.05] p-5">
              {sidebarContent}
            </div>
          ) : null}
        </aside>

        <section className="overflow-hidden rounded-[38px] border border-white/70 bg-white/95 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur">
          <div className="border-b border-[color:var(--color-border-default)] bg-[linear-gradient(180deg,#ffffff_0%,#f9fbff_100%)] px-6 py-8 md:px-10 md:py-10">
            <span
              className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] ${accentPalette.badge}`}
            >
              Etapa {currentStep} de 5
            </span>

            <div className="mt-5 max-w-3xl space-y-4">
              <h1 className="text-4xl font-semibold tracking-tight text-[color:var(--color-fg-default)] md:text-5xl">
                {title}
              </h1>
              <p className="max-w-2xl text-base leading-8 text-[color:var(--color-fg-muted)] md:text-lg">
                {description}
              </p>
              <div className="flex flex-wrap gap-3">
                <div className="inline-flex items-center rounded-full border border-[color:var(--color-border-default)] bg-white px-4 py-2 text-sm text-[color:var(--color-fg-muted)]">
                  Experiência pensada para conversão
                </div>
                <div className="inline-flex items-center rounded-full border border-[color:var(--color-border-default)] bg-white px-4 py-2 text-sm text-[color:var(--color-fg-muted)]">
                  Fluxo rápido, claro e elegante
                </div>
              </div>
              {headerContent}
            </div>
          </div>

          <div className="px-6 py-8 md:px-10 md:py-10">
            {children}
            {footer ? (
              <div className="mt-8 border-t border-[color:var(--color-border-default)] pt-6">{footer}</div>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
