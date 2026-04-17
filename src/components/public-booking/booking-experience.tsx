"use client";

import { useEffect, useMemo, useState } from "react";
import { addDays } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import {
  Star,
  MapPin,
  Phone,
  Clock,
  ChevronRight,
  Check,
  Calendar,
  Download,
  ShieldCheck,
  Scissors,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";
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
  const ptDayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const ptMonthNames = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  return Array.from({ length: 14 }).map((_, index) => {
    const date = addDays(new Date(), index);
    const isoValue = formatInTimeZone(date, timezone, "yyyy-MM-dd");
    const dayName = ptDayNames[date.getDay()];
    const dayNum = date.getDate();
    const monthName = ptMonthNames[date.getMonth()];
    return { value: isoValue, dayName, dayNum, monthName, isToday: index === 0, isTomorrow: index === 1 };
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
  if (photo)
    return <img src={photo} alt={name} width={size} height={size} className="rounded-full object-cover flex-shrink-0" style={{ width: size, height: size }} />;
  return (
    <div className="bk-avatar flex items-center justify-center rounded-full flex-shrink-0" style={{ width: size, height: size, fontSize: size * 0.36, fontWeight: 700 }}>
      {initials}
    </div>
  );
}

function StepHeader({ n, label, done, active }: { n: number; label: string; done: boolean; active: boolean }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className={cn("flex items-center justify-center rounded-full text-xs font-bold transition-all", done ? "bk-step-done" : active ? "bk-step-active" : "bk-step-idle")} style={{ width: 28, height: 28 }}>
        {done ? <Check size={13} strokeWidth={3} /> : n}
      </div>
      <h2 className="bk-text text-sm font-bold">{label}</h2>
      {done && <span className="ml-auto text-xs font-semibold" style={{ color: "var(--bk-accent)" }}>✓ Pronto</span>}
    </div>
  );
}

function StarRating({ rating, count }: { rating: number; count: number }) {
  return (
    <span className="bk-rating-badge inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold">
      <Star size={11} className="fill-current" />
      {rating.toFixed(1)}
      <span className="font-normal opacity-70">({count})</span>
    </span>
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
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [mobileStep, setMobileStep] = useState<"booking" | "form">("booking");

  const service = props.services.find((s) => s.id === serviceId) ?? null;
  const variant = service?.variants.find((v) => v.id === variantId) ?? null;

  const availableProfessionals = useMemo(() => {
    if (!serviceId) return props.professionals.filter((p) => p.availabilities.length > 0);
    return props.professionals.filter((p) => {
      if (!p.availabilities.length) return false;
      if (!p.services.length) return true;
      return p.services.some((s) => s.serviceId === serviceId);
    });
  }, [props.professionals, serviceId]);

  useEffect(() => {
    if (!availableProfessionals.length) { setProId(""); return; }
    if (!availableProfessionals.some((p) => p.id === proId)) {
      setProId(availableProfessionals[0]?.id ?? "");
      setSlot(null);
    }
  }, [availableProfessionals, proId]);

  const professional = availableProfessionals.find((p) => p.id === proId) ?? null;
  const avgRating = props.reviews.length ? props.reviews.reduce((s, r) => s + r.rating, 0) / props.reviews.length : null;

  const weeklyAgenda = useMemo(() => {
    if (!professional?.availabilities.length) return [];
    return weekdayLabels.map((label, index) => {
      const daySlots = professional.availabilities.filter((item) => item.dayOfWeek === index);
      if (!daySlots.length) return null;
      return { label, value: daySlots.map((item) => `${formatMinutes(item.startMinutes)} – ${formatMinutes(item.endMinutes)}`).join(" • ") };
    }).filter(Boolean) as Array<{ label: string; value: string }>;
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
  const displayedReviews = showAllReviews ? props.reviews : props.reviews.slice(0, 3);

  // ── SUCCESS SCREEN ────────────────────────────────────────────────────────
  if (success && summary && slot) {
    const calTitle = `${summary.serviceName} com ${summary.professionalName}`;
    return (
      <div data-booking className="min-h-screen px-4 py-10 md:py-20 flex items-start justify-center" style={{ "--bk-accent": accent, "--bk-accent-dim": accentDim } as React.CSSProperties}>
        <div className="w-full max-w-md">
          {props.logoUrl && <img src={props.logoUrl} alt={props.name} className="h-9 object-contain mb-8" />}
          <div className="bk-card rounded-3xl p-8">
            <div className="flex items-center justify-center rounded-full mb-6" style={{ width: 56, height: 56, background: accent }}>
              <Check size={24} className="text-white" strokeWidth={2.5} />
            </div>
            <h1 className="bk-text text-2xl font-black mb-2">Agendamento confirmado!</h1>
            <p className="bk-muted text-sm leading-6 mb-8">Seu horário está reservado. Confira os detalhes abaixo.</p>
            <div className="bk-summary-box rounded-2xl overflow-hidden mb-6 space-y-0">
              {[
                ["Serviço", summary.serviceName],
                ["Profissional", summary.professionalName],
                ["Data e hora", formatInTimeZone(success.startsAt, browserTZ, "dd/MM/yyyy 'às' HH:mm")],
                ["Valor", formatCurrencyBRL(summary.priceCents)],
                ["Duração", `${summary.durationMinutes} min`],
              ].map(([label, value], i) => (
                <div key={label} className={cn("flex items-start justify-between gap-4 px-4 py-3.5 text-sm", i !== 0 && "bk-divider-top")}>
                  <span className="bk-muted">{label}</span>
                  <span className="bk-text text-right font-semibold">{value}</span>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-3 mb-6">
              <a href={buildGoogleCalUrl({ title: calTitle, details: `Agendamento em ${props.name}.`, location, startsAt: success.startsAt, endsAt: slot.endsAt })} target="_blank" rel="noreferrer">
                <button type="button" className="bk-cal-btn flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium"><Calendar size={14} /> Google Agenda</button>
              </a>
              <a href={buildIcs({ title: calTitle, description: `Agendamento em ${props.name}.`, location, startsAt: success.startsAt, endsAt: slot.endsAt })} download="agendamento.ics">
                <button type="button" className="bk-cal-btn flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium"><Download size={14} /> Apple Calendar</button>
              </a>
            </div>
            <div className="flex gap-4 text-xs pt-5 bk-divider-top">
              <a href={`/cancelar/${success.cancelToken}`} className="bk-muted hover:underline underline-offset-2">Cancelar agendamento</a>
              <span className="bk-faint">·</span>
              <a href={`/reagendar/${success.rescheduleToken}`} className="bk-muted hover:underline underline-offset-2">Reagendar</a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── MAIN BOOKING PAGE ─────────────────────────────────────────────────────
  return (
    <div data-booking className="min-h-screen" style={{ "--bk-accent": accent, "--bk-accent-dim": accentDim } as React.CSSProperties}>

      {/* HERO */}
      <div className="bk-hero relative w-full overflow-hidden" style={{ height: 220 }}>
        {props.coverImageUrl ? (
          <img src={props.coverImageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${accent}55 0%, ${accent}22 100%)` }} />
        )}
        <div className="bk-hero-overlay absolute inset-0" />
      </div>

      <div className="relative mx-auto max-w-5xl px-4 pb-24 md:px-6">

        {/* BUSINESS HEADER */}
        <div className="-mt-10 mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-end gap-4">
            <div className="bk-logo-frame">
              {props.logoUrl ? (
                <img src={props.logoUrl} alt={props.name} className="bk-logo-img rounded-2xl object-cover" style={{ width: 76, height: 76 }} />
              ) : (
                <div className="flex items-center justify-center rounded-2xl text-2xl font-black text-white" style={{ width: 76, height: 76, background: accent }}>{props.name[0]}</div>
              )}
            </div>
            <div className="pb-1">
              <h1 className="bk-text text-xl font-black tracking-tight">{props.name}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-1.5">
                {location && <span className="bk-muted flex items-center gap-1.5 text-sm"><MapPin size={13} style={{ color: accent }} />{location}</span>}
                {props.phone && <span className="bk-muted flex items-center gap-1.5 text-sm"><Phone size={13} style={{ color: accent }} />{props.phone}</span>}
                {avgRating && <StarRating rating={avgRating} count={props.reviews.length} />}
              </div>
            </div>
          </div>
        </div>

        {props.description && <p className="bk-muted text-sm leading-7 mb-8 max-w-2xl">{props.description}</p>}

        {/* MOBILE TABS */}
        <div className="bk-mobile-tabs flex rounded-xl overflow-hidden mb-6 lg:hidden">
          <button type="button" onClick={() => setMobileStep("booking")} className={cn("bk-mobile-tab flex-1 py-3 text-sm font-bold transition-all", mobileStep === "booking" ? "bk-mobile-tab-active" : "")}>
            1. Serviço &amp; Horário
          </button>
          <button type="button" onClick={() => step1Done && step2Done && setMobileStep("form")} className={cn("bk-mobile-tab flex-1 py-3 text-sm font-bold transition-all", mobileStep === "form" ? "bk-mobile-tab-active" : "", (!step1Done || !step2Done) && "opacity-40")}>
            2. Seus dados
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">

          {/* LEFT */}
          <div className={cn("space-y-5", mobileStep === "form" && "hidden lg:block")}>

            {/* STEP 1 */}
            <section className="bk-card rounded-2xl p-6">
              <StepHeader n={1} label="Escolha o serviço" done={step1Done} active={true} />
              <div className="grid gap-3 sm:grid-cols-2">
                {props.services.map((svc) => {
                  const selected = serviceId === svc.id;
                  return (
                    <button key={svc.id} type="button" onClick={() => { setServiceId(svc.id); setVariantId(""); setSlot(null); }} className={cn("bk-service-card rounded-xl p-4 text-left transition-all relative overflow-hidden", selected ? "bk-service-card-selected" : "")}>
                      {selected && <div className="absolute top-0 left-0 bottom-0 w-[3px] rounded-l-xl" style={{ background: accent }} />}
                      <div className="flex items-start justify-between gap-2 pl-2">
                        <span className="bk-text text-sm font-bold leading-snug">{svc.name}</span>
                        {selected && <div className="flex-shrink-0 flex items-center justify-center rounded-full w-5 h-5" style={{ background: accent }}><Check size={11} className="text-white" strokeWidth={3} /></div>}
                      </div>
                      {svc.description && <p className="bk-muted mt-1.5 text-xs leading-5 pl-2">{svc.description}</p>}
                      <div className="mt-3 flex items-center justify-between pl-2">
                        <span className="bk-muted flex items-center gap-1 text-xs"><Clock size={11} />{svc.durationMinutes} min</span>
                        <span className="text-sm font-black" style={{ color: selected ? accent : "var(--bk-text)" }}>{formatCurrencyBRL(svc.priceCents)}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
              {service?.variants.length ? (
                <div className="mt-4">
                  <label className="bk-field-label block mb-1.5">Variação</label>
                  <select value={variantId} onChange={(e) => setVariantId(e.target.value)} className="bk-select w-full h-11 rounded-xl px-3 text-sm">
                    <option value="">Padrão</option>
                    {service.variants.map((v) => <option key={v.id} value={v.id}>{v.name} — {v.durationMinutes} min — {formatCurrencyBRL(v.priceCents)}</option>)}
                  </select>
                </div>
              ) : null}
            </section>

            {/* STEP 2 */}
            <section className="bk-card rounded-2xl p-6">
              <StepHeader n={2} label="Profissional, data e horário" done={step2Done} active={step1Done} />

              {availableProfessionals.length > 0 && (
                <div className="mb-5">
                  <p className="bk-field-label block mb-2">Profissional</p>
                  <div className="flex flex-wrap gap-2">
                    {availableProfessionals.map((p) => (
                      <button key={p.id} type="button" onClick={() => { setProId(p.id); setSlot(null); }} className={cn("bk-pro-chip flex items-center gap-2.5 rounded-full px-3.5 py-2 transition-all", proId === p.id ? "bk-pro-chip-selected" : "")} style={proId === p.id ? { borderColor: accent, color: accent, background: `${accent}12` } : {}}>
                        <Avatar name={p.displayName} photo={p.photoUrl} size={26} />
                        <div className="text-left">
                          <p className="text-xs font-bold leading-tight">{p.displayName}</p>
                          {p.roleLabel && <p className="text-[10px] leading-tight opacity-60">{p.roleLabel}</p>}
                        </div>
                        {proId === p.id && <Check size={12} strokeWidth={3} style={{ color: accent }} />}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mb-5">
                <p className="bk-field-label block mb-2">Data</p>
                <div className="flex gap-2 overflow-x-auto pb-1 bk-scroll-hide">
                  {dateOptions.map((opt) => (
                    <button key={opt.value} type="button" onClick={() => { setDate(opt.value); setSlot(null); }} className={cn("bk-date-chip flex-shrink-0 flex flex-col items-center justify-center rounded-2xl transition-all", date === opt.value ? "bk-date-chip-selected" : "")} style={date === opt.value ? { background: accent, color: "#fff", borderColor: accent } : {}}>
                      <span className="text-[10px] font-bold uppercase tracking-wider leading-tight opacity-75">{opt.isToday ? "Hoje" : opt.isTomorrow ? "Amanhã" : opt.dayName}</span>
                      <span className="text-base font-black leading-snug">{opt.dayNum}</span>
                      <span className="text-[10px] leading-tight opacity-70">{opt.monthName}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="bk-field-label">Horários disponíveis</p>
                  {loadingSlots && <span className="bk-faint text-xs animate-pulse">Carregando...</span>}
                </div>
                {!loadingSlots && slots.length === 0 ? (
                  <div className="bk-no-slots rounded-xl p-4 text-sm text-center">Nenhum horário disponível. Tente outra data.</div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {slots.map((s) => {
                      const selected = slot?.startsAt === s.startsAt;
                      return (
                        <button key={s.startsAt} type="button" onClick={() => setSlot(s)} className={cn("bk-slot-chip rounded-full px-4 py-2 text-sm font-bold transition-all", selected ? "bk-slot-selected" : "")} style={selected ? { background: accent, color: "#fff", borderColor: accent } : {}}>
                          {s.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {weeklyAgenda.length > 0 && (
                <div className="mt-5">
                  <button type="button" onClick={() => setShowSchedule((v) => !v)} className="flex items-center gap-2 text-xs font-bold" style={{ color: accent }}>
                    <ShieldCheck size={13} />
                    Ver funcionamento semanal
                    {showSchedule ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  </button>
                  {showSchedule && (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {weeklyAgenda.map((item) => (
                        <div key={item.label} className="bk-schedule-row rounded-xl px-3.5 py-2.5">
                          <p className="bk-text text-xs font-bold">{item.label}</p>
                          <p className="bk-muted text-xs mt-0.5">{item.value}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* REVIEWS */}
            {props.reviews.length > 0 && (
              <section className="bk-card rounded-2xl p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="bk-text text-sm font-black">Avaliações</h3>
                  {avgRating && <StarRating rating={avgRating} count={props.reviews.length} />}
                </div>
                <div className="flex items-center gap-6 mb-5 pb-5 bk-divider-bottom">
                  <div className="text-center flex-shrink-0">
                    <div className="bk-text text-4xl font-black">{avgRating?.toFixed(1)}</div>
                    <div className="flex gap-0.5 mt-1 justify-center">
                      {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={12} className={i < Math.round(avgRating ?? 0) ? "fill-amber-400 text-amber-400" : "text-stone-200"} />)}
                    </div>
                    <p className="bk-muted text-xs mt-1">{props.reviews.length} avaliações</p>
                  </div>
                  <div className="flex-1 space-y-1.5">
                    {[5, 4, 3, 2, 1].map((star) => {
                      const count = props.reviews.filter((r) => r.rating === star).length;
                      const pct = props.reviews.length ? (count / props.reviews.length) * 100 : 0;
                      return (
                        <div key={star} className="flex items-center gap-2">
                          <span className="bk-muted text-xs w-2">{star}</span>
                          <div className="bk-bar-bg flex-1 rounded-full h-1.5 overflow-hidden"><div className="h-full rounded-full" style={{ width: `${pct}%`, background: pct > 0 ? "#fbbf24" : "transparent" }} /></div>
                          <span className="bk-faint text-[10px] w-4 text-right">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="space-y-3">
                  {displayedReviews.map((r) => (
                    <div key={r.id} className="bk-review-card rounded-xl p-4">
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2.5">
                          <div className="bk-avatar flex items-center justify-center rounded-full text-xs font-bold" style={{ width: 30, height: 30 }}>{r.customerNameSnapshot[0].toUpperCase()}</div>
                          <p className="bk-text text-xs font-bold">{r.customerNameSnapshot}</p>
                        </div>
                        <div className="flex gap-0.5">{Array.from({ length: 5 }).map((_, i) => <Star key={i} size={10} className={i < r.rating ? "fill-amber-400 text-amber-400" : "text-stone-300"} />)}</div>
                      </div>
                      {r.body && <p className="bk-muted text-xs leading-5">{r.body}</p>}
                    </div>
                  ))}
                </div>
                {props.reviews.length > 3 && (
                  <button type="button" onClick={() => setShowAllReviews((v) => !v)} className="mt-4 flex items-center gap-1.5 text-xs font-bold w-full justify-center py-2.5 rounded-xl bk-show-more" style={{ color: accent }}>
                    {showAllReviews ? <><ChevronUp size={13} /> Mostrar menos</> : <><ChevronDown size={13} /> Ver todas ({props.reviews.length})</>}
                  </button>
                )}
              </section>
            )}
          </div>

          {/* RIGHT */}
          <aside className={cn("space-y-4", mobileStep === "booking" && "hidden lg:block")}>
            <div className="bk-card rounded-2xl p-6 lg:sticky lg:top-6">
              <StepHeader n={3} label="Confirme seus dados" done={false} active={step3Active} />

              <div className="bk-summary-box rounded-xl mb-5 overflow-hidden">
                {summary ? (
                  <div>
                    <div className="px-4 py-3.5 flex items-start justify-between gap-3">
                      <div>
                        <p className="bk-text text-sm font-bold">{summary.serviceName}</p>
                        <p className="bk-muted text-xs mt-0.5 flex items-center gap-1.5"><Avatar name={summary.professionalName} size={16} />{summary.professionalName}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-black" style={{ color: accent }}>{formatCurrencyBRL(summary.priceCents)}</p>
                        <p className="bk-muted text-xs mt-0.5">{summary.durationMinutes} min</p>
                      </div>
                    </div>
                    {slot ? (
                      <div className="px-4 py-2.5 flex items-center gap-2 text-xs font-bold" style={{ background: `${accent}14`, color: accent }}>
                        <Clock size={12} />{formatInTimeZone(slot.startsAt, browserTZ, "EEEE, dd/MM 'às' HH:mm")}
                      </div>
                    ) : (
                      <div className="px-4 py-2.5 text-xs bk-faint">← Selecione um horário para prosseguir</div>
                    )}
                  </div>
                ) : (
                  <div className="px-4 py-4 text-sm text-center bk-muted">Selecione um serviço e horário.</div>
                )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                {[
                  { id: "bk-name", label: "Nome completo", value: name, onChange: (v: string) => setName(v), placeholder: "Seu nome", required: true, type: "text" },
                  { id: "bk-email", label: "E-mail", value: email, onChange: (v: string) => setEmail(v), placeholder: "voce@email.com", required: false, type: "email" },
                  { id: "bk-phone", label: "Telefone", value: phone, onChange: (v: string) => setPhone(maskPhone(v)), placeholder: "(11) 99999-0000", required: true, type: "tel" },
                ].map((field) => (
                  <div key={field.id}>
                    <label htmlFor={field.id} className="bk-field-label block mb-1.5">{field.label}{field.required && <span style={{ color: accent }}> *</span>}</label>
                    <input id={field.id} type={field.type} value={field.value} onChange={(e) => field.onChange(e.target.value)} placeholder={field.placeholder} required={field.required} className="bk-input w-full h-11 rounded-xl px-3.5 text-sm" />
                  </div>
                ))}

                <label className="bk-consent flex cursor-pointer items-start gap-3 rounded-xl p-3.5 text-xs leading-5">
                  <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 flex-shrink-0" style={{ accentColor: accent }} />
                  <span className="bk-muted">Autorizo o uso dos meus dados para este agendamento e confirmações.</span>
                </label>

                {props.cancellationPolicyText && (
                  <div className="bk-policy rounded-xl p-3.5 text-xs leading-5">
                    <p className="bk-text font-bold mb-1 flex items-center gap-1.5"><ShieldCheck size={12} style={{ color: accent }} /> Política de cancelamento</p>
                    <p className="bk-muted">{props.cancellationPolicyText}</p>
                  </div>
                )}

                {error && <div className="bk-error flex items-start gap-2 rounded-xl p-3.5 text-xs"><X size={13} className="flex-shrink-0 mt-0.5" />{error}</div>}

                <button type="submit" disabled={submitting || !slot || !consent || !name || !phone} className="bk-submit flex h-12 w-full items-center justify-center gap-2 rounded-full text-sm font-black text-white transition-all disabled:opacity-40" style={{ background: accent }}>
                  {submitting ? "Confirmando..." : <><Scissors size={15} /> Confirmar agendamento <ChevronRight size={15} /></>}
                </button>
              </form>
            </div>
          </aside>
        </div>
      </div>

      {/* MOBILE CTA */}
      {mobileStep === "booking" && step1Done && step2Done && (
        <div className="fixed bottom-0 left-0 right-0 p-4 lg:hidden z-50 bk-mobile-cta-bar">
          <button type="button" onClick={() => setMobileStep("form")} className="flex h-13 w-full items-center justify-center gap-2 rounded-full text-sm font-black text-white" style={{ background: accent, height: 52 }}>
            Continuar para dados pessoais <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
