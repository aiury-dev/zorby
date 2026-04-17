"use client";

import { useEffect, useMemo, useState } from "react";
import { addDays } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { CalendarClock, CheckCircle2, Clock3, ShieldCheck, Star, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

type AvailabilitySlot = {
  startsAt: string;
  endsAt: string;
  label: string;
};

const browserTimezone =
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

export function BookingExperience(props: BookingExperienceProps) {
  const dateOptions = useMemo(() => buildDateOptions(props.timezone), [props.timezone]);
  const [selectedServiceId, setSelectedServiceId] = useState<string>(props.services[0]?.id ?? "");
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState(dateOptions[0]?.value ?? "");
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<null | { startsAt: string }>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [consent, setConsent] = useState(true);

  const selectedService = props.services.find((service) => service.id === selectedServiceId) ?? null;

  const availableProfessionals = useMemo(() => {
    if (!selectedServiceId) {
      return props.professionals.filter((professional) => professional.availabilities.length > 0);
    }
    return props.professionals.filter((professional) => {
      if (!professional.availabilities.length) return false;
      if (!professional.services.length) return true;
      return professional.services.some((service) => service.serviceId === selectedServiceId);
    });
  }, [props.professionals, selectedServiceId]);

  useEffect(() => {
    if (!availableProfessionals.length) {
      setSelectedProfessionalId("");
      return;
    }
    if (!availableProfessionals.some((professional) => professional.id === selectedProfessionalId)) {
      setSelectedProfessionalId(availableProfessionals[0]?.id ?? "");
      setSelectedSlot(null);
    }
  }, [availableProfessionals, selectedProfessionalId]);

  const selectedProfessional =
    availableProfessionals.find((professional) => professional.id === selectedProfessionalId) ?? null;

  const weeklyAgenda = useMemo(() => {
    if (!selectedProfessional?.availabilities.length) return [];
    return weekdayLabels
      .map((label, index) => {
        const daySlots = selectedProfessional.availabilities.filter((item) => item.dayOfWeek === index);
        if (!daySlots.length) return null;
        return {
          label,
          value: daySlots
            .map((item) => `${formatMinutes(item.startMinutes)} às ${formatMinutes(item.endMinutes)}`)
            .join(" • "),
        };
      })
      .filter(Boolean) as Array<{ label: string; value: string }>;
  }, [selectedProfessional]);

  useEffect(() => {
    if (!selectedServiceId || !selectedProfessionalId || !selectedDate) {
      setSlots([]);
      return;
    }

    let cancelled = false;

    async function loadAvailability() {
      setLoadingSlots(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          date: selectedDate,
          serviceId: selectedServiceId,
          professionalId: selectedProfessionalId,
          timezone: browserTimezone,
        });

        const response = await fetch(`/api/public/${props.slug}/availability?${params.toString()}`, {
          cache: "no-store",
        });
        const data = (await response.json()) as { error?: string; slots?: AvailabilitySlot[] };

        if (!response.ok) {
          throw new Error(data.error ?? "Não foi possível carregar os horários.");
        }

        if (!cancelled) {
          setSlots(data.slots ?? []);
          setSelectedSlot((current) =>
            data.slots?.find((slot) => slot.startsAt === current?.startsAt) ?? null,
          );
        }
      } catch (loadError) {
        if (!cancelled) {
          setSlots([]);
          setError(loadError instanceof Error ? loadError.message : "Falha ao buscar horários.");
        }
      } finally {
        if (!cancelled) setLoadingSlots(false);
      }
    }

    void loadAvailability();
    return () => {
      cancelled = true;
    };
  }, [props.slug, selectedDate, selectedProfessionalId, selectedServiceId]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedSlot || !selectedService || !selectedProfessional) {
      setError("Escolha um horário disponível antes de confirmar.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/public/${props.slug}/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: selectedService.id,
          professionalId: selectedProfessional.id,
          startsAt: selectedSlot.startsAt,
          customerName,
          customerEmail,
          customerPhone: customerPhone.replace(/\D/g, ""),
          customerTimezone: browserTimezone,
          consent,
        }),
      });

      const data = (await response.json()) as { error?: string; startsAt: string };
      if (!response.ok) {
        throw new Error(data.error ?? "Não foi possível concluir o agendamento.");
      }

      setSuccess({ startsAt: data.startsAt });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Falha ao concluir o agendamento.");
    } finally {
      setSubmitting(false);
    }
  }

  if (success && selectedService && selectedProfessional) {
    return (
      <section className="rounded-[36px] border border-emerald-100 bg-[linear-gradient(135deg,#052e16_0%,#0f5132_40%,#059669_100%)] p-6 text-white shadow-[0_24px_70px_rgba(5,46,22,0.22)] md:p-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-white/85">
          <CheckCircle2 className="size-4" />
          Horário confirmado
        </div>
        <h2 className="mt-6 text-3xl font-semibold md:text-4xl">Agendamento realizado com sucesso.</h2>
        <div className="mt-8 grid gap-4 rounded-[28px] border border-white/10 bg-white/10 p-5 md:grid-cols-2">
          <div>
            <p className="text-sm text-white/65">Serviço</p>
            <p className="mt-2 text-lg font-semibold">{selectedService.name}</p>
          </div>
          <div>
            <p className="text-sm text-white/65">Profissional</p>
            <p className="mt-2 text-lg font-semibold">{selectedProfessional.displayName}</p>
          </div>
          <div>
            <p className="text-sm text-white/65">Quando</p>
            <p className="mt-2 text-lg font-semibold">
              {formatInTimeZone(success.startsAt, browserTimezone, "dd/MM/yyyy 'às' HH:mm")}
            </p>
          </div>
          <div>
            <p className="text-sm text-white/65">Valor</p>
            <p className="mt-2 text-lg font-semibold">{formatCurrencyBRL(selectedService.priceCents)}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
      <section className="space-y-8">
        <div className="overflow-hidden rounded-[36px] border border-slate-200 bg-[linear-gradient(135deg,#0f172a_0%,#163d78_42%,#1d72d8_100%)] p-6 text-white shadow-[0_24px_70px_rgba(15,23,42,0.2)] md:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-white/80">
                Agenda online
              </div>
              <h1 className="mt-6 text-4xl font-semibold tracking-tight md:text-5xl">{props.name}</h1>
              <p className="mt-4 text-base leading-8 text-white/78">
                {props.description ||
                  "Escolha o serviço, selecione o profissional e reserve um horário que ele realmente deixou disponível."}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-white/85">
                  <CalendarClock className="size-4" />
                  Agenda definida pelo profissional
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-white/85">
                  <ShieldCheck className="size-4" />
                  Horário reservado não aparece de novo
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/10 p-5 backdrop-blur">
              <p className="text-sm text-white/60">Atendimento</p>
              <p className="mt-2 font-semibold text-white">
                {[props.neighborhood, props.city].filter(Boolean).join(", ") || "Online"}
              </p>
              {props.phone ? <p className="mt-3 text-sm text-white/80">{props.phone}</p> : null}
            </div>
          </div>
        </div>

        <section className="rounded-[32px] border border-[color:var(--color-border-default)] bg-white p-6 shadow-[0_12px_28px_rgba(15,23,42,0.05)] md:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[color:var(--color-fg-muted)]">
            Passo 1
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-[color:var(--color-fg-default)]">
            Escolha o serviço
          </h2>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {props.services.map((service) => (
              <button
                key={service.id}
                type="button"
                onClick={() => {
                  setSelectedServiceId(service.id);
                  setSelectedSlot(null);
                }}
                className={cn(
                  "rounded-[28px] border p-5 text-left transition",
                  selectedServiceId === service.id
                    ? "border-[color:var(--color-brand-500)] bg-[linear-gradient(180deg,#eff6ff_0%,#dbeafe_100%)]"
                    : "border-[color:var(--color-border-default)] bg-white hover:border-[color:var(--color-border-strong)] hover:bg-slate-50",
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-[color:var(--color-fg-default)]">{service.name}</h3>
                    <p className="mt-2 text-sm leading-6 text-[color:var(--color-fg-muted)]">
                      {service.description || "Serviço configurado para agendamento online."}
                    </p>
                  </div>
                  <span
                    className="mt-1 inline-flex size-3 rounded-full"
                    style={{ backgroundColor: service.colorHex ?? "#1664E8" }}
                  />
                </div>
                <div className="mt-5 flex items-center justify-between text-sm text-[color:var(--color-fg-muted)]">
                  <span>{service.durationMinutes} min</span>
                  <span className="font-semibold text-[color:var(--color-fg-default)]">
                    {formatCurrencyBRL(service.priceCents)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-[32px] border border-[color:var(--color-border-default)] bg-white p-6 shadow-[0_12px_28px_rgba(15,23,42,0.05)] md:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[color:var(--color-fg-muted)]">
            Passo 2
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-[color:var(--color-fg-default)]">
            Escolha o profissional e o horário
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[color:var(--color-fg-muted)]">
            O profissional é quem define a disponibilidade. O cliente escolhe só entre os horários livres. Quando um horário é reservado, ele sai automaticamente da lista.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {availableProfessionals.map((professional) => (
              <button
                key={professional.id}
                type="button"
                onClick={() => {
                  setSelectedProfessionalId(professional.id);
                  setSelectedSlot(null);
                }}
                className={cn(
                  "rounded-[28px] border p-5 text-left transition",
                  selectedProfessionalId === professional.id
                    ? "border-[color:var(--color-brand-500)] bg-[linear-gradient(180deg,#eff6ff_0%,#dbeafe_100%)]"
                    : "border-[color:var(--color-border-default)] bg-white hover:border-[color:var(--color-border-strong)] hover:bg-slate-50",
                )}
              >
                <div className="flex items-start gap-4">
                  {professional.photoUrl ? (
                    <img src={professional.photoUrl} alt={professional.displayName} className="size-14 rounded-2xl object-cover" />
                  ) : (
                    <div className="flex size-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                      <UserRound className="size-6" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-semibold text-[color:var(--color-fg-default)]">{professional.displayName}</h3>
                    <p className="mt-1 text-sm text-[color:var(--color-fg-muted)]">
                      {professional.roleLabel || "Profissional disponível para reserva online"}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
                {dateOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setSelectedDate(option.value);
                      setSelectedSlot(null);
                    }}
                    className={cn(
                      "rounded-[24px] border px-4 py-4 text-left transition",
                      selectedDate === option.value
                        ? "border-[color:var(--color-brand-500)] bg-[color:var(--color-brand-500)] text-white"
                        : "border-[color:var(--color-border-default)] bg-white hover:border-[color:var(--color-border-strong)]",
                    )}
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] opacity-70">{option.shortLabel}</p>
                    <p className="mt-2 text-base font-semibold">{option.longLabel}</p>
                  </button>
                ))}
              </div>

              <div className="rounded-[30px] border border-[color:var(--color-border-default)] bg-slate-50 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-[color:var(--color-fg-default)]">Horários livres</h3>
                    <p className="mt-1 text-sm leading-6 text-[color:var(--color-fg-muted)]">
                      Agenda atualizada em tempo real para evitar marcação duplicada.
                    </p>
                  </div>
                  {loadingSlots ? <span className="text-sm text-[color:var(--color-fg-muted)]">Carregando...</span> : null}
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  {slots.map((slot) => (
                    <button
                      key={slot.startsAt}
                      type="button"
                      onClick={() => setSelectedSlot(slot)}
                      className={cn(
                        "rounded-2xl border px-4 py-3 text-sm font-semibold transition",
                        selectedSlot?.startsAt === slot.startsAt
                          ? "border-[color:var(--color-brand-500)] bg-[color:var(--color-brand-500)] text-white"
                          : "border-[color:var(--color-border-default)] bg-white text-[color:var(--color-fg-default)] hover:border-[color:var(--color-border-strong)]",
                      )}
                    >
                      {slot.label}
                    </button>
                  ))}
                  {!loadingSlots && slots.length === 0 ? (
                    <p className="text-sm leading-6 text-[color:var(--color-fg-muted)]">
                      Não há horários livres nesta data. Escolha outro dia ou outro profissional.
                    </p>
                  ) : null}
                </div>
              </div>
            </div>

            <aside className="rounded-[30px] border border-[color:var(--color-border-default)] bg-[linear-gradient(180deg,#f8fbff_0%,#eef5ff_100%)] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-fg-muted)]">
                Agenda do profissional
              </p>
              <div className="mt-5 space-y-3">
                {weeklyAgenda.length ? (
                  weeklyAgenda.map((item) => (
                    <div key={item.label} className="rounded-2xl border border-white bg-white px-4 py-4">
                      <p className="text-sm font-semibold text-[color:var(--color-fg-default)]">{item.label}</p>
                      <p className="mt-1 text-sm leading-6 text-[color:var(--color-fg-muted)]">{item.value}</p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-white bg-white px-4 py-4 text-sm text-[color:var(--color-fg-muted)]">
                    Esse profissional ainda não tem uma agenda pública configurada.
                  </div>
                )}
              </div>
            </aside>
          </div>
        </section>
      </section>

      <aside className="space-y-6">
        <div className="rounded-[32px] border border-[color:var(--color-border-default)] bg-white p-6 shadow-[0_12px_28px_rgba(15,23,42,0.05)] md:sticky md:top-6 md:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[color:var(--color-fg-muted)]">
            Passo 3
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-[color:var(--color-fg-default)]">
            Confirme seus dados
          </h2>

          <div className="mt-6 rounded-[28px] border border-[color:var(--color-border-default)] bg-slate-50 p-5 text-sm text-[color:var(--color-fg-muted)]">
            {selectedService && selectedProfessional ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <span>Serviço</span>
                  <strong className="text-[color:var(--color-fg-default)]">{selectedService.name}</strong>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>Profissional</span>
                  <span className="font-medium text-[color:var(--color-fg-default)]">{selectedProfessional.displayName}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>Duração</span>
                  <span>{selectedService.durationMinutes} min</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>Valor</span>
                  <span className="font-semibold text-[color:var(--color-fg-default)]">{formatCurrencyBRL(selectedService.priceCents)}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>Horário</span>
                  <span className="font-medium text-[color:var(--color-fg-default)]">
                    {selectedSlot ? formatInTimeZone(selectedSlot.startsAt, browserTimezone, "dd/MM 'às' HH:mm") : "Escolha acima"}
                  </span>
                </div>
              </div>
            ) : (
              <p>Escolha serviço, profissional e horário para montar o resumo.</p>
            )}
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[color:var(--color-fg-default)]" htmlFor="customerName">Nome completo</label>
              <Input id="customerName" value={customerName} onChange={(event) => setCustomerName(event.target.value)} placeholder="Seu nome" required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[color:var(--color-fg-default)]" htmlFor="customerEmail">E-mail</label>
              <Input id="customerEmail" type="email" value={customerEmail} onChange={(event) => setCustomerEmail(event.target.value)} placeholder="voce@email.com" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[color:var(--color-fg-default)]" htmlFor="customerPhone">Telefone</label>
              <Input id="customerPhone" inputMode="numeric" value={customerPhone} onChange={(event) => setCustomerPhone(maskPhone(event.target.value))} placeholder="(11) 99999-0000" required />
            </div>

            <label className="flex items-start gap-3 rounded-[24px] border border-[color:var(--color-border-default)] bg-slate-50 p-4 text-sm leading-6 text-[color:var(--color-fg-muted)]">
              <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} className="mt-1" />
              <span>Autorizo o uso dos meus dados para realizar este agendamento e receber confirmações.</span>
            </label>

            {props.cancellationPolicyText ? (
              <div className="rounded-[24px] border border-[color:var(--color-border-default)] bg-white p-4 text-sm leading-6 text-[color:var(--color-fg-muted)]">
                <p className="font-medium text-[color:var(--color-fg-default)]">Política de cancelamento</p>
                <p className="mt-2">{props.cancellationPolicyText}</p>
              </div>
            ) : null}

            {error ? <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

            <Button className="w-full" size="lg" disabled={submitting || !selectedSlot || !consent || !selectedProfessional}>
              {submitting ? "Confirmando..." : "Confirmar agendamento"}
            </Button>
          </form>
        </div>

        <div className="rounded-[32px] border border-[color:var(--color-border-default)] bg-white p-6 shadow-[0_12px_28px_rgba(15,23,42,0.05)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-[color:var(--color-fg-default)]">Avaliações</h2>
              <p className="mt-2 text-sm text-[color:var(--color-fg-muted)]">Opiniões de clientes que já passaram por aqui.</p>
            </div>
            <div className="flex items-center gap-1 rounded-full bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700">
              <Star className="h-4 w-4 fill-current" />
              {props.reviews.length ? (props.reviews.reduce((sum, review) => sum + review.rating, 0) / props.reviews.length).toFixed(1) : "Novo"}
            </div>
          </div>

          <div className="mt-5 space-y-4">
            {props.reviews.length ? (
              props.reviews.map((review) => (
                <article key={review.id} className="rounded-[24px] border border-[color:var(--color-border-default)] bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-[color:var(--color-fg-default)]">{review.customerNameSnapshot}</p>
                    <div className="flex items-center gap-1 text-amber-500">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Star key={`${review.id}-${index}`} className={cn("h-4 w-4", index < review.rating ? "fill-current" : "")} />
                      ))}
                    </div>
                  </div>
                  {review.body ? <p className="mt-3 text-sm leading-6 text-[color:var(--color-fg-muted)]">{review.body}</p> : null}
                </article>
              ))
            ) : (
              <p className="text-sm leading-6 text-[color:var(--color-fg-muted)]">
                As primeiras avaliações vão aparecer aqui assim que os atendimentos forem concluídos.
              </p>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
