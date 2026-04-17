"use client";

import { useEffect, useState } from "react";
import { Activity, BellRing, CircleAlert, LoaderCircle } from "lucide-react";

type DashboardFeedProps = {
  initialRecentAppointments: Array<{
    id: string;
    customerName: string;
    serviceName: string;
    startsAtLabel: string;
    status: string;
  }>;
  initialAlerts: Record<string, number>;
};

type DashboardPayload = {
  generatedAt: string;
  recentAppointments: DashboardFeedProps["initialRecentAppointments"];
  alerts: Record<string, number>;
};

const alertLabels: Record<string, string> = {
  PENDING: "Pendentes",
  CANCELLED: "Cancelados",
  CONFIRMED: "Confirmados",
  COMPLETED: "Concluídos",
  NO_SHOW: "Não compareceu",
};

export function LiveDashboardFeed(props: DashboardFeedProps) {
  const [recentAppointments, setRecentAppointments] = useState(props.initialRecentAppointments);
  const [alerts, setAlerts] = useState(props.initialAlerts);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const source = new EventSource("/api/dashboard/events");

    source.addEventListener("dashboard", (event) => {
      const payload = JSON.parse((event as MessageEvent).data) as DashboardPayload;
      setRecentAppointments(payload.recentAppointments);
      setAlerts(payload.alerts);
      setConnected(true);
    });

    source.onerror = () => {
      setConnected(false);
    };

    return () => {
      source.close();
    };
  }, []);

  return (
    <div className="grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
      <article className="rounded-[30px] border border-[color:var(--color-border-default)] bg-white p-6 shadow-[0_12px_28px_rgba(15,23,42,0.05)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-fg-muted)]">
              Feed ao vivo
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-[color:var(--color-fg-default)]">
              Próximos agendamentos
            </h2>
            <p className="mt-2 text-sm text-[color:var(--color-fg-muted)]">
              {connected ? "Sincronização em tempo real conectada." : "Conectando ao feed em tempo real..."}
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-4 py-2 text-sm font-medium text-[color:var(--color-fg-muted)]">
            {connected ? <Activity className="size-4 text-emerald-600" /> : <LoaderCircle className="size-4 animate-spin" />}
            Ao vivo
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {recentAppointments.length ? (
            recentAppointments.map((appointment) => (
              <div
                key={appointment.id}
                className="rounded-[24px] border border-[color:var(--color-border-default)] bg-slate-50 p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-[color:var(--color-fg-default)]">{appointment.customerName}</p>
                    <p className="mt-1 text-sm leading-6 text-[color:var(--color-fg-muted)]">
                      {appointment.serviceName}
                    </p>
                  </div>
                  <div className="text-right">
                    <strong className="block text-[color:var(--color-fg-default)]">{appointment.startsAtLabel}</strong>
                    <span className="mt-1 inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-fg-muted)]">
                      {alertLabels[appointment.status] ?? appointment.status}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="rounded-[24px] border border-dashed border-[color:var(--color-border-default)] p-5 text-sm text-[color:var(--color-fg-muted)]">
              Ainda não há próximos agendamentos.
            </p>
          )}
        </div>
      </article>

      <article className="rounded-[30px] border border-[color:var(--color-border-default)] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-6 shadow-[0_12px_28px_rgba(15,23,42,0.05)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-fg-muted)]">
              Monitoramento
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-[color:var(--color-fg-default)]">
              Alertas em tempo real
            </h2>
          </div>
          <div className="rounded-2xl bg-amber-50 p-3 text-amber-700">
            <BellRing className="size-5" />
          </div>
        </div>

        <div className="mt-6 grid gap-3">
          {Object.entries(alerts).length ? (
            Object.entries(alerts).map(([status, total]) => (
              <div
                key={status}
                className="flex items-center justify-between rounded-[24px] border border-[color:var(--color-border-default)] bg-white px-4 py-4"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-slate-50 p-2 text-[color:var(--color-fg-muted)]">
                    <CircleAlert className="size-4" />
                  </div>
                  <span className="text-sm font-semibold text-[color:var(--color-fg-default)]">
                    {alertLabels[status] ?? status}
                  </span>
                </div>
                <span className="text-lg font-semibold text-[color:var(--color-fg-default)]">{total}</span>
              </div>
            ))
          ) : (
            <p className="rounded-[24px] border border-dashed border-[color:var(--color-border-default)] p-5 text-sm text-[color:var(--color-fg-muted)]">
              Sem alertas recentes.
            </p>
          )}
        </div>
      </article>
    </div>
  );
}
