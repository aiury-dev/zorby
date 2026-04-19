"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { BusinessCategory } from "@/lib/domain-enums";
import {
  ArrowRight,
  CalendarDays,
  Compass,
  Crosshair,
  GraduationCap,
  HeartPulse,
  MapPin,
  Palette,
  Phone,
  Scissors,
  Search,
  Sparkles,
  Trophy,
  UserRound,
} from "lucide-react";
import {
  calculateDistanceInKm,
  cn,
  formatCurrencyBRL,
  formatDistanceKm,
  formatPhone,
  normalizeText,
} from "@/lib/utils";

type DiscoverableBusiness = {
  id: string;
  name: string;
  slug: string;
  category: BusinessCategory;
  description: string | null;
  addressLine1: string | null;
  city: string | null;
  neighborhood: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  logoUrl: string | null;
  coverImageUrl: string | null;
  brandPrimaryColor: string | null;
  phone: string | null;
  reviewCount: number;
  averageRating: number | null;
  professionalsCount: number;
  addressLabel: string;
  services: Array<{
    id: string;
    name: string;
    priceCents: number;
    durationMinutes: number;
  }>;
};

type BookingDiscoveryClientProps = {
  businesses: DiscoverableBusiness[];
  initialQuery?: string;
  initialCategory?: string;
  initialCity?: string;
};

const categoryCopy: Record<
  BusinessCategory,
  { label: string; description: string; icon: typeof Scissors; accent: string }
> = {
  HEALTH: {
    label: "Saúde",
    description: "Clínicas, consultórios e cuidados especializados.",
    icon: HeartPulse,
    accent: "#ec4899",
  },
  BEAUTY: {
    label: "Beleza",
    description: "Salões, barbearias, unhas, pele e estética.",
    icon: Scissors,
    accent: "#2563eb",
  },
  EDUCATION: {
    label: "Educação",
    description: "Aulas, reforço, idiomas e treinamentos.",
    icon: GraduationCap,
    accent: "#8b5cf6",
  },
  CONSULTING: {
    label: "Consultoria",
    description: "Sessões, mentorias e atendimentos profissionais.",
    icon: Sparkles,
    accent: "#0f766e",
  },
  SPORTS: {
    label: "Esportes",
    description: "Treinos, studios, aulas e acompanhamento físico.",
    icon: Trophy,
    accent: "#16a34a",
  },
  OTHER: {
    label: "Bem-estar",
    description: "Serviços locais com agenda online e confirmação rápida.",
    icon: Palette,
    accent: "#f59e0b",
  },
};

function BusinessLogo({
  name,
  logoUrl,
  accent,
}: {
  name: string;
  logoUrl?: string | null;
  accent: string;
}) {
  if (logoUrl) {
    return (
      <Image
        src={logoUrl}
        alt={name}
        loader={({ src }) => src}
        unoptimized
        width={48}
        height={48}
        className="h-12 w-12 rounded-[18px] border border-white/70 object-cover shadow-[0_8px_20px_rgba(15,23,42,0.08)]"
      />
    );
  }

  return (
    <div
      className="flex h-12 w-12 items-center justify-center rounded-[18px] text-base font-black text-white shadow-[0_8px_20px_rgba(15,23,42,0.08)]"
      style={{ background: `linear-gradient(135deg, ${accent} 0%, #111827 100%)` }}
    >
      {name.slice(0, 1).toUpperCase()}
    </div>
  );
}

