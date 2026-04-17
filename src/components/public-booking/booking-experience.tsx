"use client";

import { useEffect, useMemo, useState } from "react";
import { addDays } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { Star, MapPin, Phone, Clock, ChevronRight, Check, Calendar, Download, ShieldCheck } from "lucide-react";
import { cn, formatCurrencyBRL } from "@/lib/utils";

type BookingExperienceProps = {
  slug: string;
  timezone: string;
  name: string;
  description?: string | null;
  phone?: string | null;
  city?: string | null;
  neighborhood?: string | null;
  cancellationPolicyText?: string | null;
  logoUrl?: string | null;
  coverImageUrl?: string | null;
  brandPrimaryColor?: string | null;
  brandSecondaryColor?: string | null;
  services: Array<{
    id: string;
    name: string;
    description: string | null;
    durationMinutes: number;
    priceCents: number;
    colorHex: string | null;
    variants: Array<{
      id: string;
      name: string;
      durationMinutes: number;
      priceCents: number;
    }>;
  }>;
  professionals: Array<{
    id: string;
    displayName: string;
    roleLabel: string | null;
    photoUrl: string | null;
    services: Array<{ serviceId: string }>;
    availabilities: Array<{
      id: string;
      dayOfWeek: number;
      startMinutes: number;
      endMinutes: number;
      slotIntervalMinutes: number;
    }>;
  }>;
  reviews: Array<{
    id: string;
    rating: number;
    body: string | null;
    customerNameSnapshot: string;
  }>;
};

type AvailabilitySlot = { startsAt: string; endsAt: string; label: string };

const browserTZ =
  typeof Intl !== "undefined"
    ? Intl.DateTimeFormat().resolvedOptions().timeZone
    : "America/Sao_Paulo";

const weekdayLabels = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

function maskPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return digits.replace(/(\d{2})(\d+)/, "($1) $2");
  if (digits.length <= 10) return digits.replace(/(\d{2})(\d{4})(\d+)/, "($1) $2-$3");
  return digits.replace(/(\d{2})(\d{5})(\d+)/, "($1) $2-$3");
}

function formatMinutes(minutes: number) {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

function buildDateOptions(timezone: string) {
  return Array.from({ length: 7 }).map((_, index) => {
    const date = addDays(new Date(), index);
    return {
      value: formatInTimeZone(date, timezone, "yyyy-MM-dd"),
      shortLabel: formatInTimeZone(date, timezone, "EEE"),
      longLabel: formatInTimeZone(date, timezone, "dd/MM"),
    };
  });
}

function buildGoogleCalUrl(input: { title: string; details: string; location: string; startsAt: string; endsAt: string }) {
  const fmt = (v: string) => v.replace(/[-:]/g, "").replace(".000Z", "Z");
  return `https://calendar.google.com/calendar/render?${new URLSearchParams({ action: "TEMPLATE", text: input.title, details: input.details, location: input.location, dates: `${fmt(input.startsAt)}/${fmt(input.endsAt)}` })}`;
}

function buildIcs(input: { title: string; description: string; location: string; startsAt: string; endsAt: string }) {
  const fmt = (v: string) => v.replace(/[-:]/g, "").replace(".000Z", "Z");
  const content = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Zorby//PT-BR", "BEGIN:VEVENT", `DTSTART:${fmt(input.startsAt)}`, `DTEND:${fmt(input.endsAt)}`, `SUMMARY:${input.title}`, `DESCRIPTION:${input.description}`, `LOCATION:${input.location}`, "END:VEVENT", "END:VCALENDAR"].join("\n");
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(content)}`;
}

function Avatar({ name, photo, size = 40 }: { name: string; photo?: string | null; size?: number }) {
  const initials = name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  if (photo) return <img src={photo} alt={name} width={size} height={size} className="rounded-full object-cover" style={{ width: size, height: size }} />;
  return (
    <div className="flex items-center justify-center rounded-full bg-[var(--bk-accent-dim)] text-[var(--bk-accent)]" style={{ width: size, height: size, fontSize: size * 0.36, fontWeight: 600 }}>
      {initials}
    </div>
  );
}

function StepBadge({ n, active, done }: { n: number; active: boolean; done: boolean }) {
  return (
    <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold transition-all ${done ? "bg-[var(--bk-accent)] text-[var(--bk-accent-fg)]" : active ? "bg-[var(--bk-accent)] text-[var(--bk-accent-fg)]" : "bg-[var(--bk-border)] text-[var(--bk-muted)]"}`}>
      {done ? <Check size={11} strokeWidth={3} /> : n}
    </div>
  );
}

