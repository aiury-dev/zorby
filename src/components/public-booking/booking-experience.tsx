"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { addDays } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import {
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  Download,
  MapPin,
  Phone,
  Search,
  ShieldCheck,
  Star,
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
type SectionTab = "services" | "reviews" | "details";

const browserTZ =
  typeof Intl !== "undefined"
    ? Intl.DateTimeFormat().resolvedOptions().timeZone
    : "America/Sao_Paulo";

const weekdayShort = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const weekdayFull = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const monthShort = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

function maskPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return digits.replace(/(\d{2})(\d+)/, "($1) $2");
  if (digits.length <= 10) return digits.replace(/(\d{2})(\d{4})(\d+)/, "($1) $2-$3");
  return digits.replace(/(\d{2})(\d{5})(\d+)/, "($1) $2-$3");
}

function buildDateOptions(timezone: string) {
  return Array.from({ length: 14 }).map((_, index) => {
    const date = addDays(new Date(), index);
    return {
      value: formatInTimeZone(date, timezone, "yyyy-MM-dd"),
      weekdayShort: weekdayShort[date.getDay()],
      weekdayFull: weekdayFull[date.getDay()],
      dayNumber: date.getDate(),
      month: monthShort[date.getMonth()],
      isToday: index === 0,
      isTomorrow: index === 1,
    };
  });
}

function buildGoogleCalUrl(input: {
  title: string;
  details: string;
  location: string;
  startsAt: string;
  endsAt: string;
}) {
  const fmt = (value: string) => value.replace(/[-:]/g, "").replace(".000Z", "Z");
  return `https://calendar.google.com/calendar/render?${new URLSearchParams({
    action: "TEMPLATE",
    text: input.title,
    details: input.details,
    location: input.location,
    dates: `${fmt(input.startsAt)}/${fmt(input.endsAt)}`,
  })}`;
}

function buildIcs(input: {
  title: string;
  description: string;
  location: string;
  startsAt: string;
  endsAt: string;
}) {
  const fmt = (value: string) => value.replace(/[-:]/g, "").replace(".000Z", "Z");
  const content = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Zorby//PT-BR",
    "BEGIN:VEVENT",
    `DTSTART:${fmt(input.startsAt)}`,
    `DTEND:${fmt(input.endsAt)}`,
    `SUMMARY:${input.title}`,
    `DESCRIPTION:${input.description}`,
    `LOCATION:${input.location}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\n");
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(content)}`;
}

function Avatar({
  name,
  photo,
  size = 40,
}: {
  name: string;
  photo?: string | null;
  size?: number;
}) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  if (photo) {
    return (
      <Image
        src={photo}
        alt={name}
        loader={({ src }) => src}
        unoptimized
        width={size}
        height={size}
        className="rounded-full object-cover flex-shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className="bk-avatar flex items-center justify-center rounded-full flex-shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.34, fontWeight: 700 }}
    >
      {initials}
    </div>
  );
}

function StarRating({ rating, count }: { rating: number; count: number }) {
  return (
    <span className="bk-rating-badge inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold">
      <Star size={12} className="fill-current" />
      {rating.toFixed(1)}
      <span className="font-normal opacity-70">({count})</span>
    </span>
  );
}

function distributionFor(reviews: BookingExperienceProps["reviews"]) {
  return [5, 4, 3, 2, 1].map((star) => {
    const count = reviews.filter((review) => review.rating === star).length;
    return {
      star,
      count,
      percent: reviews.length ? (count / reviews.length) * 100 : 0,
    };
  });
}

function dayAvailabilityTone(count: number) {
  if (count >= 10) return "var(--color-success)";
  if (count >= 6) return "var(--color-warning)";
  if (count >= 1) return "#f59e0b";
  return "var(--bk-border)";
}

