"use client";

import { useEffect, useMemo, useState } from "react";
import { formatInTimeZone } from "date-fns-tz";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrencyBRL } from "@/lib/utils";

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
    services: Array<{
      serviceId: string;
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

function buildGoogleCalendarUrl(input: {
  title: string;
  details: string;
  location: string;
  startsAt: string;
  endsAt: string;
}) {
  const formatGoogleDate = (value: string) => value.replace(/[-:]/g, "").replace(".000Z", "Z");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: input.title,
    details: input.details,
    location: input.location,
    dates: `${formatGoogleDate(input.startsAt)}/${formatGoogleDate(input.endsAt)}`,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function buildIcsDataUrl(input: {
  title: string;
  description: string;
  location: string;
  startsAt: string;
  endsAt: string;
}) {
  const formatIcsDate = (value: string) => value.replace(/[-:]/g, "").replace(".000Z", "Z");

  const content = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Zorby//Agendamento//PT-BR",
    "BEGIN:VEVENT",
    `DTSTART:${formatIcsDate(input.startsAt)}`,
    `DTEND:${formatIcsDate(input.endsAt)}`,
    `SUMMARY:${input.title}`,
    `DESCRIPTION:${input.description}`,
    `LOCATION:${input.location}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\n");

  return `data:text/calendar;charset=utf-8,${encodeURIComponent(content)}`;
}

function maskPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);

  if (digits.length <= 2) {
    return digits;
  }

  if (digits.length <= 7) {
    return digits.replace(/(\d{2})(\d+)/, "($1) $2");
  }

  if (digits.length <= 10) {
    return digits.replace(/(\d{2})(\d{4})(\d+)/, "($1) $2-$3");
  }

  return digits.replace(/(\d{2})(\d{5})(\d+)/, "($1) $2-$3");
}

export function BookingExperience(props: BookingExperienceProps) {
  const [selectedServiceId, setSelectedServiceId] = useState<string>(props.services[0]?.id ?? "");
  const [selectedVariantId, setSelectedVariantId] = useState<string>("");
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<string>(
    props.professionals[0]?.id ?? "",
  );
  const [selectedDate, setSelectedDate] = useState(
    formatInTimeZone(new Date(), props.timezone, "yyyy-MM-dd"),
  );
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<null | {
    appointmentId: string;
    startsAt: string;
    cancelToken: string;
    rescheduleToken: string;
  }>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [consent, setConsent] = useState(true);

  const selectedService = props.services.find((service) => service.id === selectedServiceId) ?? null;
  const selectedVariant =
    selectedService?.variants.find((variant) => variant.id === selectedVariantId) ?? null;

  const availableProfessionals = useMemo(() => {
    if (!selectedServiceId) {
      return props.professionals;
    }

    return props.professionals.filter((professional) => {
      if (!professional.services.length) {
        return true;
      }

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

  const summary = useMemo(() => {
    if (!selectedService || !selectedProfessional) {
      return null;
    }

    return {
      serviceName: selectedVariant
        ? `${selectedService.name} - ${selectedVariant.name}`
        : selectedService.name,
      priceCents: selectedVariant?.priceCents ?? selectedService.priceCents,
      durationMinutes: selectedVariant?.durationMinutes ?? selectedService.durationMinutes,
      professionalName: selectedProfessional.displayName,
    };
  }, [selectedProfessional, selectedService, selectedVariant]);

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
        if (!cancelled) {
          setLoadingSlots(false);
        }
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
          serviceVariantId: selectedVariant?.id,
          professionalId: selectedProfessional.id,
          startsAt: selectedSlot.startsAt,
          customerName,
          customerEmail,
          customerPhone: customerPhone.replace(/\D/g, ""),
          customerTimezone: browserTimezone,
          consent,
        }),
      });

      const data = (await response.json()) as {
        error?: string;
        appointmentId: string;
        startsAt: string;
        cancelToken: string;
        rescheduleToken: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Não foi possível concluir o agendamento.");
      }

      setSuccess({
        appointmentId: data.appointmentId,
        startsAt: data.startsAt,
        cancelToken: data.cancelToken,
        rescheduleToken: data.rescheduleToken,
      });
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Falha ao concluir o agendamento.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (success && summary && selectedSlot) {
    const location = [props.neighborhood, props.city].filter(Boolean).join(", ") || props.name;
    const calendarTitle = `${summary.serviceName} com ${summary.professionalName}`;
    const calendarDetails = `Agendamento confirmado no Zorby para ${props.name}.`;
    const googleCalendarUrl = buildGoogleCalendarUrl({
      title: calendarTitle,
      details: calendarDetails,
      location,
      startsAt: success.startsAt,
      endsAt: selectedSlot.endsAt,
    });
    const icsUrl = buildIcsDataUrl({
      title: calendarTitle,
      description: calendarDetails,
      location,
      startsAt: success.startsAt,
      endsAt: selectedSlot.endsAt,
    });

    return (
      <section className="space-y-6 rounded-[32px] border border-[color:var(--color-border-default)] bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.06),0_24px_60px_rgba(15,23,42,0.08)] md:p-10">
        <div className="space-y-3">
          <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
            Agendamento confirmado
          </span>
          <h2 className="text-3xl font-semibold text-[color:var(--color-fg-default)]">
            Tudo certo, seu horário já está reservado.
          </h2>
          <p className="max-w-2xl text-sm leading-7 text-[color:var(--color-fg-muted)]">
            Revise os detalhes abaixo e adicione o compromisso na sua agenda para não esquecer.
          </p>
        </div>

        <div className="grid gap-4 rounded-[28px] border border-[color:var(--color-border-default)] bg-slate-50 p-5 md:grid-cols-2">
          <div>
            <p className="text-sm font-medium text-[color:var(--color-fg-muted)]">Serviço</p>
            <p className="mt-2 text-lg font-semibold text-[color:var(--color-fg-default)]">
              {summary.serviceName}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-[color:var(--color-fg-muted)]">Profissional</p>
            <p className="mt-2 text-lg font-semibold text-[color:var(--color-fg-default)]">
              {summary.professionalName}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-[color:var(--color-fg-muted)]">Quando</p>
            <p className="mt-2 text-lg font-semibold text-[color:var(--color-fg-default)]">
              {formatInTimeZone(success.startsAt, browserTimezone, "dd/MM/yyyy 'às' HH:mm")}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-[color:var(--color-fg-muted)]">Valor</p>
            <p className="mt-2 text-lg font-semibold text-[color:var(--color-fg-default)]">
              {formatCurrencyBRL(summary.priceCents)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <a href={googleCalendarUrl} target="_blank" rel="noreferrer">
            <Button type="button">Adicionar ao Google Agenda</Button>
          </a>
          <a href={icsUrl} download="agendamento-zorby.ics">
            <Button type="button" variant="secondary">
              Adicionar ao Apple Calendar
            </Button>
          </a>
          <a href={`/cancelar/${success.cancelToken}`}>
            <Button type="button" variant="secondary">
              Cancelar
            </Button>
          </a>
          <a href={`/reagendar/${success.rescheduleToken}`}>
            <Button type="button" variant="secondary">
              Reagendar
            </Button>
          </a>
        </div>
      </section>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
      <section className="space-y-8">
        <div className="rounded-[32px] border border-[color:var(--color-border-default)] bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.06),0_20px_50px_rgba(15,23,42,0.08)] md:p-10">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div className="space-y-4">
              <span className="inline-flex rounded-full border border-[color:var(--color-border-default)] bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-fg-muted)]">
                Agendamento online
              </span>
              <div className="space-y-3">
                <h1 className="text-4xl font-semibold tracking-tight text-[color:var(--color-fg-default)]">
                  {props.name}
                </h1>
                <p className="max-w-2xl text-base leading-7 text-[color:var(--color-fg-muted)]">
                  {props.description ||
                    "Escolha o serviço, veja os próximos horários e confirme em poucos cliques."}
                </p>
              </div>
            </div>
            <div className="rounded-[24px] border border-[color:var(--color-border-default)] bg-slate-50 px-5 py-4 text-sm text-[color:var(--color-fg-muted)]">
              <p className="font-medium text-[color:var(--color-fg-default)]">
                {[props.neighborhood, props.city].filter(Boolean).join(", ") || "Atendimento online"}
              </p>
              {props.phone ? <p className="mt-2">{props.phone}</p> : null}
            </div>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {["1. Escolha o serviço", "2. Escolha data e hora", "3. Confirme seus dados"].map((step) => (
              <div
                key={step}
                className="rounded-[24px] border border-[color:var(--color-border-default)] bg-slate-50 p-4 text-sm font-medium text-[color:var(--color-fg-default)]"
              >
                {step}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[32px] border border-[color:var(--color-border-default)] bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.06),0_20px_50px_rgba(15,23,42,0.08)] md:p-10">
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[color:var(--color-fg-muted)]">
              Passo 1
            </p>
            <h2 className="text-2xl font-semibold text-[color:var(--color-fg-default)]">
              Escolha o serviço
            </h2>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {props.services.map((service) => {
              const selected = selectedServiceId === service.id;
              return (
                <button
                  key={service.id}
                  type="button"
                  onClick={() => {
                    setSelectedServiceId(service.id);
                    setSelectedVariantId("");
                    setSelectedSlot(null);
                  }}
                  className={`rounded-[28px] border p-5 text-left transition ${
                    selected
                      ? "border-[color:var(--color-brand-500)] bg-blue-50"
                      : "border-[color:var(--color-border-default)] bg-white hover:border-[color:var(--color-border-strong)]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-[color:var(--color-fg-default)]">
                        {service.name}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-[color:var(--color-fg-muted)]">
                        {service.description || "Serviço configurado pelo profissional."}
                      </p>
                    </div>
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: service.colorHex ?? "#1664E8" }}
                    />
                  </div>
                  <div className="mt-4 flex items-center justify-between text-sm text-[color:var(--color-fg-muted)]">
                    <span>{service.durationMinutes} min</span>
                    <span className="font-semibold text-[color:var(--color-fg-default)]">
                      {formatCurrencyBRL(service.priceCents)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {selectedService?.variants.length ? (
            <div className="mt-6 space-y-3">
              <label className="text-sm font-medium text-[color:var(--color-fg-default)]" htmlFor="variant">
                Variação do serviço
              </label>
              <select
                id="variant"
                value={selectedVariantId}
                onChange={(event) => setSelectedVariantId(event.target.value)}
                className="h-11 w-full rounded-2xl border border-[color:var(--color-border-default)] bg-white px-4 text-sm text-[color:var(--color-fg-default)] focus:border-[color:var(--color-brand-500)] focus:outline-none"
              >
                <option value="">Usar configuração principal</option>
                {selectedService.variants.map((variant) => (
                  <option key={variant.id} value={variant.id}>
                    {variant.name} - {variant.durationMinutes} min - {formatCurrencyBRL(variant.priceCents)}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
        </div>

        <div className="rounded-[32px] border border-[color:var(--color-border-default)] bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.06),0_20px_50px_rgba(15,23,42,0.08)] md:p-10">
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[color:var(--color-fg-muted)]">
              Passo 2
            </p>
            <h2 className="text-2xl font-semibold text-[color:var(--color-fg-default)]">
              Escolha data e hora
            </h2>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-[1fr_1fr]">
            <div className="space-y-3">
              <label className="text-sm font-medium text-[color:var(--color-fg-default)]" htmlFor="professional">
                Profissional
              </label>
              <select
                id="professional"
                value={selectedProfessionalId}
                onChange={(event) => {
                  setSelectedProfessionalId(event.target.value);
                  setSelectedSlot(null);
                }}
                className="h-11 w-full rounded-2xl border border-[color:var(--color-border-default)] bg-white px-4 text-sm text-[color:var(--color-fg-default)] focus:border-[color:var(--color-brand-500)] focus:outline-none"
              >
                {availableProfessionals.map((professional) => (
                  <option key={professional.id} value={professional.id}>
                    {professional.displayName}
                    {professional.roleLabel ? ` - ${professional.roleLabel}` : ""}
                  </option>
                ))}
              </select>
              {!availableProfessionals.length ? (
                <p className="text-sm text-[color:var(--color-danger)]">
                  Nenhum profissional atende esse serviço no momento.
                </p>
              ) : null}
            </div>
            <div className="space-y-3">
              <label className="text-sm font-medium text-[color:var(--color-fg-default)]" htmlFor="date">
                Data
              </label>
              <Input
                id="date"
                type="date"
                min={formatInTimeZone(new Date(), props.timezone, "yyyy-MM-dd")}
                value={selectedDate}
                onChange={(event) => {
                  setSelectedDate(event.target.value);
                  setSelectedSlot(null);
                }}
              />
            </div>
          </div>

          <div className="mt-6 rounded-[28px] border border-[color:var(--color-border-default)] bg-slate-50 p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-[color:var(--color-fg-default)]">
                  Próximos horários disponíveis
                </h3>
                <p className="mt-1 text-sm text-[color:var(--color-fg-muted)]">
                  Os horários abaixo são atualizados em tempo real.
                </p>
              </div>
              {loadingSlots ? (
                <span className="text-sm text-[color:var(--color-fg-muted)]">Carregando...</span>
              ) : null}
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              {slots.map((slot) => (
                <button
                  key={slot.startsAt}
                  type="button"
                  onClick={() => setSelectedSlot(slot)}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                    selectedSlot?.startsAt === slot.startsAt
                      ? "border-[color:var(--color-brand-500)] bg-[color:var(--color-brand-500)] text-white"
                      : "border-[color:var(--color-border-default)] bg-white text-[color:var(--color-fg-default)] hover:border-[color:var(--color-border-strong)]"
                  }`}
                >
                  {slot.label}
                </button>
              ))}

              {!loadingSlots && slots.length === 0 ? (
                <p className="text-sm leading-6 text-[color:var(--color-fg-muted)]">
                  Nenhum horário livre nesta data. Escolha outro dia ou profissional.
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <aside className="space-y-6">
        <div className="rounded-[32px] border border-[color:var(--color-border-default)] bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.06),0_20px_50px_rgba(15,23,42,0.08)] md:sticky md:top-6 md:p-8">
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[color:var(--color-fg-muted)]">
              Passo 3
            </p>
            <h2 className="text-2xl font-semibold text-[color:var(--color-fg-default)]">
              Confirme seus dados
            </h2>
          </div>

          <div className="mt-6 rounded-[24px] border border-[color:var(--color-border-default)] bg-slate-50 p-4 text-sm text-[color:var(--color-fg-muted)]">
            {summary ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <span>{summary.serviceName}</span>
                  <strong className="text-[color:var(--color-fg-default)]">
                    {formatCurrencyBRL(summary.priceCents)}
                  </strong>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>{summary.professionalName}</span>
                  <span>{summary.durationMinutes} min</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>Horário</span>
                  <span className="font-medium text-[color:var(--color-fg-default)]">
                    {selectedSlot
                      ? formatInTimeZone(selectedSlot.startsAt, browserTimezone, "dd/MM HH:mm")
                      : "Escolha acima"}
                  </span>
                </div>
              </div>
            ) : (
              <p>Selecione um serviço e um horário para ver o resumo.</p>
            )}
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[color:var(--color-fg-default)]" htmlFor="customerName">
                Nome completo
              </label>
              <Input
                id="customerName"
                value={customerName}
                onChange={(event) => setCustomerName(event.target.value)}
                placeholder="Seu nome"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[color:var(--color-fg-default)]" htmlFor="customerEmail">
                E-mail
              </label>
              <Input
                id="customerEmail"
                type="email"
                value={customerEmail}
                onChange={(event) => setCustomerEmail(event.target.value)}
                placeholder="voce@email.com"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[color:var(--color-fg-default)]" htmlFor="customerPhone">
                Telefone
              </label>
              <Input
                id="customerPhone"
                inputMode="numeric"
                value={customerPhone}
                onChange={(event) => setCustomerPhone(maskPhone(event.target.value))}
                placeholder="(11) 99999-0000"
                required
              />
            </div>
            <label className="flex items-start gap-3 rounded-[24px] border border-[color:var(--color-border-default)] bg-slate-50 p-4 text-sm leading-6 text-[color:var(--color-fg-muted)]">
              <input
                type="checkbox"
                checked={consent}
                onChange={(event) => setConsent(event.target.checked)}
                className="mt-1"
              />
              <span>
                Autorizo o uso dos meus dados para realizar este agendamento e receber confirmações.
              </span>
            </label>

            {props.cancellationPolicyText ? (
              <div className="rounded-[24px] border border-[color:var(--color-border-default)] bg-white p-4 text-sm leading-6 text-[color:var(--color-fg-muted)]">
                <p className="font-medium text-[color:var(--color-fg-default)]">Política de cancelamento</p>
                <p className="mt-2">{props.cancellationPolicyText}</p>
              </div>
            ) : null}

            {error ? (
              <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </p>
            ) : null}

            <Button
              className="w-full"
              size="lg"
              disabled={submitting || !selectedSlot || !consent || !selectedProfessional}
            >
              {submitting ? "Confirmando..." : "Confirmar agendamento"}
            </Button>
          </form>
        </div>

        <div className="rounded-[32px] border border-[color:var(--color-border-default)] bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.06),0_20px_50px_rgba(15,23,42,0.08)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-[color:var(--color-fg-default)]">Avaliações</h2>
              <p className="mt-2 text-sm text-[color:var(--color-fg-muted)]">
                Opinião de clientes que já passaram por aqui.
              </p>
            </div>
            <div className="flex items-center gap-1 rounded-full bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700">
              <Star className="h-4 w-4 fill-current" />
              {props.reviews.length
                ? (props.reviews.reduce((sum, review) => sum + review.rating, 0) / props.reviews.length).toFixed(1)
                : "Novo"}
            </div>
          </div>

          <div className="mt-5 space-y-4">
            {props.reviews.length ? (
              props.reviews.map((review) => (
                <article
                  key={review.id}
                  className="rounded-[24px] border border-[color:var(--color-border-default)] bg-slate-50 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-[color:var(--color-fg-default)]">{review.customerNameSnapshot}</p>
                    <div className="flex items-center gap-1 text-amber-500">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Star
                          key={`${review.id}-${index}`}
                          className={`h-4 w-4 ${index < review.rating ? "fill-current" : ""}`}
                        />
                      ))}
                    </div>
                  </div>
                  {review.body ? (
                    <p className="mt-3 text-sm leading-6 text-[color:var(--color-fg-muted)]">{review.body}</p>
                  ) : null}
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
