"use client";

import { useEffect, useState } from "react";
import { formatInTimeZone } from "date-fns-tz";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type ActionCardProps = {
  kind: "cancel" | "reschedule";
  token: string;
  title: string;
  description: string;
  businessName: string;
  serviceName: string;
  professionalName: string;
  startsAtLabel: string;
  expiresAtLabel: string;
  businessSlug: string;
  serviceId: string;
  professionalId: string;
  startsAtIso: string;
  timezone: string;
  customerTimezone: string;
};

type AvailabilitySlot = {
  startsAt: string;
  endsAt: string;
  label: string;
};

export function ActionCard(props: ActionCardProps) {
  const [reason, setReason] = useState("");
  const [date, setDate] = useState(formatInTimeZone(new Date(), props.timezone, "yyyy-MM-dd"));
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [selectedStartsAt, setSelectedStartsAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (props.kind !== "reschedule") {
      return;
    }

    let cancelled = false;

    async function loadAvailability() {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          date,
          serviceId: props.serviceId,
          professionalId: props.professionalId,
          timezone: props.customerTimezone,
        });

        const response = await fetch(`/api/public/${props.businessSlug}/availability?${params.toString()}`, {
          cache: "no-store",
        });
        const data = (await response.json()) as { error?: string; slots?: AvailabilitySlot[] };

        if (!response.ok) {
          throw new Error(data.error ?? "Não foi possível carregar horários.");
        }

        if (!cancelled) {
          setSlots(data.slots ?? []);
          setSelectedStartsAt((current) =>
            data.slots?.find((slot) => slot.startsAt === current)?.startsAt ?? "",
          );
        }
      } catch (loadError) {
        if (!cancelled) {
          setSlots([]);
          setError(loadError instanceof Error ? loadError.message : "Falha ao carregar horários.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadAvailability();

    return () => {
      cancelled = true;
    };
  }, [date, props.businessSlug, props.customerTimezone, props.kind, props.professionalId, props.serviceId]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(`/api/public/actions/${props.token}/${props.kind}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body:
          props.kind === "cancel"
            ? JSON.stringify({ reason })
            : JSON.stringify({
                startsAt: selectedStartsAt,
                customerTimezone: props.customerTimezone,
              }),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Não foi possível concluir a solicitação.");
      }

      setMessage(
        props.kind === "cancel"
          ? "Agendamento cancelado com sucesso."
          : "Agendamento reagendado com sucesso. Um novo lembrete será enviado.",
      );
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Falha ao processar a solicitação.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mx-auto max-w-3xl space-y-6 rounded-[32px] border border-[color:var(--color-border-default)] bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.06),0_24px_60px_rgba(15,23,42,0.08)] md:p-10">
      <div className="space-y-3">
        <span className="inline-flex rounded-full border border-[color:var(--color-border-default)] bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-fg-muted)]">
          Link seguro
        </span>
        <h1 className="text-3xl font-semibold text-[color:var(--color-fg-default)]">{props.title}</h1>
        <p className="text-sm leading-7 text-[color:var(--color-fg-muted)]">{props.description}</p>
      </div>

      <div className="grid gap-4 rounded-[28px] border border-[color:var(--color-border-default)] bg-slate-50 p-5 md:grid-cols-2">
        <div>
          <p className="text-sm font-medium text-[color:var(--color-fg-muted)]">Negócio</p>
          <p className="mt-2 text-base font-semibold text-[color:var(--color-fg-default)]">{props.businessName}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-[color:var(--color-fg-muted)]">Serviço</p>
          <p className="mt-2 text-base font-semibold text-[color:var(--color-fg-default)]">{props.serviceName}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-[color:var(--color-fg-muted)]">Profissional</p>
          <p className="mt-2 text-base font-semibold text-[color:var(--color-fg-default)]">{props.professionalName}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-[color:var(--color-fg-muted)]">Horário atual</p>
          <p className="mt-2 text-base font-semibold text-[color:var(--color-fg-default)]">{props.startsAtLabel}</p>
        </div>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        {props.kind === "cancel" ? (
          <div className="space-y-2">
            <label className="text-sm font-medium text-[color:var(--color-fg-default)]" htmlFor="reason">
              Motivo do cancelamento
            </label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Se quiser, conte rapidamente o motivo."
            />
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[color:var(--color-fg-default)]" htmlFor="newDate">
                Nova data
              </label>
              <Input
                id="newDate"
                type="date"
                value={date}
                min={formatInTimeZone(new Date(), props.timezone, "yyyy-MM-dd")}
                onChange={(event) => setDate(event.target.value)}
              />
            </div>
            <div className="space-y-3 rounded-[24px] border border-[color:var(--color-border-default)] bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-[color:var(--color-fg-default)]">Horários disponíveis</p>
                {loading ? <span className="text-sm text-[color:var(--color-fg-muted)]">Carregando...</span> : null}
              </div>
              <div className="flex flex-wrap gap-3">
                {slots.map((slot) => (
                  <button
                    key={slot.startsAt}
                    type="button"
                    onClick={() => setSelectedStartsAt(slot.startsAt)}
                    className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                      selectedStartsAt === slot.startsAt
                        ? "border-[color:var(--color-brand-500)] bg-[color:var(--color-brand-500)] text-white"
                        : "border-[color:var(--color-border-default)] bg-white text-[color:var(--color-fg-default)]"
                    }`}
                  >
                    {slot.label}
                  </button>
                ))}
                {!loading && slots.length === 0 ? (
                  <p className="text-sm text-[color:var(--color-fg-muted)]">
                    Nenhum horário disponível para a data escolhida.
                  </p>
                ) : null}
              </div>
            </div>
          </>
        )}

        <p className="text-sm text-[color:var(--color-fg-muted)]">Link válido até {props.expiresAtLabel}.</p>

        {error ? (
          <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        ) : null}
        {message ? (
          <p className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {message}
          </p>
        ) : null}

        <Button className="w-full" disabled={submitting || (props.kind === "reschedule" && !selectedStartsAt)}>
          {submitting
            ? "Processando..."
            : props.kind === "cancel"
              ? "Cancelar agendamento"
              : "Confirmar novo horário"}
        </Button>
      </form>
    </section>
  );
}
