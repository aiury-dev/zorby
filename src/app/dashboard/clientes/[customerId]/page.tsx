import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { formatInTimeZone } from "date-fns-tz";
import { ArrowLeft, ShieldCheck, UserRound } from "lucide-react";
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
      <header className="overflow-hidden rounded-[32px] border border-[color:var(--color-border-default)] bg-white p-6 shadow-[0_20px_50px_rgba(15,23,42,0.05)] md:p-7">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-4">
            <Link
              href="/dashboard/clientes"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--color-brand-600)] transition hover:text-[color:var(--color-brand-500)]"
            >
              <ArrowLeft className="size-4" />
              Voltar para clientes
            </Link>

            <div className="flex items-start gap-4">
              <div className="flex size-14 items-center justify-center rounded-[20px] bg-[color:var(--color-surface-muted)] text-[color:var(--color-brand-500)]">
                <UserRound className="size-6" />
              </div>
              <div>
                <h1 className="text-4xl font-semibold text-[color:var(--color-fg-default)]">
                  {customer.fullName}
                </h1>
                <p className="mt-3 text-sm text-[color:var(--color-fg-muted)]">
                  {formatPhone(customer.phone)}
                  {customer.email ? ` • ${customer.email}` : ""}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="rounded-[24px] border border-[color:var(--color-border-default)] bg-[color:var(--color-surface-muted)] px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--color-fg-muted)]">
                Histórico total
              </p>
              <p className="mt-2 text-3xl font-semibold text-[color:var(--color-fg-default)]">
                {customer.appointments.length}
              </p>
            </div>
            <form action={requestCustomerDeletionAction}>
              <input type="hidden" name="customerId" value={customer.id} />
              <button className="inline-flex h-12 items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100">
                <ShieldCheck className="size-4" />
                Solicitar exclusão LGPD
              </button>
            </form>
          </div>
        </div>
      </header>

      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold text-[color:var(--color-fg-default)]">
            Histórico completo de atendimentos
          </h2>
          <p className="mt-1 text-sm text-[color:var(--color-fg-muted)]">
            Acompanhe serviços, profissional responsável, horário e status de cada visita.
          </p>
        </div>

        {customer.appointments.length ? (
          <div className="grid gap-4">
            {customer.appointments.map((appointment) => (
              <article
                key={appointment.id}
                className="rounded-[28px] border border-[color:var(--color-border-default)] bg-white p-5 shadow-[0_16px_36px_rgba(15,23,42,0.04)]"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="space-y-2">
                    <p className="text-lg font-semibold text-[color:var(--color-fg-default)]">
                      {appointment.serviceNameSnapshot}
                    </p>
                    <p className="text-sm text-[color:var(--color-fg-muted)]">
                      com {appointment.professional.displayName}
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[420px]">
                    <div className="rounded-[20px] bg-[color:var(--color-surface-muted)] px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--color-fg-muted)]">
                        Data e hora
                      </p>
                      <p className="mt-2 text-sm font-semibold text-[color:var(--color-fg-default)]">
                        {formatInTimeZone(
                          appointment.startsAtUtc,
                          membership.business.timezone,
                          "dd/MM/yyyy 'às' HH:mm",
                        )}
                      </p>
                    </div>
                    <div className="rounded-[20px] bg-[color:var(--color-surface-muted)] px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--color-fg-muted)]">
                        Status
                      </p>
                      <p className="mt-2 text-sm font-semibold text-[color:var(--color-fg-default)]">
                        {appointment.status}
                      </p>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-[30px] border border-dashed border-[color:var(--color-border-default)] bg-[color:var(--color-surface-muted)] p-8 text-sm text-[color:var(--color-fg-muted)]">
            Esse cliente ainda não tem histórico de agendamentos.
          </div>
        )}
      </section>
    </div>
  );
}
