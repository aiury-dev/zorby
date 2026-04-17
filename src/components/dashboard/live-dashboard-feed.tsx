"use client";

import { useEffect, useState } from "react";

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
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <article className="rounded-[28px] border border-[color:var(--color-border-default)] bg-white p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-[color:var(--color-fg-default)]">
              Próximos agendamentos
            </h2>
            <p className="mt-2 text-sm text-[color:var(--color-fg-muted)]">
              {connected ? "Atualização em tempo real conectada." : "Conectando ao feed em tempo real..."}
            </p>
          </div>
          <span className="rounded-full bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-fg-muted)]">
            Ao vivo
          </span>
        </div>

        <div className="mt-6 space-y-4">
          {recentAppointments.length ? (
            recentAppointments.map((appointment) => (
              <div
                key={appointment.id}
                className="rounded-[24px] border border-[color:var(--color-border-default)] bg-slate-50 p-4"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-[color:var(--color-fg-default)]">
                      {appointment.customerName}
                    </p>
                    <p className="mt-1 text-sm text-[color:var(--color-fg-muted)]">
                      {appointment.serviceName}
                    </p>
                  </div>
                  <div className="text-right">
                    <strong className="block text-[color:var(--color-fg-default)]">
                      {appointment.startsAtLabel}
                    </strong>
                    <span className="mt-1 block text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-fg-muted)]">
                      {appointment.status}
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

      <article className="rounded-[28px] border border-[color:var(--color-border-default)] bg-white p-6">
        <h2 className="text-2xl font-semibold text-[color:var(--color-fg-default)]">
          Alertas em tempo real
        </h2>
        <div className="mt-6 grid gap-3">
          {Object.entries(alerts).length ? (
            Object.entries(alerts).map(([status, total]) => (
              <div
                key={status}
                className="rounded-[24px] border border-[color:var(--color-border-default)] bg-slate-50 px-4 py-4 text-sm font-semibold text-[color:var(--color-fg-default)]"
              >
                {status}: {total}
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
