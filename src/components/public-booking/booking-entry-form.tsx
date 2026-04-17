"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CalendarSearch, Link2, Store } from "lucide-react";

function normalizeDestination(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";

  try {
    const parsed = new URL(trimmed);
    const path = parsed.pathname.replace(/^\/+|\/+$/g, "");
    return path || "";
  } catch {
    return trimmed.replace(/^\/+|\/+$/g, "");
  }
}

export function BookingEntryForm() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const preview = useMemo(() => normalizeDestination(value), [value]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const destination = normalizeDestination(value);

    if (!destination) {
      setError("Informe o link ou o nome do negócio para continuar.");
      return;
    }

    setError(null);
    router.push(`/${destination}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[28px] border border-[color:var(--color-border-default)] bg-white/95 p-6 shadow-[0_20px_50px_rgba(15,23,42,0.08)] backdrop-blur md:p-8"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[color:var(--color-brand-500)]">
          <CalendarSearch className="size-5" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-fg-muted)]">
            Cliente final
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[color:var(--color-fg-default)]">
            Quero agendar um serviço
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[color:var(--color-fg-muted)]">
            Cole o link que a empresa enviou ou digite o nome do negócio para abrir a página de agendamento.
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_260px]">
        <div className="space-y-4">
          <label
            htmlFor="booking-entry"
            className="text-sm font-medium text-[color:var(--color-fg-default)]"
          >
            Link ou identificador do agendamento
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[color:var(--color-fg-subtle)]">
              <Link2 className="size-4" />
            </span>
            <input
              id="booking-entry"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder="Ex.: https://zorby-web.onrender.com/cortess ou cortess"
              className="h-14 w-full rounded-2xl border border-[color:var(--color-border-default)] bg-[color:var(--color-surface-muted)] pl-11 pr-4 text-sm text-[color:var(--color-fg-default)] placeholder:text-[color:var(--color-fg-subtle)] focus:border-[color:var(--color-brand-500)] focus:bg-white focus:outline-none"
            />
          </div>

          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[color:var(--color-brand-500)] px-6 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(22,100,232,0.22)] transition hover:bg-[color:var(--color-brand-600)]"
          >
            Abrir página de agendamento
            <ArrowRight className="size-4" />
          </button>
        </div>

        <aside className="rounded-[24px] border border-[color:var(--color-border-default)] bg-[linear-gradient(180deg,#f8fbff_0%,#eef5ff_100%)] p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-[color:var(--color-brand-500)] shadow-[0_12px_24px_rgba(15,23,42,0.06)]">
              <Store className="size-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[color:var(--color-fg-default)]">
                Como encontrar
              </p>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-[color:var(--color-fg-muted)]">
                <li>Use o link enviado pela empresa.</li>
                <li>Ou digite o identificador do negócio.</li>
                <li>Exemplo: `cortess` abre `/{preview || "nome-do-negocio"}`.</li>
              </ul>
            </div>
          </div>
        </aside>
      </div>
    </form>
  );
}
