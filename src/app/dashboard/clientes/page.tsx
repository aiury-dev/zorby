import Link from "next/link";
import { redirect } from "next/navigation";
import { formatInTimeZone } from "date-fns-tz";
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

  return (
    <div className="space-y-6">
      <header className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[color:var(--color-fg-muted)]">
            Clientes
          </p>
          <h1 className="text-4xl font-semibold text-[color:var(--color-fg-default)]">
            Relacionamento e histórico
          </h1>
        </div>

        <form className="flex flex-col gap-3 rounded-[28px] border border-[color:var(--color-border-default)] bg-slate-50 p-4 md:flex-row">
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Buscar por nome ou telefone"
            className="h-11 flex-1 rounded-2xl border border-[color:var(--color-border-default)] px-4 text-sm text-[color:var(--color-fg-default)]"
          />
          <button className="h-11 rounded-full bg-[color:var(--color-brand-500)] px-5 text-sm font-semibold text-white">
            Buscar
          </button>
        </form>
      </header>

      <div className="grid gap-4">
        {customers.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-[color:var(--color-border-default)] bg-slate-50 p-8 text-sm text-[color:var(--color-fg-muted)]">
            Nenhum cliente encontrado com esse filtro.
          </div>
        ) : null}

        {customers.map((customer) => (
          <article
            key={customer.id}
            className="rounded-[28px] border border-[color:var(--color-border-default)] bg-white p-5"
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-[color:var(--color-fg-default)]">
                  {customer.fullName}
                </h2>
                <p className="mt-1 text-sm text-[color:var(--color-fg-muted)]">
                  {formatPhone(customer.phone)}
                  {customer.email ? ` · ${customer.email}` : ""}
                </p>
              </div>
              <span className="rounded-full bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-fg-muted)]">
                {customer._count.appointments} agendamentos
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {customer.appointments.length ? (
                customer.appointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="rounded-[20px] border border-[color:var(--color-border-default)] bg-slate-50 px-4 py-3 text-sm text-[color:var(--color-fg-muted)]"
                  >
                    <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                      <span>{appointment.serviceNameSnapshot}</span>
                      <span>
                        {formatInTimeZone(
                          appointment.startsAtUtc,
                          membership.business.timezone,
                          "dd/MM/yyyy 'às' HH:mm",
                        )}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[color:var(--color-fg-muted)]">Sem histórico recente.</p>
              )}
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href={`/dashboard/clientes/${customer.id}`}
                className="rounded-full border border-[color:var(--color-border-default)] px-4 py-2 text-sm font-semibold text-[color:var(--color-fg-default)]"
              >
                Ver histórico completo
              </Link>
              <form action={requestCustomerDeletionAction}>
                <input type="hidden" name="customerId" value={customer.id} />
                <button className="rounded-full border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700">
                  Solicitar exclusão LGPD
                </button>
              </form>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
