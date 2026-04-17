import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { formatInTimeZone } from "date-fns-tz";
import { prisma } from "@/lib/prisma";
import { formatPhone } from "@/lib/utils";
import { requestCustomerDeletionAction } from "@/server/actions/dashboard";
import { getCurrentMembership } from "@/server/services/me";

type ClienteDetalhePageProps = {
  params: Promise<{
    customerId: string;
  }>;
};

export default async function ClienteDetalhePage({ params }: ClienteDetalhePageProps) {
  const membership = await getCurrentMembership();

  if (!membership) {
    redirect("/login");
  }

  const { customerId } = await params;

  const customer = await prisma.customer.findFirst({
    where: {
      id: customerId,
      businessId: membership.businessId,
      deletedAt: null,
    },
    include: {
      appointments: {
        orderBy: { startsAtUtc: "desc" },
        include: {
          professional: {
            select: {
              displayName: true,
            },
          },
        },
      },
    },
  });

  if (!customer) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-2">
          <Link
            href="/dashboard/clientes"
            className="text-sm font-semibold text-[color:var(--color-brand-600)]"
          >
            ← Voltar para clientes
          </Link>
          <h1 className="text-4xl font-semibold text-[color:var(--color-fg-default)]">
            {customer.fullName}
          </h1>
          <p className="text-sm text-[color:var(--color-fg-muted)]">
            {formatPhone(customer.phone)}
            {customer.email ? ` · ${customer.email}` : ""}
          </p>
        </div>
        <form action={requestCustomerDeletionAction}>
          <input type="hidden" name="customerId" value={customer.id} />
          <button className="rounded-full border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700">
            Solicitar exclusão LGPD
          </button>
        </form>
      </div>

      <section className="rounded-[28px] border border-[color:var(--color-border-default)] bg-white p-6">
        <h2 className="text-xl font-semibold text-[color:var(--color-fg-default)]">
          Histórico completo
        </h2>

        <div className="mt-5 space-y-4">
          {customer.appointments.length ? (
            customer.appointments.map((appointment) => (
              <article
                key={appointment.id}
                className="rounded-[24px] border border-[color:var(--color-border-default)] bg-slate-50 p-4"
              >
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-semibold text-[color:var(--color-fg-default)]">
                      {appointment.serviceNameSnapshot}
                    </p>
                    <p className="mt-1 text-sm text-[color:var(--color-fg-muted)]">
                      com {appointment.professional.displayName}
                    </p>
                  </div>
                  <div className="text-sm text-[color:var(--color-fg-muted)]">
                    <p>
                      {formatInTimeZone(
                        appointment.startsAtUtc,
                        membership.business.timezone,
                        "dd/MM/yyyy 'às' HH:mm",
                      )}
                    </p>
                    <p className="mt-1 font-semibold text-[color:var(--color-fg-default)]">
                      {appointment.status}
                    </p>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <p className="text-sm text-[color:var(--color-fg-muted)]">
              Esse cliente ainda não tem histórico de agendamentos.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
