import Link from "next/link";
import {
  ArrowRight,
  BellRing,
  CalendarDays,
  ChartNoAxesCombined,
  CheckCircle2,
  LayoutDashboard,
  Sparkles,
  Store,
  UserRoundSearch,
} from "lucide-react";

const highlights = [
  {
    title: "Página pública pronta para conversão",
    description: "Seu cliente agenda em poucos cliques, no celular ou no desktop.",
    icon: CalendarDays,
  },
  {
    title: "Confirmações e lembretes automáticos",
    description: "Menos faltas, menos mensagens manuais e mais previsibilidade na agenda.",
    icon: BellRing,
  },
  {
    title: "Painel para operação completa",
    description: "Agenda, clientes, serviços, profissionais e cobrança no mesmo lugar.",
    icon: LayoutDashboard,
  },
];

const segments = [
  "Clínicas",
  "Salões de beleza",
  "Barbearias",
  "Consultórios",
  "Estúdios e especialistas",
];

const metrics = [
  {
    value: "- faltas",
    description: "Lembretes automáticos por e-mail e WhatsApp para reduzir esquecimentos.",
  },
  {
    value: "+ reservas",
    description: "Página responsiva própria, pronta para bio, Google e divulgação.",
  },
];

export default function Home() {
  return (
    <main className="relative flex flex-1 flex-col overflow-hidden bg-[linear-gradient(180deg,#edf4ff_0%,#f7faff_48%,#eef4ff_100%)]">
      <div className="pointer-events-none absolute left-1/2 top-[-220px] h-[620px] w-[960px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(37,99,235,0.18)_0%,transparent_64%)]" />

      <section className="mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center gap-10 px-4 py-10 md:px-8 md:py-14 xl:gap-14 xl:py-20">
        <div className="grid gap-8 xl:grid-cols-[1.02fr_0.98fr] xl:items-center">
          <div className="max-w-3xl space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(37,99,235,0.18)] bg-[rgba(37,99,235,0.08)] px-4 py-2 text-sm font-medium text-[color:var(--color-brand-600)] shadow-[var(--shadow-sm)] backdrop-blur">
              <Sparkles className="size-4" />
              Agendamento online para negócios locais
            </div>

            <div className="space-y-5">
              <h1 className="max-w-4xl text-5xl font-semibold tracking-[-0.04em] text-[color:var(--color-fg-default)] md:text-6xl xl:text-7xl [font-family:var(--font-display)]">
                Seu negócio disponível 24h para novos agendamentos.
              </h1>
              <p className="max-w-2xl text-lg leading-9 text-[color:var(--color-fg-muted)] md:text-xl">
                O Zorby ajuda clínicas, salões e profissionais autônomos a organizar a agenda,
                reduzir faltas e captar reservas sem depender de WhatsApp o dia inteiro.
              </p>
            </div>

            <div className="grid gap-3 lg:grid-cols-2">
              <article className="rounded-[24px] border border-[rgba(37,99,235,0.14)] bg-white/88 p-4 shadow-[var(--shadow-sm)] backdrop-blur">
                <div className="flex items-start gap-3">
                  <div className="flex size-11 items-center justify-center rounded-2xl bg-blue-50 text-[color:var(--color-brand-500)]">
                    <Store className="size-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[color:var(--color-fg-default)]">
                      Sou empresa ou profissional
                    </p>
                    <p className="mt-1 text-sm leading-6 text-[color:var(--color-fg-muted)]">
                      Quero usar o Zorby para operar agenda, serviços, clientes e cobrança.
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/cadastro"
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-[18px] bg-[color:var(--color-brand-500)] px-6 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(37,99,235,0.24)] transition hover:bg-[color:var(--color-brand-600)]"
                  >
                    Criar conta grátis
                    <ArrowRight className="size-4" />
                  </Link>
                  <Link
                    href="/login"
                    className="inline-flex h-12 items-center justify-center rounded-[18px] border border-[color:var(--color-border-default)] bg-white/92 px-6 text-sm font-semibold text-[color:var(--color-fg-default)] shadow-[var(--shadow-sm)] transition hover:border-[color:var(--color-border-strong)] hover:bg-white"
                  >
                    Entrar no painel
                  </Link>
                </div>
              </article>

              <article className="rounded-[24px] border border-[rgba(15,23,42,0.08)] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-4 shadow-[var(--shadow-sm)] backdrop-blur">
                <div className="flex items-start gap-3">
                  <div className="flex size-11 items-center justify-center rounded-2xl bg-slate-100 text-[color:var(--color-fg-default)]">
                    <UserRoundSearch className="size-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[color:var(--color-fg-default)]">
                      Sou cliente e quero agendar
                    </p>
                    <p className="mt-1 text-sm leading-6 text-[color:var(--color-fg-muted)]">
                      Já tenho o link da empresa e quero escolher um horário disponível.
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <Link
                    href="/agendar"
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-[18px] border border-[color:var(--color-border-default)] bg-white px-6 text-sm font-semibold text-[color:var(--color-fg-default)] shadow-[var(--shadow-sm)] transition hover:border-[color:var(--color-border-strong)] hover:bg-slate-50"
                  >
                    Ir para agendamento
                    <ArrowRight className="size-4" />
                  </Link>
                </div>
              </article>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {highlights.map((highlight) => {
                const Icon = highlight.icon;

                return (
                  <article
                    key={highlight.title}
                    className="rounded-[24px] border border-white/80 bg-white/92 p-4 shadow-[var(--shadow-md)] backdrop-blur"
                  >
                    <div className="flex size-11 items-center justify-center rounded-2xl bg-blue-50 text-[color:var(--color-brand-500)]">
                      <Icon className="size-5" />
                    </div>
                    <h2 className="mt-4 text-sm font-semibold text-[color:var(--color-fg-default)]">
                      {highlight.title}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-[color:var(--color-fg-muted)]">
                      {highlight.description}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>

          <div className="relative">
            <div className="relative overflow-hidden rounded-[36px] border border-white/70 bg-white/92 p-6 shadow-[var(--shadow-lg)] backdrop-blur md:p-8">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="max-w-md">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--color-fg-muted)]">
                    Feito para
                  </p>
                  <h2 className="mt-3 text-3xl font-semibold leading-tight text-[color:var(--color-fg-default)] md:text-4xl [font-family:var(--font-display)]">
                    Operações que precisam de agenda organizada
                  </h2>
                </div>
                <div className="inline-flex items-center rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
                  14 dias grátis
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {segments.map((segment) => (
                  <div
                    key={segment}
                    className="rounded-[20px] border border-[color:var(--color-border-default)] bg-slate-50 px-4 py-4 text-sm font-medium text-[color:var(--color-fg-default)]"
                  >
                    {segment}
                  </div>
                ))}
              </div>

              <div className="mt-6 overflow-hidden rounded-[30px] border border-slate-200 bg-[linear-gradient(140deg,#112060_0%,#0e1b50_44%,#0a1435_100%)] p-6 text-white shadow-[0_24px_50px_rgba(15,23,42,0.18)]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-white/65">Exemplo de valor entregue</p>
                    <h3 className="mt-2 text-2xl font-semibold [font-family:var(--font-display)]">
                      Menos ruído, mais reservas
                    </h3>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
                    <ChartNoAxesCombined className="size-5" />
                  </div>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {metrics.map((metric) => (
                    <div
                      key={metric.value}
                      className="rounded-[24px] border border-white/10 bg-white/10 p-4 backdrop-blur"
                    >
                      <p className="text-3xl font-semibold [font-family:var(--font-display)]">
                        {metric.value}
                      </p>
                      <p className="mt-3 text-sm leading-7 text-white/72">{metric.description}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 rounded-[24px] border border-white/10 bg-white/8 p-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-2xl bg-white/10 p-2">
                      <CheckCircle2 className="size-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Pronto para desktop e mobile</p>
                      <p className="mt-1 text-sm leading-6 text-white/72">
                        A experiência é pensada para quem gerencia a operação no computador e para o
                        cliente que agenda pelo celular.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-[22px] border border-[color:var(--color-border-default)] bg-slate-50 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--color-fg-muted)]">
                    Agenda
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[color:var(--color-fg-default)]">
                    Disponível 24h
                  </p>
                </div>
                <div className="rounded-[22px] border border-[color:var(--color-border-default)] bg-slate-50 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--color-fg-muted)]">
                    Fluxo
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[color:var(--color-fg-default)]">
                    Reserva em poucos cliques
                  </p>
                </div>
                <div className="rounded-[22px] border border-[color:var(--color-border-default)] bg-slate-50 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--color-fg-muted)]">
                    Operação
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[color:var(--color-fg-default)]">
                    Painel de gestão unificado
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
