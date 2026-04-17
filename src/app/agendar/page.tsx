import Link from "next/link";
import { BookingEntryForm } from "@/components/public-booking/booking-entry-form";

export default function BookingEntryPage() {
  return (
    <main className="relative flex flex-1 flex-col overflow-hidden bg-[linear-gradient(180deg,#edf4ff_0%,#f7faff_48%,#eef4ff_100%)] px-4 py-10 md:px-6 md:py-16">
      <div className="pointer-events-none absolute left-1/2 top-[-220px] h-[620px] w-[960px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(37,99,235,0.16)_0%,transparent_64%)]" />

      <div className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-fg-muted)]">
              Jornada do cliente
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[color:var(--color-fg-default)]">
              Aqui entra quem quer reservar um horário
            </h2>
          </div>

          <Link
            href="/login"
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-[color:var(--color-border-default)] bg-white/92 px-5 text-sm font-semibold text-[color:var(--color-fg-default)] shadow-[var(--shadow-sm)] transition hover:border-[color:var(--color-border-strong)] hover:bg-white"
          >
            Sou empresa ou profissional
          </Link>
        </div>

        <BookingEntryForm />
      </div>
    </main>
  );
}