export function BookingExperience(props: BookingExperienceProps) {
  const accent = props.brandPrimaryColor ?? "#1664e8";
  const accentDim = `${accent}18`;
  const dateOptions = useMemo(() => buildDateOptions(props.timezone), [props.timezone]);

  const [serviceId, setServiceId] = useState(props.services[0]?.id ?? "");
  const [variantId, setVariantId] = useState("");
  const [professionalId, setProfessionalId] = useState("");
  const [date, setDate] = useState(dateOptions[0]?.value ?? "");
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [slot, setSlot] = useState<AvailabilitySlot | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<null | {
    appointmentId: string;
    startsAt: string;
    cancelToken: string;
    rescheduleToken: string;
  }>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(true);
  const [serviceSearch, setServiceSearch] = useState("");
  const [activeSection, setActiveSection] = useState<SectionTab>("services");

  const service = props.services.find((item) => item.id === serviceId) ?? null;
  const variant = service?.variants.find((item) => item.id === variantId) ?? null;

  const filteredServices = useMemo(() => {
    const query = serviceSearch.trim().toLowerCase();
    if (!query) return props.services;
    return props.services.filter((item) => {
      return (
        item.name.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query) ||
        item.variants.some((entry) => entry.name.toLowerCase().includes(query))
      );
    });
  }, [props.services, serviceSearch]);

  const availableProfessionals = useMemo(() => {
    if (!serviceId) {
      return props.professionals.filter((professional) => professional.availabilities.length > 0);
    }

    return props.professionals.filter((professional) => {
      if (!professional.availabilities.length) return false;
      if (!professional.services.length) return true;
      return professional.services.some((entry) => entry.serviceId === serviceId);
    });
  }, [props.professionals, serviceId]);

  useEffect(() => {
    if (!availableProfessionals.length) {
      setProfessionalId("");
      return;
    }

    if (!availableProfessionals.some((professional) => professional.id === professionalId)) {
      setProfessionalId(availableProfessionals[0]?.id ?? "");
      setSlot(null);
    }
  }, [availableProfessionals, professionalId]);

  const professional =
    availableProfessionals.find((item) => item.id === professionalId) ?? null;

  const summary = useMemo(() => {
    if (!service || !professional) return null;
    return {
      serviceName: variant ? `${service.name} · ${variant.name}` : service.name,
      priceCents: variant?.priceCents ?? service.priceCents,
      durationMinutes: variant?.durationMinutes ?? service.durationMinutes,
      professionalName: professional.displayName,
    };
  }, [professional, service, variant]);

  const location = [props.neighborhood, props.city].filter(Boolean).join(", ") || props.name;
  const averageRating = props.reviews.length
    ? props.reviews.reduce((sum, review) => sum + review.rating, 0) / props.reviews.length
    : null;
  const reviewsDistribution = distributionFor(props.reviews);

  const weeklyAgenda = useMemo(() => {
    if (!professional?.availabilities.length) return [];
    return weekdayFull
      .map((label, index) => {
        const dayItems = professional.availabilities.filter((item) => item.dayOfWeek === index);
        if (!dayItems.length) return null;
        return {
          label,
          value: dayItems
            .map((item) => {
              const startHours = String(Math.floor(item.startMinutes / 60)).padStart(2, "0");
              const startMinutesPart = String(item.startMinutes % 60).padStart(2, "0");
              const endHours = String(Math.floor(item.endMinutes / 60)).padStart(2, "0");
              const endMinutesPart = String(item.endMinutes % 60).padStart(2, "0");
              return `${startHours}:${startMinutesPart} – ${endHours}:${endMinutesPart}`;
            })
            .join(" • "),
        };
      })
      .filter(Boolean) as Array<{ label: string; value: string }>;
  }, [professional]);

  useEffect(() => {
    if (!serviceId || !professionalId || !date) {
      setSlots([]);
      return;
    }

    let cancelled = false;
    setLoadingSlots(true);
    setError(null);

    const params = new URLSearchParams({
      date,
      serviceId,
      professionalId,
      timezone: browserTZ,
    });

    fetch(`/api/public/${props.slug}/availability?${params}`, { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => {
        if (cancelled) return;
        const nextSlots = data.slots ?? [];
        setSlots(nextSlots);
        setSlot((current) =>
          nextSlots.find((entry: AvailabilitySlot) => entry.startsAt === current?.startsAt) ?? null,
        );
      })
      .catch(() => {
        if (!cancelled) {
          setError("Não foi possível carregar os horários agora.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingSlots(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [date, professionalId, props.slug, serviceId]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!service || !professional || !slot) {
      setError("Escolha um serviço, profissional e horário antes de continuar.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/public/${props.slug}/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: service.id,
          serviceVariantId: variant?.id,
          professionalId: professional.id,
          startsAt: slot.startsAt,
          customerName: name,
          customerEmail: email,
          customerPhone: phone.replace(/\D/g, ""),
          customerTimezone: browserTZ,
          consent,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Não foi possível concluir o agendamento.");
      }

      setSuccess(data);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Não foi possível confirmar o agendamento.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const daySlotCounts = useMemo(() => {
    const count = slots.length;
    return dateOptions.reduce<Record<string, number>>((acc, item) => {
      acc[item.value] = item.value === date ? count : 0;
      return acc;
    }, {});
  }, [date, dateOptions, slots.length]);

  if (success && summary && slot) {
    const title = `${summary.serviceName} com ${summary.professionalName}`;
    return (
      <div
        data-booking
        className="min-h-screen px-4 py-8 md:px-6 md:py-14"
        style={{ "--bk-accent": accent, "--bk-accent-dim": accentDim } as React.CSSProperties}
      >
        <div className="mx-auto w-full max-w-xl">
          <div className="bk-card rounded-[32px] p-6 md:p-8">
            <div
              className="mb-5 flex size-14 items-center justify-center rounded-full"
              style={{ background: accent }}
            >
              <Check size={24} className="text-white" strokeWidth={2.5} />
            </div>

            <h1 className="bk-text text-3xl font-black tracking-[-0.04em]">
              Agendamento confirmado
            </h1>
            <p className="bk-muted mt-2 text-sm leading-6">
              Tudo certo. Seu horário já está reservado e pronto para entrar na agenda.
            </p>

            <div className="bk-summary-box mt-6 overflow-hidden rounded-[24px]">
              {[
                ["Serviço", summary.serviceName],
                ["Profissional", summary.professionalName],
                [
                  "Data e hora",
                  formatInTimeZone(success.startsAt, browserTZ, "dd/MM/yyyy 'às' HH:mm"),
                ],
                ["Valor", formatCurrencyBRL(summary.priceCents)],
                ["Duração", `${summary.durationMinutes} min`],
              ].map(([label, value], index) => (
                <div
                  key={label}
                  className={cn(
                    "flex items-start justify-between gap-4 px-4 py-3.5 text-sm",
                    index !== 0 && "bk-divider-top",
                  )}
                >
                  <span className="bk-muted">{label}</span>
                  <span className="bk-text text-right font-semibold">{value}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <a
                href={buildGoogleCalUrl({
                  title,
                  details: `Agendamento confirmado em ${props.name}.`,
                  location,
                  startsAt: success.startsAt,
                  endsAt: slot.endsAt,
                })}
                target="_blank"
                rel="noreferrer"
                className="bk-cal-btn inline-flex h-12 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold"
              >
                <CalendarDays size={15} />
                Google Agenda
              </a>
              <a
                href={buildIcs({
                  title,
                  description: `Agendamento confirmado em ${props.name}.`,
                  location,
                  startsAt: success.startsAt,
                  endsAt: slot.endsAt,
                })}
                download="agendamento-zorby.ics"
                className="bk-cal-btn inline-flex h-12 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold"
              >
                <Download size={15} />
                Apple Calendar
              </a>
            </div>

            <div className="mt-6 flex flex-wrap gap-4 text-xs text-[color:var(--bk-muted)]">
              <a href={`/cancelar/${success.cancelToken}`} className="hover:underline">
                Cancelar agendamento
              </a>
              <a href={`/reagendar/${success.rescheduleToken}`} className="hover:underline">
                Reagendar
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      data-booking
      className="min-h-screen"
      style={{ "--bk-accent": accent, "--bk-accent-dim": accentDim } as React.CSSProperties}
    >
      <div className="relative h-[240px] overflow-hidden sm:h-[280px]">
        {props.coverImageUrl ? (
          <Image
            src={props.coverImageUrl}
            alt={props.name}
            loader={({ src }) => src}
            unoptimized
            fill
            sizes="100vw"
            className="object-cover"
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(140deg, ${accent} 0%, ${props.brandSecondaryColor ?? "#0f172a"} 100%)`,
            }}
          />
        )}
        <div className="bk-hero-overlay absolute inset-0" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 pb-28 md:px-6">
        <div className="-mt-16 lg:-mt-20">
          <div className="bk-card rounded-[32px] p-5 md:p-7">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex items-end gap-4">
                {props.logoUrl ? (
                  <Image
                    src={props.logoUrl}
                    alt={props.name}
                    loader={({ src }) => src}
                    unoptimized
                    width={72}
                    height={72}
                    className="h-18 w-18 rounded-[26px] border-4 border-white object-cover shadow-lg"
                  />
                ) : (
                  <div
                    className="flex h-18 w-18 items-center justify-center rounded-[26px] border-4 border-white text-3xl font-black text-white shadow-lg"
                    style={{ background: accent }}
                  >
                    {props.name[0]}
                  </div>
                )}

                <div className="pb-1">
                  <h1 className="bk-text text-[1.9rem] font-black tracking-[-0.04em] md:text-[2.4rem]">
                    {props.name}
                  </h1>
                  <div className="mt-2 flex flex-wrap items-center gap-2.5 text-sm">
                    {averageRating && <StarRating rating={averageRating} count={props.reviews.length} />}
                    {location ? (
                      <span className="bk-muted inline-flex items-center gap-1.5">
                        <MapPin size={14} style={{ color: accent }} />
                        {location}
                      </span>
                    ) : null}
                    {props.phone ? (
                      <span className="bk-muted inline-flex items-center gap-1.5">
                        <Phone size={14} style={{ color: accent }} />
                        {props.phone}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5 rounded-[20px] bk-summary-box p-2.5 text-center">
                <div className="rounded-2xl bg-white px-3 py-3">
                  <p className="bk-faint text-[11px] uppercase tracking-[0.18em]">Serviços</p>
                  <p className="bk-text mt-1 text-lg font-black">{props.services.length}</p>
                </div>
                <div className="rounded-2xl bg-white px-3 py-3">
                  <p className="bk-faint text-[11px] uppercase tracking-[0.18em]">Equipe</p>
                  <p className="bk-text mt-1 text-lg font-black">{props.professionals.length}</p>
                </div>
                <div className="rounded-2xl bg-white px-3 py-3">
                  <p className="bk-faint text-[11px] uppercase tracking-[0.18em]">Cidade</p>
                  <p className="bk-text mt-1 truncate text-sm font-bold">{props.city ?? "Online"}</p>
                </div>
              </div>
            </div>

            {props.description ? (
              <p className="bk-muted mt-5 max-w-3xl text-sm leading-7">{props.description}</p>
            ) : null}
          </div>
        </div>

        <div className="mt-5 flex gap-2 overflow-x-auto pb-1 bk-scroll-hide">
          {[
            { id: "services" as const, label: "Serviços" },
            { id: "reviews" as const, label: "Avaliações" },
            { id: "details" as const, label: "Detalhes" },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveSection(item.id)}
              className={cn(
                "rounded-full px-4 py-2.5 text-sm font-semibold transition-all",
                activeSection === item.id ? "text-white shadow-md" : "bk-cal-btn",
              )}
              style={activeSection === item.id ? { background: accent } : undefined}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_390px]">
          <div className="space-y-6">
            <section className="bk-card rounded-[30px] p-5 md:p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="bk-faint text-xs font-semibold uppercase tracking-[0.22em]">
                    Agendamento online
                  </p>
                  <h2 className="bk-text mt-2 text-2xl font-black tracking-[-0.04em] md:text-3xl">
                    Escolha o serviço e reserve um horário
                  </h2>
                  <p className="bk-muted mt-2 text-sm leading-6">
                    O profissional define a disponibilidade e você agenda apenas entre os
                    horários realmente livres.
                  </p>
                </div>

                <div className="relative w-full md:max-w-xs">
                  <Search
                    size={16}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[color:var(--bk-faint)]"
                  />
                  <input
                    value={serviceSearch}
                    onChange={(event) => setServiceSearch(event.target.value)}
                    placeholder="Buscar serviço"
                    className="bk-input h-12 w-full rounded-full pl-11 pr-4 text-sm"
                  />
                </div>
              </div>

              {activeSection === "services" ? (
                <>
                  <div className="mt-5 grid gap-3">
                    {filteredServices.map((item) => {
                      const selected = item.id === serviceId;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setServiceId(item.id);
                            setVariantId("");
                            setSlot(null);
                          }}
                          className={cn(
                            "bk-service-card relative overflow-hidden rounded-[26px] p-4 text-left transition-all md:p-5",
                            selected && "bk-service-card-selected",
                          )}
                        >
                          <div
                            className="absolute inset-y-0 left-0 w-1.5 rounded-l-[26px]"
                            style={{ background: item.colorHex || accent }}
                          />

                          <div className="flex flex-col gap-3 pl-3 md:flex-row md:items-center md:justify-between">
                            <div className="max-w-2xl">
                              <div className="flex items-center gap-3">
                                <h3 className="bk-text text-lg font-black tracking-[-0.03em]">
                                  {item.name}
                                </h3>
                                {selected ? (
                                  <span
                                    className="inline-flex size-6 items-center justify-center rounded-full text-white"
                                    style={{ background: accent }}
                                  >
                                    <Check size={13} strokeWidth={3} />
                                  </span>
                                ) : null}
                              </div>
                              {item.description ? (
                                <p className="bk-muted mt-1.5 text-sm leading-6">
                                  {item.description}
                                </p>
                              ) : null}
                              <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
                                <span className="bk-muted inline-flex items-center gap-1.5">
                                  <Clock3 size={14} />
                                  {item.durationMinutes} min
                                </span>
                                <span className="text-base font-black" style={{ color: accent }}>
                                  {formatCurrencyBRL(item.priceCents)}
                                </span>
                              </div>
                            </div>
                            <div className="shrink-0">
                              <span
                                className={cn(
                                  "inline-flex h-11 items-center justify-center rounded-full px-5 text-sm font-semibold",
                                  selected ? "text-white" : "bk-cal-btn",
                                )}
                                style={selected ? { background: accent } : undefined}
                              >
                                {selected ? "Selecionado" : "Reservar"}
                              </span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {service?.variants.length ? (
                    <div className="mt-5">
                      <label className="bk-field-label mb-2 block">Variação</label>
                      <select
                        value={variantId}
                        onChange={(event) => setVariantId(event.target.value)}
                        className="bk-select h-12 w-full rounded-2xl px-4 text-sm"
                      >
                        <option value="">Padrão</option>
                        {service.variants.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name} — {item.durationMinutes} min —{" "}
                            {formatCurrencyBRL(item.priceCents)}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : null}

                  <div className="mt-6 space-y-6">
                    <div>
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div>
                          <p className="bk-field-label">Profissional</p>
                          <p className="bk-muted mt-1 text-sm">
                            Escolha quem vai atender você.
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2 overflow-x-auto pb-1 bk-scroll-hide">
                        {availableProfessionals.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              setProfessionalId(item.id);
                              setSlot(null);
                            }}
                            className={cn(
                              "bk-pro-chip flex min-w-[180px] items-center gap-3 rounded-full px-3.5 py-2.5 transition-all",
                              professionalId === item.id && "bk-pro-chip-selected",
                            )}
                            style={
                              professionalId === item.id
                                ? {
                                    borderColor: accent,
                                    background: `${accent}10`,
                                    color: accent,
                                  }
                                : undefined
                            }
                          >
                            <Avatar name={item.displayName} photo={item.photoUrl} size={42} />
                            <div className="min-w-0 text-left">
                              <p className="truncate text-sm font-bold text-[color:var(--bk-text)]">
                                {item.displayName}
                              </p>
                              <p className="truncate text-xs text-[color:var(--bk-muted)]">
                                {item.roleLabel ?? "Profissional"}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="mb-3 flex items-center justify-between">
                        <div>
                          <p className="bk-field-label">Data e horário</p>
                          <p className="bk-muted mt-1 text-sm">
                            Toque em um dia para ver os horários livres.
                          </p>
                        </div>
                        {loadingSlots ? (
                          <span className="bk-muted text-xs">Atualizando...</span>
                        ) : null}
                      </div>

                      <div className="flex gap-2 overflow-x-auto pb-2 bk-scroll-hide">
                        {dateOptions.map((item) => {
                          const selected = item.value === date;
                          const count = daySlotCounts[item.value] ?? 0;
                          return (
                            <button
                              key={item.value}
                              type="button"
                              onClick={() => {
                                setDate(item.value);
                                setSlot(null);
                              }}
                              className={cn(
                                "bk-date-chip flex shrink-0 flex-col items-center justify-center rounded-[24px] transition-all",
                                selected && "bk-date-chip-selected",
                              )}
                              style={
                                selected
                                  ? { background: accent, color: "#fff", borderColor: accent }
                                  : undefined
                              }
                            >
                              <span className="text-[10px] font-bold uppercase tracking-[0.18em]">
                                {item.isToday
                                  ? "Hoje"
                                  : item.isTomorrow
                                    ? "Amanhã"
                                    : item.weekdayShort}
                              </span>
                              <span className="mt-1 text-lg font-black">{item.dayNumber}</span>
                              <span className="text-[10px] uppercase">{item.month}</span>
                              <span
                                className="mt-2 h-1.5 w-7 rounded-full"
                                style={{
                                  background: selected
                                    ? "rgba(255,255,255,0.45)"
                                    : dayAvailabilityTone(count),
                                }}
                              />
                            </button>
                          );
                        })}
                      </div>

                      <div className="mt-3 flex flex-wrap gap-4 text-xs text-[color:var(--bk-muted)]">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-[color:var(--color-success)]" />
                          +10 horários
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-[color:var(--color-warning)]" />
                          6–10 horários
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-[#f59e0b]" />
                          1–5 horários
                        </span>
                      </div>

                      <div className="mt-5">
                        {!loadingSlots && slots.length === 0 ? (
                          <div className="bk-no-slots rounded-[24px] p-5 text-center text-sm">
                            Nenhum horário disponível nesta data. Escolha outro dia ou profissional.
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2.5">
                            {slots.map((item) => {
                              const selected = slot?.startsAt === item.startsAt;
                              return (
                                <button
                                  key={item.startsAt}
                                  type="button"
                                  onClick={() => setSlot(item)}
                                  className={cn(
                                    "bk-slot-chip rounded-full px-4 py-3 text-sm font-bold transition-all",
                                    selected && "bk-slot-selected",
                                  )}
                                  style={
                                    selected
                                      ? {
                                          background: accent,
                                          color: "#fff",
                                          borderColor: accent,
                                        }
                                      : undefined
                                  }
                                >
                                  {item.label}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              ) : null}

              {activeSection === "reviews" ? (
                <div className="mt-5 space-y-5">
                  {props.reviews.length ? (
                    <>
                      <div className="grid gap-4 md:grid-cols-[220px_1fr]">
                        <div className="bk-review-card rounded-[28px] p-5 text-center">
                          <div className="bk-text text-5xl font-black tracking-[-0.05em]">
                            {averageRating?.toFixed(1)}
                          </div>
                          <div className="mt-2 flex justify-center gap-1">
                            {Array.from({ length: 5 }).map((_, index) => (
                              <Star
                                key={index}
                                size={16}
                                className={
                                  index < Math.round(averageRating ?? 0)
                                    ? "fill-amber-400 text-amber-400"
                                    : "text-stone-300"
                                }
                              />
                            ))}
                          </div>
                          <p className="bk-muted mt-2 text-sm">
                            {props.reviews.length} avaliações verificadas
                          </p>
                        </div>
                        <div className="bk-review-card rounded-[28px] p-5">
                          <div className="space-y-3">
                            {reviewsDistribution.map((item) => (
                              <div key={item.star} className="flex items-center gap-3">
                                <span className="bk-muted w-4 text-xs">{item.star}</span>
                                <div className="bk-bar-bg h-2 flex-1 overflow-hidden rounded-full">
                                  <div
                                    className="h-full rounded-full"
                                    style={{ width: `${item.percent}%`, background: accent }}
                                  />
                                </div>
                                <span className="bk-faint w-6 text-right text-xs">{item.count}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-3">
                        {props.reviews.slice(0, 4).map((review) => (
                          <article key={review.id} className="bk-review-card rounded-[24px] p-4">
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <Avatar name={review.customerNameSnapshot} size={38} />
                                <div>
                                  <p className="bk-text text-sm font-bold">
                                    {review.customerNameSnapshot}
                                  </p>
                                  <div className="mt-1 flex gap-0.5">
                                    {Array.from({ length: 5 }).map((_, index) => (
                                      <Star
                                        key={index}
                                        size={11}
                                        className={
                                          index < review.rating
                                            ? "fill-amber-400 text-amber-400"
                                            : "text-stone-300"
                                        }
                                      />
                                    ))}
                                  </div>
                                </div>
                              </div>
                              <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700">
                                Cliente confirmado
                              </span>
                            </div>
                            {review.body ? (
                              <p className="bk-muted mt-3 text-sm leading-6">{review.body}</p>
                            ) : null}
                          </article>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="bk-no-slots rounded-[24px] p-5 text-center text-sm">
                      As primeiras avaliações vão aparecer aqui depois dos atendimentos.
                    </div>
                  )}
                </div>
              ) : null}

              {activeSection === "details" ? (
                <div className="mt-5 grid gap-4 md:grid-cols-[1fr_1fr]">
                  <div className="bk-review-card rounded-[28px] p-5">
                    <p className="bk-field-label mb-2">Sobre o espaço</p>
                    <p className="bk-text text-lg font-bold">{props.name}</p>
                    <p className="bk-muted mt-2 text-sm leading-6">
                      {props.description ??
                        "Atendimento com agenda organizada, confirmação automática e horários exibidos em tempo real."}
                    </p>
                    <div className="mt-4 space-y-2 text-sm">
                      {location ? (
                        <p className="bk-muted inline-flex items-center gap-2">
                          <MapPin size={14} style={{ color: accent }} />
                          {location}
                        </p>
                      ) : null}
                      {props.phone ? (
                        <p className="bk-muted inline-flex items-center gap-2">
                          <Phone size={14} style={{ color: accent }} />
                          {props.phone}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="bk-review-card rounded-[28px] p-5">
                    <p className="bk-field-label mb-2">Equipe e funcionamento</p>
                    <div className="space-y-3">
                      {props.professionals.slice(0, 3).map((item) => (
                        <div key={item.id} className="flex items-center gap-3">
                          <Avatar name={item.displayName} photo={item.photoUrl} size={42} />
                          <div>
                            <p className="bk-text text-sm font-bold">{item.displayName}</p>
                            <p className="bk-muted text-xs">
                              {item.roleLabel ?? "Profissional"}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {weeklyAgenda.length ? (
                      <div className="mt-4 rounded-[22px] bk-summary-box p-4">
                        <p className="bk-field-label mb-3">Horário de funcionamento</p>
                        <div className="space-y-2">
                          {weeklyAgenda.map((item) => (
                            <div key={item.label} className="flex items-start justify-between gap-3 text-sm">
                              <span className="bk-text font-semibold">{item.label}</span>
                              <span className="bk-muted text-right">{item.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </section>
          </div>

          <aside className="space-y-4">
            <div className="bk-card rounded-[30px] p-5 md:p-6 lg:sticky lg:top-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="bk-field-label">Seu agendamento</p>
                  <h3 className="bk-text mt-2 text-2xl font-black tracking-[-0.04em]">
                    Confirme seus dados
                  </h3>
                </div>
                {summary ? (
                  <StarRating rating={averageRating ?? 5} count={props.reviews.length || 1} />
                ) : null}
              </div>

              <div className="bk-summary-box mt-5 overflow-hidden rounded-[24px]">
                {summary ? (
                  <>
                    <div className="px-4 py-4">
                      <p className="bk-text text-base font-black">{summary.serviceName}</p>
                      <div className="mt-2 flex items-center justify-between gap-3 text-sm">
                        <span className="bk-muted inline-flex items-center gap-2">
                          <Avatar
                            name={summary.professionalName}
                            photo={professional?.photoUrl}
                            size={18}
                          />
                          {summary.professionalName}
                        </span>
                        <span className="font-black" style={{ color: accent }}>
                          {formatCurrencyBRL(summary.priceCents)}
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-[color:var(--bk-muted)]">
                        {summary.durationMinutes} min
                      </div>
                    </div>
                    <div className="bk-divider-top px-4 py-3 text-xs">
                      {slot ? (
                        <span
                          className="inline-flex items-center gap-2 font-semibold"
                          style={{ color: accent }}
                        >
                          <Clock3 size={13} />
                          {formatInTimeZone(slot.startsAt, browserTZ, "EEEE, dd/MM 'às' HH:mm")}
                        </span>
                      ) : (
                        <span className="bk-muted">Selecione um horário para continuar.</span>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="px-4 py-5 text-sm text-[color:var(--bk-muted)]">
                    Escolha primeiro o serviço e o profissional.
                  </div>
                )}
              </div>

              <form onSubmit={handleSubmit} className="mt-5 space-y-3.5">
                <div>
                  <label htmlFor="booking-name" className="bk-field-label mb-1.5 block">
                    Nome completo
                  </label>
                  <input
                    id="booking-name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Seu nome"
                    className="bk-input h-12 w-full rounded-2xl px-4 text-sm"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="booking-email" className="bk-field-label mb-1.5 block">
                    E-mail
                  </label>
                  <input
                    id="booking-email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="voce@email.com"
                    className="bk-input h-12 w-full rounded-2xl px-4 text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="booking-phone" className="bk-field-label mb-1.5 block">
                    Telefone
                  </label>
                  <input
                    id="booking-phone"
                    value={phone}
                    onChange={(event) => setPhone(maskPhone(event.target.value))}
                    placeholder="(11) 99999-0000"
                    className="bk-input h-12 w-full rounded-2xl px-4 text-sm"
                    required
                  />
                </div>

                <label className="bk-consent flex items-start gap-3 rounded-[20px] p-3.5 text-xs leading-5">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(event) => setConsent(event.target.checked)}
                    className="mt-0.5"
                    style={{ accentColor: accent }}
                  />
                  <span className="bk-muted">
                    Autorizo o uso dos meus dados para realizar este agendamento e receber
                    confirmações.
                  </span>
                </label>

                {props.cancellationPolicyText ? (
                  <div className="bk-policy rounded-[20px] p-3.5 text-xs leading-5">
                    <p className="bk-text mb-1.5 inline-flex items-center gap-1.5 font-bold">
                      <ShieldCheck size={13} style={{ color: accent }} />
                      Política de cancelamento
                    </p>
                    <p className="bk-muted">{props.cancellationPolicyText}</p>
                  </div>
                ) : null}

                {error ? (
                  <div className="bk-error rounded-[20px] p-3.5 text-xs leading-5">{error}</div>
                ) : null}

                <button
                  type="submit"
                  disabled={!slot || !name || !phone || !consent || submitting}
                  className="bk-submit flex h-13 w-full items-center justify-center gap-2 rounded-full text-sm font-black text-white disabled:opacity-40"
                  style={{ background: accent, height: 52 }}
                >
                  {submitting ? (
                    <>
                      <span className="bk-spinner" />
                      Confirmando...
                    </>
                  ) : (
                    <>
                      Confirmar agendamento
                      <ChevronRight size={16} />
                    </>
                  )}
                </button>
              </form>
            </div>
          </aside>
        </div>
      </div>

      {summary && slot ? (
        <div className="bk-mobile-cta-bar fixed inset-x-0 bottom-0 z-50 p-4 lg:hidden">
          <div className="bk-card rounded-[26px] p-3.5 shadow-2xl">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="bk-text text-sm font-bold">{summary.serviceName}</p>
                <p className="bk-muted text-xs">
                  {summary.durationMinutes} min • {formatCurrencyBRL(summary.priceCents)}
                </p>
              </div>
              <span
                className="rounded-full px-3 py-1 text-xs font-semibold"
                style={{ background: `${accent}14`, color: accent }}
              >
                {slot.label}
              </span>
            </div>
            <button
              type="button"
              className="flex h-13 w-full items-center justify-center gap-2 rounded-full text-sm font-black text-white"
              style={{ background: accent, height: 52 }}
              onClick={() => {
                document
                  .querySelector("aside form")
                  ?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
            >
              Continuar
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
