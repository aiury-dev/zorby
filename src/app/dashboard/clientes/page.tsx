import Link from "next/link";
import { redirect } from "next/navigation";
import { formatInTimeZone } from "date-fns-tz";
import { Search, ShieldCheck, Users2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatPhone } from "@/lib/utils";
import { requestCustomerDeletionAction } from "@/server/actions/dashboard";
import { getCurrentMembership } from "@/server/services/me";

type ClientesPageProps = {
  searchParams: Promise<{
    q?: string;
  }>;
};

export default async function ClientesPage({ searchParams }: ClientesPageProps) {
  const membership = await getCurrentMembership();

  if (!membership) {
    redirect("/login");
  }

  const params = await searchParams;
  const query = params.q?.trim() ?? "";

  const customers = await prisma.customer.findMany({
    where: {
      businessId: membership.businessId,
      deletedAt: null,
      ...(query
        ? {
            OR: [
              {
                fullName: {
                  contains: query,
                  mode: "insensitive",
                },
              },
              {
                phone: {
                  contains: query.replace(/\D/g, ""),
                },
              },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      appointments: {
        orderBy: { startsAtUtc: "desc" },
        take: 3,
        select: {
          id: true,
          startsAtUtc: true,
          serviceNameSnapshot: true,
          status: true,
        },
      },
      _count: {
        select: {
          appointments: true,
        },
      },
    },
  });

  const customersWithEmail = customers.filter((customer) => customer.email).length;
  const customersWithHistory = customers.filter((customer) => customer._count.appointments > 0).length;

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--color-border-default)] bg-[color:var(--color-surface-muted)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.26em] text-[color:var(--color-fg-muted)]">
            <Users2 className="size-3.5 text-[color:var(--color-brand-500)]" />
            Clientes
          </div>
          <h1 className="text-4xl font-semibold leading-tight text-[color:var(--color-fg-default)]">
            Relacionamento, histórico e contexto em um só lugar.
          </h1>
          <p className="text-sm leading-7 text-[color:var(--color-fg-muted)] md:text-base">
            Encontre qualquer cliente por nome ou telefone, veja os últimos agendamentos e acesse
            o histórico completo em poucos cliques.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[430px]">
          <article className="rounded-[26px] border border-[color:var(--color-border-default)] bg-white p-4 shadow-[0_14px_36px_rgba(15,23,42,0.04)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--color-fg-muted)]">
              Total no filtro
            </p>
            <p className="mt-3 text-3xl font-semibold text-[color:var(--color-fg-default)]">
              {customers.length}
            </p>
          </article>
          <article className="rounded-[26px] border border-[color:var(--color-border-default)] bg-white p-4 shadow-[0_14px_36px_rgba(15,23,42,0.04)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--color-fg-muted)]">
              Com e-mail
            </p>
            <p className="mt-3 text-3xl font-semibold text-[color:var(--color-fg-default)]">
              {customersWithEmail}
            </p>
          </article>
          <article className="rounded-[26px] border border-[color:var(--color-border-default)] bg-white p-4 shadow-[0_14px_36px_rgba(15,23,42,0.04)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--color-fg-muted)]">
              Com histórico
            </p>
            <p className="mt-3 text-3xl font-semibold text-[color:var(--color-fg-default)]">
              {customersWithHistory}
            </p>
          </article>
        </div>
      </header>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <form className="rounded-[30px] border border-[color:var(--color-border-default)] bg-white p-6 shadow-[0_20px_50px_rgba(15,23,42,0.05)]">
          <div className="flex flex-col gap-5 md:flex-row md:items-end">
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium text-[color:var(--color-fg-default)]" htmlFor="q">
                Buscar por nome ou telefone
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[color:var(--color-fg-muted)]" />
                <input
                  id="q"
                  type="search"
                  name="q"
                  defaultValue={query}
                  placeholder="Ex.: Ana, João ou (11) 99999-0000"
                  className="h-12 w-full rounded-2xl border border-[color:var(--color-border-default)] bg-white pl-11 pr-4 text-sm text-[color:var(--color-fg-default)] outline-none transition focus:border-[color:var(--color-brand-500)]"
                />
              </div>
            </div>
            <button className="inline-flex h-12 items-center justify-center rounded-2xl bg-[color:var(--color-brand-500)] px-6 text-sm font-semibold text-white shadow-[0_16px_32px_rgba(37,99,235,0.18)] transition hover:bg-[color:var(--color-brand-600)]">
              Buscar clientes
            </button>
          </div>
        </form>

        <article className="rounded-[30px] border border-[color:var(--color-border-default)] bg-[linear-gradient(180deg,#0f172a_0%,#172554_100%)] p-6 text-white shadow-[0_24px_70px_rgba(15,23,42,0.16)]">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
              <ShieldCheck className="size-5" />
            </div>
            <div className="space-y-3">
              <h2 className="text-xl font-semibold">LGPD e relacionamento sob controle</h2>
              <p className="text-sm leading-7 text-white/72">
                O painel mantém o histórico acessível para a equipe e permite iniciar solicitações
                de exclusão de dados sem perder contexto operacional.
              </p>
            </div>
          </div>
        </article>
      </section>

      {customers.length === 0 ? (
        <section className="rounded-[30px] border border-dashed border-[color:var(--color-border-default)] bg-[color:var(--color-surface-muted)] p-8 text-center text-sm text-[color:var(--color-fg-muted)]">
          Nenhum cliente encontrado com esse filtro.
        </section>
      ) : (
        <section className="grid gap-4">
          {customers.map((customer) => (
            <article
              key={customer.id}
              className="rounded-[30px] border border-[color:var(--color-border-default)] bg-white p-5 shadow-[0_16px_36px_rgba(15,23,42,0.04)] md:p-6"
            >
              <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                <div className="space-y-4">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-[color:var(--color-fg-default)]">
                        {customer.fullName}
                      </h2>
                      <p className="mt-2 text-sm text-[color:var(--color-fg-muted)]">
                        {formatPhone(customer.phone)}
                        {customer.email ? ` • ${customer.email}` : ""}
                      </p>
                    </div>
                    <span className="inline-flex h-fit rounded-full bg-[color:var(--color-surface-muted)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-fg-muted)]">
                      {customer._count.appointments} agendamentos
                    </span>
                  </div>

                  <div className="grid gap-3 lg:grid-cols-3">
                    {customer.appointments.length ? (
                      customer.appointments.map((appointment) => (
                        <div
                          key={appointment.id}
                          className="rounded-[22px] border border-[color:var(--color-border-default)] bg-[color:var(--color-surface-muted)] px-4 py-3"
                        >
                          <p className="text-sm font-semibold text-[color:var(--color-fg-default)]">
                            {appointment.serviceNameSnapshot}
                          </p>
                          <p className="mt-2 text-sm text-[color:var(--color-fg-muted)]">
                            {formatInTimeZone(
                              appointment.startsAtUtc,
                              membership.business.timezone,
                              "dd/MM/yyyy 'às' HH:mm",
                            )}
                          </p>
                          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-fg-muted)]">
                            {appointment.status}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-[22px] border border-dashed border-[color:var(--color-border-default)] bg-[color:var(--color-surface-muted)] px-4 py-6 text-sm text-[color:var(--color-fg-muted)] lg:col-span-3">
                        Sem histórico recente.
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 xl:max-w-[320px] xl:justify-end">
                  <Link
                    href={`/dashboard/clientes/${customer.id}`}
                    className="inline-flex items-center justify-center rounded-full border border-[color:var(--color-border-default)] px-4 py-2.5 text-sm font-semibold text-[color:var(--color-fg-default)] transition hover:bg-[color:var(--color-surface-muted)]"
                  >
                    Ver histórico completo
                  </Link>
                  <form action={requestCustomerDeletionAction}>
                    <input type="hidden" name="customerId" value={customer.id} />
                    <button className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100">
                      Solicitar exclusão LGPD
                    </button>
                  </form>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