export function BookingDiscoveryClient({
  businesses,
  initialQuery = "",
  initialCategory = "",
  initialCity = "",
}: BookingDiscoveryClientProps) {
  const [query, setQuery] = useState(initialQuery);
  const [city, setCity] = useState(initialCity);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationState, setLocationState] = useState<"idle" | "loading" | "active" | "error">("idle");
  const [locationError, setLocationError] = useState<string | null>(null);

  const categories = useMemo(
    () =>
      Object.entries(categoryCopy).map(([key, value]) => ({
        key,
        ...value,
      })),
    [],
  );

  const filteredBusinesses = useMemo(() => {
    const normalizedQuery = normalizeText(query);
    const normalizedCity = normalizeText(city);

    const matches = businesses
      .filter((business) => {
        const matchesCategory = !selectedCategory || business.category === selectedCategory;
        const matchesQuery =
          !normalizedQuery ||
          normalizeText(business.name).includes(normalizedQuery) ||
          normalizeText(business.description).includes(normalizedQuery) ||
          normalizeText(business.addressLabel).includes(normalizedQuery) ||
          business.services.some((service) => normalizeText(service.name).includes(normalizedQuery));

        const matchesCity =
          !normalizedCity ||
          normalizeText(business.city).includes(normalizedCity) ||
          normalizeText(business.neighborhood).includes(normalizedCity) ||
          normalizeText(business.state).includes(normalizedCity);

        return matchesCategory && matchesQuery && matchesCity;
      })
      .map((business) => {
        const distanceKm =
          coordinates && business.latitude && business.longitude
            ? calculateDistanceInKm(coordinates, {
                latitude: business.latitude,
                longitude: business.longitude,
              })
            : null;

        return {
          ...business,
          distanceKm,
        };
      });

    return matches.sort((left, right) => {
      if (left.distanceKm !== null && right.distanceKm !== null) {
        return left.distanceKm - right.distanceKm;
      }

      if (left.distanceKm !== null) return -1;
      if (right.distanceKm !== null) return 1;
      if ((right.averageRating ?? 0) !== (left.averageRating ?? 0)) {
        return (right.averageRating ?? 0) - (left.averageRating ?? 0);
      }

      return right.reviewCount - left.reviewCount;
    });
  }, [businesses, city, coordinates, query, selectedCategory]);

  const featuredBusinesses = filteredBusinesses.slice(0, 6);

  function requestNearbyBusinesses() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocationState("error");
      setLocationError("Seu navegador não permite usar localização neste dispositivo.");
      return;
    }

    setLocationState("loading");
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoordinates({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLocationState("active");
      },
      () => {
        setLocationState("error");
        setLocationError("Não foi possível obter sua localização. Você ainda pode buscar por cidade.");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5 * 60 * 1000,
      },
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f1eb] text-[#181714]" data-booking>
      <section className="relative overflow-hidden bg-[linear-gradient(180deg,#121921_0%,#0f141b_100%)] px-4 pb-8 pt-6 text-white md:px-6 md:pb-10 md:pt-8">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-[radial-gradient(circle_at_top,rgba(65,145,255,0.26),transparent_68%)]" />

        <div className="relative mx-auto max-w-6xl">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-white/55">
                Zorby Booking
              </p>
              <h1 className="mt-2 max-w-3xl text-[2rem] font-black tracking-[-0.05em] md:text-[2.9rem] md:leading-[1.02]">
                Descubra serviços, profissionais e horários perto de você.
              </h1>
            </div>

            <Link
              href="/login"
              className="inline-flex h-11 shrink-0 items-center justify-center rounded-full border border-white/14 bg-white/8 px-5 text-sm font-semibold text-white transition hover:border-white/24 hover:bg-white/12"
            >
              Sou empresa
            </Link>
          </div>

          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_190px]">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-white/45" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Pesquise serviços ou empresas"
                className="h-13 w-full rounded-2xl border border-white/12 bg-white px-11 pr-4 text-sm text-[#181714] shadow-[0_14px_40px_rgba(0,0,0,0.12)] outline-none transition focus:border-[#4191ff]"
              />
            </label>

            <label className="relative block">
              <MapPin className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-white/45" />
              <input
                value={city}
                onChange={(event) => setCity(event.target.value)}
                placeholder="Cidade ou bairro"
                className="h-13 w-full rounded-2xl border border-white/12 bg-white px-11 pr-4 text-sm text-[#181714] shadow-[0_14px_40px_rgba(0,0,0,0.12)] outline-none transition focus:border-[#4191ff]"
              />
            </label>

            <button
              type="button"
              onClick={requestNearbyBusinesses}
              className="inline-flex h-13 items-center justify-center gap-2 rounded-2xl bg-[#2d9cff] px-5 text-sm font-semibold text-white shadow-[0_16px_36px_rgba(45,156,255,0.28)] transition hover:-translate-y-0.5 hover:bg-[#1f8eef]"
            >
              <Crosshair className={cn("size-4", locationState === "loading" && "animate-spin")} />
              {locationState === "active" ? "Perto de mim" : "Usar minha localização"}
            </button>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-white/72">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-3 py-1.5">
              <Compass className="size-4" />
              Descoberta separada do painel profissional
            </span>
            {locationState === "active" ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1.5 text-emerald-100">
                <MapPin className="size-4" />
                Ordenando pelos negócios mais próximos
              </span>
            ) : null}
            {locationError ? <span className="text-amber-200">{locationError}</span> : null}
          </div>

          <div className="mt-6 flex gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {categories.map((item) => {
              const Icon = item.icon;
              const isActive = selectedCategory === item.key;
              return (
                <button
                  type="button"
                  key={item.key}
                  onClick={() => setSelectedCategory(isActive ? "" : item.key)}
                  className={cn(
                    "flex min-w-[116px] flex-col items-center rounded-[28px] border px-4 py-4 text-center transition",
                    isActive
                      ? "border-[#4191ff] bg-[#1b2430] shadow-[0_18px_36px_rgba(0,0,0,0.18)]"
                      : "border-white/12 bg-white/6 hover:border-white/20 hover:bg-white/10",
                  )}
                >
                  <span
                    className="flex h-14 w-14 items-center justify-center rounded-full"
                    style={{ backgroundColor: `${item.accent}20` }}
                  >
                    <Icon className="size-7 text-white" />
                  </span>
                  <span className="mt-3 text-sm font-semibold text-white">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-10">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#8a8680]">
              Experiência do cliente final
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-[-0.04em] md:text-4xl">
              Escolha um negócio, veja os serviços e reserve online.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[#6b6760] md:text-base">
              Aqui o cliente final explora serviços, compara avaliações e entra direto na agenda
              pública da empresa. O painel profissional continua separado, no ambiente de gestão.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 self-start md:self-end">
            <div className="rounded-[22px] border border-[#e7e2da] bg-white px-4 py-4 shadow-[0_8px_24px_rgba(17,24,39,0.04)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8a8680]">
                Negócios
              </p>
              <p className="mt-2 text-2xl font-black tracking-[-0.04em]">{businesses.length}</p>
            </div>
            <div className="rounded-[22px] border border-[#e7e2da] bg-white px-4 py-4 shadow-[0_8px_24px_rgba(17,24,39,0.04)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8a8680]">
                Resultados
              </p>
              <p className="mt-2 text-2xl font-black tracking-[-0.04em]">{filteredBusinesses.length}</p>
            </div>
            <div className="rounded-[22px] border border-[#e7e2da] bg-white px-4 py-4 shadow-[0_8px_24px_rgba(17,24,39,0.04)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8a8680]">
                Reserva
              </p>
              <p className="mt-2 text-sm font-bold leading-6 text-[#181714]">Em poucos cliques</p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[30px] border border-[#e7e2da] bg-white p-5 shadow-[0_18px_40px_rgba(17,24,39,0.05)] md:p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#8a8680]">
                  Destaques
                </p>
                <h3 className="mt-2 text-2xl font-black tracking-[-0.04em]">
                  Negócios prontos para receber agendamentos
                </h3>
              </div>
              <span className="rounded-full bg-[#eef6ff] px-3 py-1.5 text-xs font-semibold text-[#1d68d8]">
                Estilo app
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {featuredBusinesses.length ? (
                featuredBusinesses.map((business) => {
                  const categoryInfo = categoryCopy[business.category];
                  const firstService = business.services[0];
                  return (
                    <article
                      key={business.id}
                      className="overflow-hidden rounded-[26px] border border-[#e8e5e0] bg-[#faf9f7] shadow-[0_8px_24px_rgba(17,24,39,0.04)]"
                    >
                      <div className="relative h-48 overflow-hidden bg-[#ece9e3]">
                        {business.coverImageUrl ? (
                          <Image
                            src={business.coverImageUrl}
                            alt={business.name}
                            loader={({ src }) => src}
                            unoptimized
                            fill
                            sizes="(max-width: 768px) 100vw, 50vw"
                            className="object-cover"
                          />
                        ) : (
                          <div
                            className="h-full w-full"
                            style={{
                              background: `linear-gradient(135deg, ${business.brandPrimaryColor ?? "#2563eb"} 0%, #111827 100%)`,
                            }}
                          />
                        )}
                        <div className="absolute inset-x-0 bottom-0 bg-[linear-gradient(180deg,transparent,rgba(0,0,0,0.58))] p-4 text-white">
                          <div className="flex items-center justify-between gap-3">
                            <span className="rounded-full bg-white/18 px-3 py-1 text-[11px] font-semibold backdrop-blur">
                              {categoryInfo.label}
                            </span>
                            {business.averageRating ? (
                              <span className="rounded-full bg-black/34 px-3 py-1 text-[11px] font-semibold backdrop-blur">
                                ★ {business.averageRating.toFixed(1)}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>

                      <div className="p-4">
                        <div className="flex items-start gap-3">
                          <BusinessLogo
                            name={business.name}
                            logoUrl={business.logoUrl}
                            accent={business.brandPrimaryColor ?? "#2563eb"}
                          />
                          <div className="min-w-0 flex-1">
                            <h4 className="text-lg font-black tracking-[-0.03em] text-[#181714]">{business.name}</h4>
                            <p className="mt-1 text-sm text-[#6b6760]">
                              {[business.neighborhood, business.city].filter(Boolean).join(", ") ||
                                categoryInfo.description}
                            </p>
                            {business.distanceKm !== null ? (
                              <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[#eef6ff] px-2.5 py-1 text-xs font-semibold text-[#1d68d8]">
                                <MapPin className="size-3.5" />
                                {formatDistanceKm(business.distanceKm)}
                              </p>
                            ) : null}
                          </div>
                        </div>

                        <div className="mt-4 grid gap-2 text-sm">
                          {business.services.slice(0, 2).map((service) => (
                            <div
                              key={service.id}
                              className="flex items-center justify-between rounded-2xl border border-[#ece7df] bg-white px-3.5 py-3"
                            >
                              <div>
                                <p className="font-semibold text-[#181714]">{service.name}</p>
                                <p className="mt-1 text-xs text-[#8a8680]">{service.durationMinutes} min</p>
                              </div>
                              <div className="text-right">
                                <p className="font-black text-[#181714]">{formatCurrencyBRL(service.priceCents)}</p>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="mt-4 flex items-center justify-between gap-3">
                          <div className="flex flex-wrap items-center gap-3 text-xs text-[#8a8680]">
                            <span className="inline-flex items-center gap-1.5">
                              <UserRound className="size-3.5" />
                              {business.professionalsCount} profissionais
                            </span>
                            {business.phone ? (
                              <span className="inline-flex items-center gap-1.5">
                                <Phone className="size-3.5" />
                                {formatPhone(business.phone)}
                              </span>
                            ) : null}
                          </div>

                          <Link
                            href={`/${business.slug}`}
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#2d9cff] px-4 text-sm font-semibold text-white shadow-[0_12px_26px_rgba(45,156,255,0.24)] transition hover:-translate-y-0.5 hover:bg-[#1f8eef]"
                          >
                            Reservar
                            <ArrowRight className="size-4" />
                          </Link>
                        </div>

                        {firstService ? (
                          <p className="mt-3 text-xs text-[#8a8680]">
                            A partir de <span className="font-semibold text-[#181714]">{formatCurrencyBRL(firstService.priceCents)}</span>
                          </p>
                        ) : null}
                      </div>
                    </article>
                  );
                })
              ) : (
                <div className="rounded-[26px] border border-dashed border-[#ddd8cf] bg-white px-5 py-12 text-center md:col-span-2">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#eef6ff] text-[#1d68d8]">
                    <Compass className="size-6" />
                  </div>
                  <h4 className="mt-5 text-xl font-black tracking-[-0.03em] text-[#181714]">
                    Nenhum negócio encontrado
                  </h4>
                  <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-[#6b6760]">
                    Ajuste a busca, escolha outra categoria ou use sua localização para encontrar negócios próximos.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[30px] border border-[#e7e2da] bg-white p-5 shadow-[0_18px_40px_rgba(17,24,39,0.05)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#8a8680]">
                Como funciona
              </p>
              <h3 className="mt-2 text-2xl font-black tracking-[-0.04em] text-[#181714]">
                Uma experiência separada para quem agenda
              </h3>

              <div className="mt-5 space-y-3">
                {[
                  {
                    title: "Explorar negócios e serviços",
                    description: "Descubra profissionais, leia avaliações e escolha quem atende você.",
                    icon: Sparkles,
                  },
                  {
                    title: "Ver horários livres em tempo real",
                    description: "O cliente só vê a agenda que o profissional realmente liberou.",
                    icon: CalendarDays,
                  },
                  {
                    title: "Encontrar opções perto de você",
                    description: "Com endereço configurado, os negócios aparecem por proximidade no fluxo /agendar.",
                    icon: MapPin,
                  },
                ].map((item) => (
                  <div key={item.title} className="rounded-[24px] border border-[#ece7df] bg-[#faf9f7] p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eef6ff] text-[#1d68d8]">
                        <item.icon className="size-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-[#181714]">{item.title}</p>
                        <p className="mt-1 text-sm leading-6 text-[#6b6760]">{item.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[30px] border border-[#e7e2da] bg-[linear-gradient(140deg,#111827_0%,#0f172a_100%)] p-5 text-white shadow-[0_22px_50px_rgba(15,23,42,0.18)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/55">
                Descoberta + reserva
              </p>
              <h3 className="mt-2 text-2xl font-black tracking-[-0.04em]">
                Cliente encontra, compara e agenda sem ver o painel.
              </h3>
              <p className="mt-3 text-sm leading-7 text-white/72">
                O profissional usa o Zorby para operar a agenda. O cliente final entra aqui para
                explorar serviços, escolher horários e reservar com a mesma sensação de um app de
                descoberta.
              </p>

              <div className="mt-5 grid gap-3">
                {[
                  "Negócios com endereço completo aparecem na descoberta por proximidade",
                  "Reserva continua indo para a página própria do negócio",
                  "Horário escolhido some da lista depois da confirmação",
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-[22px] border border-white/10 bg-white/8 px-4 py-3 text-sm text-white/88"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
