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
      <article className="rounded-[24px] border border-white/8 bg-[var(--navy-2)] p-6 shadow-[0_18px_40px_rgba(13,17,23,0.18)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
              Feed ao vivo
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-white [font-family:var(--font-display)]">
              Próximos agendamentos
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              {connected ? "Sincronização em tempo real conectada." : "Conectando ao feed em tempo real..."}
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/4 px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-slate-300">
            {connected ? (
              <Activity className="size-3.5 text-emerald-400" />
            ) : (
              <LoaderCircle className="size-3.5 animate-spin" />
            )}
            Ao vivo
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {recentAppointments.length ? (
            recentAppointments.map((appointment) => (
              <div
                key={appointment.id}
                className="rounded-[16px] border border-white/8 bg-[var(--navy-3)] p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-50">{appointment.customerName}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-400">{appointment.serviceName}</p>
                  </div>
                  <div className="text-right">
                    <strong className="block text-slate-100">{appointment.startsAtLabel}</strong>
                    <span className="mt-2 inline-flex rounded-full border border-white/8 bg-white/4 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-300">
                      {alertLabels[appointment.status] ?? appointment.status}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="rounded-[16px] border border-dashed border-white/10 px-4 py-5 text-sm text-slate-400">
              Ainda não há próximos agendamentos.
            </p>
          )}
        </div>
      </article>

      <article className="rounded-[24px] border border-white/8 bg-[var(--navy-2)] p-6 shadow-[0_18px_40px_rgba(13,17,23,0.18)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
              Monitoramento
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-white [font-family:var(--font-display)]">
              Alertas em tempo real
            </h2>
          </div>
          <div className="flex size-10 items-center justify-center rounded-[12px] border border-white/8 bg-white/4 text-slate-300">
            <BellRing className="size-4" />
          </div>
        </div>

        <div className="mt-6 grid gap-3">
          {Object.entries(alerts).length ? (
            Object.entries(alerts).map(([status, total]) => (
              <div
                key={status}
                className="flex items-center justify-between rounded-[16px] border border-white/8 bg-[var(--navy-3)] px-4 py-4"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-[10px] bg-white/4 p-2 text-slate-400">
                    <CircleAlert className="size-4" />
                  </div>
                  <span className="text-sm font-semibold text-slate-100">
                    {alertLabels[status] ?? status}
                  </span>
                </div>
                <span className="text-lg font-semibold text-white [font-family:var(--font-display)]">
                  {total}
                </span>
              </div>
            ))
          ) : (
            <p className="rounded-[16px] border border-dashed border-white/10 px-4 py-5 text-sm text-slate-400">
              Sem alertas recentes.
            </p>
          )}
        </div>
      </article>
    </div>
  );
}
