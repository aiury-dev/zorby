import Link from "next/link";

const highlights = [
  "Página pública com agendamento em poucos cliques",
  "Confirmações, lembretes e cancelamentos automáticos",
  "Dashboard para agenda, serviços, profissionais e cobrança",
];

const segments = [
  "Clínicas",
  "Salões de beleza",
  "Barbearias",
  "Consultórios",
  "Estúdios e especialistas",
];

export default function Home() {
  return (
    <main className="flex flex-1 flex-col bg-[radial-gradient(circle_at_top,#dbeafe,transparent_36%),linear-gradient(180deg,#f8fafc_0%,#eef4ff_100%)]">
      <section className="mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center gap-12 px-6 py-16 md:px-8 lg:flex-row lg:items-center lg:py-24">
        <div className="max-w-2xl space-y-8">
          <span className="inline-flex rounded-full border border-[color:var(--color-border-default)] bg-white px-4 py-2 text-sm font-medium text-[color:var(--color-fg-muted)]">
            Agendamento online para negócios locais
          </span>

          <div className="space-y-5">
            <h1 className="text-5xl font-semibold tracking-tight text-[color:var(--color-fg-default)] md:text-6xl">
              Seu negócio disponível 24h para novos agendamentos.
            </h1>
            <p className="max-w-xl text-lg leading-8 text-[color:var(--color-fg-muted)]">
              O Zorby ajuda clínicas, salões e profissionais autônomos a organizar agenda, reduzir
              faltas e vender mais sem depender de WhatsApp o dia inteiro.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/cadastro"
              className="inline-flex h-12 items-center rounded-full bg-[color:var(--color-brand-500)] px-6 text-sm font-semibold text-white"
            >
              Criar conta grátis
            </Link>
            <Link
              href="/login"
              className="inline-flex h-12 items-center rounded-full border border-[color:var(--color-border-default)] bg-white px-6 text-sm font-semibold text-[color:var(--color-fg-default)]"
            >
              Entrar no painel
            </Link>
          </div>

          <div className="grid gap-3 text-sm text-[color:var(--color-fg-muted)] sm:grid-cols-3">
            {highlights.map((highlight) => (
              <div
                key={highlight}
                className="rounded-2xl border border-[color:var(--color-border-default)] bg-white/90 p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
              >
                {highlight}
              </div>
            ))}
          </div>
        </div>

        <div className="w-full max-w-xl rounded-[32px] border border-white/70 bg-white/90 p-8 shadow-[0_1px_2px_rgba(15,23,42,0.06),0_24px_60px_rgba(15,23,42,0.08)] backdrop-blur md:p-10">
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[color:var(--color-fg-muted)]">
                  Feito para
                </p>
                <h2 className="mt-2 text-3xl font-semibold text-[color:var(--color-fg-default)]">
                  Operações que precisam de agenda organizada
                </h2>
              </div>
              <div className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
                14 dias grátis
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {segments.map((segment) => (
                <div
                  key={segment}
                  className="rounded-2xl border border-[color:var(--color-border-default)] bg-slate-50 px-4 py-4 text-sm font-medium text-[color:var(--color-fg-default)]"
                >
                  {segment}
                </div>
              ))}
            </div>

            <div className="rounded-[28px] border border-[color:var(--color-border-default)] bg-[#0f172a] p-6 text-white">
              <p className="text-sm text-white/70">Exemplo de valor entregue</p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-3xl font-semibold">- faltas</p>
                  <p className="mt-2 text-sm text-white/70">
                    lembretes automáticos por e-mail e WhatsApp
                  </p>
                </div>
                <div>
                  <p className="text-3xl font-semibold">+ reservas</p>
                  <p className="mt-2 text-sm text-white/70">
                    página pública própria, responsiva e pronta para divulgar
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