export function BookingExperience(props: BookingExperienceProps) {
  const accent = props.brandPrimaryColor ?? "#1664e8";
  const accentDim = `${accent}18`;
  const dateOptions = useMemo(() => buildDateOptions(props.timezone), [props.timezone]);

  const [serviceId, setServiceId] = useState(props.services[0]?.id ?? "");
  const [variantId, setVariantId] = useState("");
  const [proId, setProId] = useState("");
  const [date, setDate] = useState(dateOptions[0]?.value ?? "");
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [slot, setSlot] = useState<AvailabilitySlot | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<null | { appointmentId: string; startsAt: string; cancelToken: string; rescheduleToken: string }>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(true);

  const service = props.services.find((s) => s.id === serviceId) ?? null;
  const variant = service?.variants.find((v) => v.id === variantId) ?? null;
  const availableProfessionals = useMemo(() => {
    if (!serviceId) {
      return props.professionals.filter((professional) => professional.availabilities.length > 0);
    }

    return props.professionals.filter((professional) => {
      if (!professional.availabilities.length) return false;
      if (!professional.services.length) return true;
      return professional.services.some((serviceRelation) => serviceRelation.serviceId === serviceId);
    });
  }, [props.professionals, serviceId]);

  useEffect(() => {
    if (!availableProfessionals.length) {
      setProId("");
      return;
    }

    if (!availableProfessionals.some((professional) => professional.id === proId)) {
      setProId(availableProfessionals[0]?.id ?? "");
      setSlot(null);
    }
  }, [availableProfessionals, proId]);

  const professional = availableProfessionals.find((p) => p.id === proId) ?? null;
  const avgRating = props.reviews.length ? props.reviews.reduce((s, r) => s + r.rating, 0) / props.reviews.length : null;
  const weeklyAgenda = useMemo(() => {
    if (!professional?.availabilities.length) return [];
    return weekdayLabels
      .map((label, index) => {
        const daySlots = professional.availabilities.filter((item) => item.dayOfWeek === index);
        if (!daySlots.length) return null;
        return {
          label,
          value: daySlots
            .map((item) => `${formatMinutes(item.startMinutes)} às ${formatMinutes(item.endMinutes)}`)
            .join(" • "),
        };
      })
      .filter(Boolean) as Array<{ label: string; value: string }>;
  }, [professional]);

  const summary = useMemo(() => {
    if (!service || !professional) return null;
    return {
      serviceName: variant ? `${service.name} · ${variant.name}` : service.name,
      priceCents: variant?.priceCents ?? service.priceCents,
      durationMinutes: variant?.durationMinutes ?? service.durationMinutes,
      professionalName: professional.displayName,
    };
  }, [professional, service, variant]);

  // step tracking
  const step1Done = !!serviceId;
  const step2Done = !!slot;
  const step3Active = step1Done && step2Done;

  useEffect(() => {
    if (!serviceId || !proId || !date) { setSlots([]); return; }
    let cancelled = false;
    setLoadingSlots(true);
    setError(null);
    const params = new URLSearchParams({ date, serviceId, professionalId: proId, timezone: browserTZ });
    fetch(`/api/public/${props.slug}/availability?${params}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) {
          setSlots(data.slots ?? []);
          setSlot((cur) => data.slots?.find((s: AvailabilitySlot) => s.startsAt === cur?.startsAt) ?? null);
        }
      })
      .catch(() => { if (!cancelled) setError("Não foi possível carregar os horários."); })
      .finally(() => { if (!cancelled) setLoadingSlots(false); });
    return () => { cancelled = true; };
  }, [props.slug, date, proId, serviceId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!slot || !service || !professional) { setError("Escolha um horário disponível antes de confirmar."); return; }
    setSubmitting(true); setError(null);
    try {
      const res = await fetch(`/api/public/${props.slug}/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceId: service.id, serviceVariantId: variant?.id, professionalId: professional.id, startsAt: slot.startsAt, customerName: name, customerEmail: email, customerPhone: phone.replace(/\D/g, ""), customerTimezone: browserTZ, consent }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Não foi possível concluir o agendamento.");
      setSuccess(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao concluir.");
    } finally { setSubmitting(false); }
  }

  const location = [props.neighborhood, props.city].filter(Boolean).join(", ") || props.name;

  // ── Success screen ────────────────────────────────────────────────────────
  if (success && summary && slot) {
    const calTitle = `${summary.serviceName} com ${summary.professionalName}`;
    return (
      <div data-booking style={{ "--bk-accent": accent, "--bk-accent-dim": accentDim } as React.CSSProperties} className="min-h-screen px-4 py-10 md:py-16">
        <div className="mx-auto max-w-xl">
          {/* Logo */}
          {props.logoUrl && <img src={props.logoUrl} alt={props.name} className="mb-8 h-9 object-contain" />}

          <div className="rounded-2xl border border-[var(--bk-border)] bg-[var(--bk-surface)] p-7 shadow-[0_2px_32px_rgba(0,0,0,0.07)]">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--bk-accent)]">
              <Check size={22} className="text-white" strokeWidth={2.5} />
            </div>
            <h1 className="mt-4 text-2xl font-semibold text-[var(--bk-text)]">Agendamento confirmado!</h1>
            <p className="mt-2 text-sm leading-6 text-[var(--bk-muted)]">Seu horário está reservado. Veja os detalhes abaixo.</p>

            <div className="mt-6 space-y-3 rounded-xl border border-[var(--bk-border)] bg-[var(--bk-bg)] p-4 text-sm">
              {[
                ["Serviço", summary.serviceName],
                ["Profissional", summary.professionalName],
                ["Data e hora", formatInTimeZone(success.startsAt, browserTZ, "dd/MM/yyyy 'às' HH:mm")],
                ["Valor", formatCurrencyBRL(summary.priceCents)],
                ["Duração", `${summary.durationMinutes} min`],
              ].map(([label, value]) => (
                <div key={label} className="flex items-start justify-between gap-4">
                  <span className="text-[var(--bk-muted)]">{label}</span>
                  <span className="text-right font-medium text-[var(--bk-text)]">{value}</span>
                </div>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <a href={buildGoogleCalUrl({ title: calTitle, details: `Agendamento em ${props.name}.`, location, startsAt: success.startsAt, endsAt: slot.endsAt })} target="_blank" rel="noreferrer">
                <button type="button" className="flex items-center gap-2 rounded-full border border-[var(--bk-border)] bg-[var(--bk-surface)] px-4 py-2.5 text-sm font-medium text-[var(--bk-text)] transition hover:border-[var(--bk-border-2)]">
                  <Calendar size={14} /> Google Agenda
                </button>
              </a>
              <a href={buildIcs({ title: calTitle, description: `Agendamento em ${props.name}.`, location, startsAt: success.startsAt, endsAt: slot.endsAt })} download="agendamento.ics">
                <button type="button" className="flex items-center gap-2 rounded-full border border-[var(--bk-border)] bg-[var(--bk-surface)] px-4 py-2.5 text-sm font-medium text-[var(--bk-text)] transition hover:border-[var(--bk-border-2)]">
                  <Download size={14} /> Apple Calendar
                </button>
              </a>
            </div>

            <div className="mt-4 flex flex-wrap gap-3 border-t border-[var(--bk-border)] pt-4 text-sm">
              <a href={`/cancelar/${success.cancelToken}`} className="text-[var(--bk-muted)] underline-offset-2 hover:underline">Cancelar agendamento</a>
              <span className="text-[var(--bk-faint)]">·</span>
              <a href={`/reagendar/${success.rescheduleToken}`} className="text-[var(--bk-muted)] underline-offset-2 hover:underline">Reagendar</a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Main booking page ─────────────────────────────────────────────────────
  return (
    <div data-booking style={{ "--bk-accent": accent, "--bk-accent-dim": accentDim } as React.CSSProperties} className="min-h-screen">
      {/* Cover / Hero */}
      <div className="relative h-44 w-full overflow-hidden bg-[var(--bk-border)] md:h-56" style={{ background: `linear-gradient(135deg, ${accent}22 0%, ${accent}08 100%)` }}>
        {props.coverImageUrl && (
          <img src={props.coverImageUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bk-bg)] via-transparent to-transparent" />
      </div>

      <div className="relative mx-auto max-w-5xl px-4 pb-16 md:px-6">
        {/* Business header */}
        <div className="-mt-8 mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-end gap-4">
            {props.logoUrl ? (
              <img src={props.logoUrl} alt={props.name} className="h-16 w-16 rounded-2xl border-4 border-[var(--bk-bg)] object-cover shadow-md" />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-4 border-[var(--bk-bg)] shadow-md text-xl font-bold text-[var(--bk-accent-fg)]" style={{ background: accent }}>
                {props.name[0]}
              </div>
            )}
            <div className="pb-1">
              <h1 className="text-xl font-semibold text-[var(--bk-text)]">{props.name}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-[var(--bk-muted)]">
                {location && <span className="flex items-center gap-1"><MapPin size={12} />{location}</span>}
                {props.phone && <span className="flex items-center gap-1"><Phone size={12} />{props.phone}</span>}
                {avgRating && (
                  <span className="flex items-center gap-1">
                    <Star size={12} className="fill-amber-400 text-amber-400" />
                    {avgRating.toFixed(1)} ({props.reviews.length})
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {props.description && (
          <p className="mb-8 max-w-2xl text-sm leading-7 text-[var(--bk-muted)]">{props.description}</p>
        )}

        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          {/* Left: steps */}
          <div className="space-y-5">
            {/* Step 1 — Serviço */}
            <section className="rounded-2xl border border-[var(--bk-border)] bg-[var(--bk-surface)] p-5 shadow-[0_1px_8px_rgba(0,0,0,0.05)]">
              <div className="mb-4 flex items-center gap-3">
                <StepBadge n={1} active={true} done={step1Done} />
                <h2 className="text-sm font-semibold text-[var(--bk-text)]">Escolha o serviço</h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {props.services.map((svc) => {
                  const selected = serviceId === svc.id;
                  return (
                    <button
                      key={svc.id}
                      type="button"
                      onClick={() => { setServiceId(svc.id); setVariantId(""); setSlot(null); }}
                      className={`rounded-xl border p-4 text-left transition-all ${selected ? "border-[var(--bk-accent)] bg-[var(--bk-accent-dim)] shadow-[0_0_0_1px_var(--bk-accent)]" : "border-[var(--bk-border)] hover:border-[var(--bk-border-2)] hover:bg-[var(--bk-bg)]"}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm font-semibold text-[var(--bk-text)]">{svc.name}</span>
                        {selected && <Check size={14} className="mt-0.5 shrink-0 text-[var(--bk-accent)]" />}
                      </div>
                      {svc.description && <p className="mt-1 text-xs leading-5 text-[var(--bk-muted)]">{svc.description}</p>}
                      <div className="mt-3 flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1 text-[var(--bk-muted)]"><Clock size={11} />{svc.durationMinutes} min</span>
                        <span className="font-semibold text-[var(--bk-text)]">{formatCurrencyBRL(svc.priceCents)}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {service?.variants.length ? (
                <div className="mt-4">
                  <label className="mb-1.5 block text-xs font-medium text-[var(--bk-muted)]">Variação</label>
                  <select value={variantId} onChange={(e) => setVariantId(e.target.value)} className="h-10 w-full rounded-xl border border-[var(--bk-border)] bg-[var(--bk-bg)] px-3 text-sm text-[var(--bk-text)] focus:border-[var(--bk-accent)] focus:outline-none">
                    <option value="">Padrão</option>
                    {service.variants.map((v) => (
                      <option key={v.id} value={v.id}>{v.name} — {v.durationMinutes} min — {formatCurrencyBRL(v.priceCents)}</option>
                    ))}
                  </select>
                </div>
              ) : null}
            </section>

            {/* Step 2 — Data e hora */}
            <section className="rounded-2xl border border-[var(--bk-border)] bg-[var(--bk-surface)] p-5 shadow-[0_1px_8px_rgba(0,0,0,0.05)]">
              <div className="mb-4 flex items-center gap-3">
                <StepBadge n={2} active={step1Done} done={step2Done} />
                <h2 className="text-sm font-semibold text-[var(--bk-text)]">Escolha data e profissional</h2>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[var(--bk-muted)]">Profissional</label>
                  <div className="space-y-2">
                    {availableProfessionals.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => { setProId(p.id); setSlot(null); }}
                        className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all ${proId === p.id ? "border-[var(--bk-accent)] bg-[var(--bk-accent-dim)]" : "border-[var(--bk-border)] hover:border-[var(--bk-border-2)]"}`}
                      >
                        <Avatar name={p.displayName} photo={p.photoUrl} size={32} />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-[var(--bk-text)]">{p.displayName}</p>
                          {p.roleLabel && <p className="truncate text-xs text-[var(--bk-muted)]">{p.roleLabel}</p>}
                        </div>
                        {proId === p.id && <Check size={13} className="ml-auto shrink-0 text-[var(--bk-accent)]" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[var(--bk-muted)]">Data</label>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-1 lg:grid-cols-2">
                    {dateOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          setDate(option.value);
                          setSlot(null);
                        }}
                        className={cn(
                          "rounded-xl border px-3 py-3 text-left transition-all",
                          date === option.value
                            ? "border-[var(--bk-accent)] bg-[var(--bk-accent)] text-[var(--bk-accent-fg)]"
                            : "border-[var(--bk-border)] bg-[var(--bk-bg)] hover:border-[var(--bk-border-2)]",
                        )}
                      >
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] opacity-70">
                          {option.shortLabel}
                        </p>
                        <p className="mt-1 text-sm font-semibold">{option.longLabel}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Horários */}
              <div className="mt-4">
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-xs font-medium text-[var(--bk-muted)]">Horários disponíveis</label>
                  {loadingSlots && <span className="text-xs text-[var(--bk-faint)]">Carregando...</span>}
                </div>
                <div className="flex flex-wrap gap-2">
                  {slots.map((s) => (
                    <button
                      key={s.startsAt}
                      type="button"
                      onClick={() => setSlot(s)}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${slot?.startsAt === s.startsAt ? "text-[var(--bk-accent-fg)] shadow-[0_0_0_1px_var(--bk-accent)]" : "border border-[var(--bk-border)] bg-[var(--bk-bg)] text-[var(--bk-text)] hover:border-[var(--bk-accent)]"}`}
                      style={slot?.startsAt === s.startsAt ? { background: accent } : {}}
                    >
                      {s.label}
                    </button>
                  ))}
                  {!loadingSlots && slots.length === 0 && (
                    <p className="text-sm text-[var(--bk-muted)]">Nenhum horário livre. Tente outra data ou outro profissional.</p>
                  )}
                </div>
              </div>

              <div className="mt-5 rounded-xl border border-[var(--bk-border)] bg-[var(--bk-bg)] p-4">
                <div className="mb-3 flex items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--bk-accent-dim)] text-[var(--bk-accent)]">
                    <ShieldCheck size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--bk-text)]">Agenda definida pelo profissional</p>
                    <p className="mt-1 text-sm leading-6 text-[var(--bk-muted)]">
                      O cliente escolhe apenas entre horários que o profissional deixou disponíveis.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  {weeklyAgenda.length ? (
                    weeklyAgenda.map((item) => (
                      <div key={item.label} className="rounded-xl border border-[var(--bk-border)] bg-[var(--bk-surface)] px-4 py-3">
                        <p className="text-sm font-semibold text-[var(--bk-text)]">{item.label}</p>
                        <p className="mt-1 text-sm leading-6 text-[var(--bk-muted)]">{item.value}</p>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-xl border border-[var(--bk-border)] bg-[var(--bk-surface)] px-4 py-3 text-sm text-[var(--bk-muted)]">
                      Esse profissional ainda não tem agenda pública configurada.
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>

          {/* Right: confirmation form */}
          <aside className="space-y-4">
            <div className="rounded-2xl border border-[var(--bk-border)] bg-[var(--bk-surface)] p-5 shadow-[0_1px_8px_rgba(0,0,0,0.05)] lg:sticky lg:top-6">
              <div className="mb-4 flex items-center gap-3">
                <StepBadge n={3} active={step3Active} done={false} />
                <h2 className="text-sm font-semibold text-[var(--bk-text)]">Confirme seus dados</h2>
              </div>

              {/* Summary */}
              {summary ? (
                <div className="mb-4 rounded-xl border border-[var(--bk-border)] bg-[var(--bk-bg)] p-3.5 text-sm">
                  <div className="flex justify-between gap-3">
                    <span className="font-medium text-[var(--bk-text)]">{summary.serviceName}</span>
                    <span className="font-semibold text-[var(--bk-text)]">{formatCurrencyBRL(summary.priceCents)}</span>
                  </div>
                  <div className="mt-1.5 flex justify-between gap-3 text-xs text-[var(--bk-muted)]">
                    <span>{summary.professionalName}</span>
                    <span>{summary.durationMinutes} min</span>
                  </div>
                  {slot && (
                    <div className="mt-2 flex items-center gap-1.5 rounded-lg border border-[var(--bk-accent)] bg-[var(--bk-accent-dim)] px-2.5 py-1.5 text-xs font-medium" style={{ color: accent }}>
                      <Clock size={11} />
                      {formatInTimeZone(slot.startsAt, browserTZ, "dd/MM 'às' HH:mm")}
                    </div>
                  )}
                </div>
              ) : (
                <div className="mb-4 rounded-xl border border-[var(--bk-border)] bg-[var(--bk-bg)] px-3.5 py-3 text-sm text-[var(--bk-muted)]">
                  Selecione serviço e horário para ver o resumo.
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3">
                {[
                  { id: "bk-name", label: "Nome completo", value: name, onChange: (v: string) => setName(v), placeholder: "Seu nome", required: true, type: "text" },
                  { id: "bk-email", label: "E-mail", value: email, onChange: (v: string) => setEmail(v), placeholder: "voce@email.com", required: false, type: "email" },
                  { id: "bk-phone", label: "Telefone", value: phone, onChange: (v: string) => setPhone(maskPhone(v)), placeholder: "(11) 99999-0000", required: true, type: "tel" },
                ].map((field) => (
                  <div key={field.id}>
                    <label htmlFor={field.id} className="mb-1 block text-xs font-medium text-[var(--bk-muted)]">{field.label}</label>
                    <input
                      id={field.id}
                      type={field.type}
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value)}
                      placeholder={field.placeholder}
                      required={field.required}
                      className="h-10 w-full rounded-xl border border-[var(--bk-border)] bg-[var(--bk-bg)] px-3 text-sm text-[var(--bk-text)] placeholder:text-[var(--bk-faint)] focus:border-[var(--bk-accent)] focus:outline-none transition-colors"
                    />
                  </div>
                ))}

                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[var(--bk-border)] bg-[var(--bk-bg)] p-3 text-xs leading-5 text-[var(--bk-muted)]">
                  <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 accent-[var(--bk-accent)]" />
                  Autorizo o uso dos meus dados para este agendamento e confirmações.
                </label>

                {props.cancellationPolicyText && (
                  <div className="rounded-xl border border-[var(--bk-border)] bg-[var(--bk-bg)] p-3 text-xs leading-5 text-[var(--bk-muted)]">
                    <p className="mb-1 font-medium text-[var(--bk-text)]">Política de cancelamento</p>
                    {props.cancellationPolicyText}
                  </div>
                )}

                {error && <p className="rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-xs text-red-600">{error}</p>}

                <button
                  type="submit"
                  disabled={submitting || !slot || !consent}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-full text-sm font-semibold text-[var(--bk-accent-fg)] transition-all disabled:opacity-40"
                  style={{ background: accent }}
                >
                  {submitting ? "Confirmando..." : (<><ChevronRight size={16} /> Confirmar agendamento</>)}
                </button>
              </form>
            </div>

            {/* Reviews */}
            {props.reviews.length > 0 && (
              <div className="rounded-2xl border border-[var(--bk-border)] bg-[var(--bk-surface)] p-5 shadow-[0_1px_8px_rgba(0,0,0,0.05)]">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-[var(--bk-text)]">Avaliações</h3>
                  {avgRating && (
                    <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                      <Star size={11} className="fill-current" />{avgRating.toFixed(1)}
                    </span>
                  )}
                </div>
                <div className="space-y-3">
                  {props.reviews.slice(0, 3).map((r) => (
                    <div key={r.id} className="rounded-xl border border-[var(--bk-border)] bg-[var(--bk-bg)] p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-medium text-[var(--bk-text)]">{r.customerNameSnapshot}</p>
                        <div className="flex gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} size={10} className={i < r.rating ? "fill-amber-400 text-amber-400" : "text-[var(--bk-border-2)]"} />
                          ))}
                        </div>
                      </div>
                      {r.body && <p className="mt-1.5 text-xs leading-5 text-[var(--bk-muted)]">{r.body}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
