import Link from "next/link";
import {
  CalendarDays,
  ChevronRight,
  Clock3,
  Compass,
  GraduationCap,
  HeartPulse,
  MapPin,
  Palette,
  Phone,
  Sparkle,
  Scissors,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Trophy,
  UserRound,
} from "lucide-react";
import type { BusinessCategory } from "@/generated/prisma/enums";
import { formatCurrencyBRL } from "@/lib/utils";
import { getDiscoverableBusinesses } from "@/server/services/business";

const categoryCopy: Record<
  BusinessCategory,
  { label: string; icon: typeof Scissors; description: string }
> = {
  HEALTH: {
    label: "Saúde",
    icon: HeartPulse,
    description: "Clínicas, consultórios e cuidados especializados.",
  },
  BEAUTY: {
    label: "Beleza",
    icon: Scissors,
    description: "Salões, barbearias, unhas, pele e estética.",
  },
  EDUCATION: {
    label: "Educação",
    icon: GraduationCap,
    description: "Aulas, reforço, idiomas e treinamentos.",
  },
  CONSULTING: {
    label: "Consultoria",
    icon: Sparkle,
    description: "Sessões, mentorias e atendimentos profissionais.",
  },
  SPORTS: {
    label: "Esportes",
    icon: Trophy,
    description: "Treinos, studios, aulas e acompanhamento físico.",
  },
  OTHER: {
    label: "Bem-estar",
    icon: Palette,
    description: "Serviços locais com agenda online e confirmação rápida.",
  },
};

function normalize(text?: string | null) {
  return (text ?? "").trim().toLowerCase();
}

function averageRating(reviews: Array<{ rating: number }>) {
  if (!reviews.length) return null;
  return reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
}

export default async function BookingDiscoveryPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const query = typeof params.q === "string" ? params.q : "";
  const category = typeof params.category === "string" ? params.category : "";

  const businesses = await getDiscoverableBusinesses();

  const filteredBusinesses = businesses.filter((business) => {
    const matchesCategory = !category || business.category === category;
    const searchText = normalize(query);

    if (!searchText) return matchesCategory;

    const matchesSearch =
      normalize(business.name).includes(searchText) ||
      normalize(business.description).includes(searchText) ||
      normalize(business.city).includes(searchText) ||
      normalize(business.neighborhood).includes(searchText) ||
      business.services.some((service) => normalize(service.name).includes(searchText));

    return matchesCategory && matchesSearch;
  });

  const featuredBusinesses = filteredBusinesses.slice(0, 6);
  const topCategories = Object.entries(categoryCopy).map(([key, value]) => ({
    key,
    ...value,
  }));

  return (
    <main className="min-h-screen bg-[#f5f4f1] text-[#181714]">
      <section className="relative overflow-hidden bg-[linear-gradient(180deg,#121921_0%,#0f141b_100%)] px-4 pb-8 pt-6 text-white md:px-6 md:pb-10 md:pt-8">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-[radial-gradient(circle_at_top,rgba(65,145,255,0.26),transparent_68%)]" />

        <div className="relative mx-auto max-w-6xl">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-white/55">
                Zorby Booking
              </p>
              <h1 className="mt-2 text-[2rem] font-black tracking-[-0.05em] md:text-[2.7rem]">
                Descubra serviços e reserve seu horário.
              </h1>
            </div>

            <Link
              href="/login"
              className="inline-flex h-11 shrink-0 items-center justify-center rounded-full border border-white/14 bg-white/8 px-5 text-sm font-semibold text-white transition hover:border-white/24 hover:bg-white/12"
            >
              Sou empresa
            </Link>
          </div>

          <form className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_180px]">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-white/45" />
              <input
                name="q"
                defaultValue={query}
                placeholder="Pesquise serviços ou empresas"
                className="h-13 w-full rounded-2xl border border-white/12 bg-white px-11 pr-4 text-sm text-[#181714] shadow-[0_14px_40px_rgba(0,0,0,0.12)] outline-none transition focus:border-[#4191ff]"
              />
            </label>

            <label className="relative block">
              <MapPin className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-white/45" />
              <input
                name="city"
                placeholder="Onde?"
                className="h-13 w-full rounded-2xl border border-white/12 bg-white px-11 pr-4 text-sm text-[#181714] shadow-[0_14px_40px_rgba(0,0,0,0.12)] outline-none transition focus:border-[#4191ff]"
              />
            </label>

            <button
              type="submit"
              className="inline-flex h-13 items-center justify-center gap-2 rounded-2xl bg-[#2d9cff] px-5 text-sm font-semibold text-white shadow-[0_16px_36px_rgba(45,156,255,0.28)] transition hover:-translate-y-0.5 hover:bg-[#1f8eef]"
            >
              Explorar
              <ChevronRight className="size-4" />
            </button>
          </form>

          <div className="mt-6 flex gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {topCategories.map((item) => {
              const isActive = category === item.key;
              const Icon = item.icon;
              return (
                <Link
                  key={item.key}
                  href={isActive ? "/agendar" : `/agendar?category=${item.key}`}
                  className={`flex min-w-[116px] flex-col items-center rounded-[28px] border px-4 py-4 text-center transition ${
                    isActive
                      ? "border-[#4191ff] bg-[#1b2430] shadow-[0_18px_36px_rgba(0,0,0,0.18)]"
                      : "border-white/12 bg-white/6 hover:border-white/20 hover:bg-white/10"
                  }`}
                >
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10">
                    <Icon className="size-7 text-white" />
                  </span>
                  <span className="mt-3 text-sm font-semibold text-white">{item.label}</span>
                </Link>
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
              O cliente entra aqui para explorar, comparar e encontrar horários livres.
              Já o painel do profissional continua separado, no ambiente de gestão.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 self-start md:self-end">
            <div className="rounded-[22px] border border-[#e7e2da] bg-white px-4 py-4 shadow-[0_8px_24px_rgba(17,24,39,0.04)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8a8680]">
                Negócios
              </p>
              <p className="mt-2 text-2xl font-black tracking-[-0.04em]">
                {businesses.length}
              </p>
            </div>
            <div className="rounded-[22px] border border-[#e7e2da] bg-white px-4 py-4 shadow-[0_8px_24px_rgba(17,24,39,0.04)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8a8680]">
                Resultados
              </p>
              <p className="mt-2 text-2xl font-black tracking-[-0.04em]">
                {filteredBusinesses.length}
              </p>
            </div>
            <div className="rounded-[22px] border border-[#e7e2da] bg-white px-4 py-4 shadow-[0_8px_24px_rgba(17,24,39,0.04)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8a8680]">
                Reserva
              </p>
              <p className="mt-2 text-sm font-bold leading-6 text-[#181714]">
                Em poucos cliques
              </p>
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
                  Encontre seu próximo atendimento
                </h3>
              </div>
              <span className="rounded-full bg-[#eef6ff] px-3 py-1.5 text-xs font-semibold text-[#1d68d8]">
                Mobile first
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {featuredBusinesses.length ? (
                featuredBusinesses.map((business) => {
                  const rating = averageRating(business.reviews);
                  const firstService = business.services[0];
                  const categoryInfo = categoryCopy[business.category];
                  return (
                    <article
                      key={business.id}
                      className="overflow-hidden rounded-[26px] border border-[#e8e5e0] bg-[#faf9f7] shadow-[0_8px_24px_rgba(17,24,39,0.04)]"
                    >
                      <div className="relative h-48 overflow-hidden bg-[#ece9e3]">
                        {business.coverImageUrl ? (
                          <img
                            src={business.coverImageUrl}
                            alt={business.name}
                            className="h-full w-full object-cover"
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
                            {rating ? (
                              <span className="rounded-full bg-black/34 px-3 py-1 text-[11px] font-semibold backdrop-blur">
                                ★ {rating.toFixed(1)}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>

                      <div className="p-4">
                        <div className="flex items-start gap-3">
                          {business.logoUrl ? (
                            <img
                              src={business.logoUrl}
                              alt={business.name}
                              className="mt-0.5 h-12 w-12 rounded-2xl border border-white bg-white object-cover shadow-[0_8px_18px_rgba(17,24,39,0.08)]"
                            />
                          ) : (
                            <div
                              className="mt-0.5 flex h-12 w-12 items-center justify-center rounded-2xl text-base font-black text-white shadow-[0_8px_18px_rgba(17,24,39,0.08)]"
                              style={{ background: business.brandPrimaryColor ?? "#2563eb" }}
                            >
                              {business.name[0]}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <h4 className="text-lg font-black tracking-[-0.03em] text-[#181714]">
                              {business.name}
                            </h4>
                            <p className="mt-1 text-sm text-[#6b6760]">
                              {[business.neighborhood, business.city].filter(Boolean).join(", ") ||
                                categoryInfo.description}
                            </p>
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
                                <p className="mt-1 text-xs text-[#8a8680]">
                                  {service.durationMinutes} min
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-black text-[#181714]">
                                  {formatCurrencyBRL(service.priceCents)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="mt-4 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 text-xs text-[#8a8680]">
                            <span className="inline-flex items-center gap-1.5">
                              <UserRound className="size-3.5" />
                              {business.professionals.length} profissionais
                            </span>
                            {business.phone ? (
                              <span className="inline-flex items-center gap-1.5">
                                <Phone className="size-3.5" />
                                {business.phone}
                              </span>
                            ) : null}
                          </div>

                          <Link
                            href={`/${business.slug}`}
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#2d9cff] px-4 text-sm font-semibold text-white shadow-[0_12px_26px_rgba(45,156,255,0.24)] transition hover:-translate-y-0.5 hover:bg-[#1f8eef]"
                          >
                            Reservar
                            <ChevronRight className="size-4" />
                          </Link>
                        </div>
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
                    Ajuste a busca ou escolha outra categoria para explorar negócios disponíveis.
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
                    title: "Confirmar com poucos dados",
                    description: "Nome, telefone e confirmação em poucos toques.",
                    icon: ShieldCheck,
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="rounded-[24px] border border-[#ece7df] bg-[#faf9f7] p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eef6ff] text-[#1d68d8]">
                        <item.icon className="size-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-[#181714]">{item.title}</p>
                        <p className="mt-1 text-sm leading-6 text-[#6b6760]">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[30px] border border-[#e7e2da] bg-[linear-gradient(140deg,#111827_0%,#0f172a_100%)] p-5 text-white shadow-[0_22px_50px_rgba(15,23,42,0.18)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/55">
                Separação clara
              </p>
              <h3 className="mt-2 text-2xl font-black tracking-[-0.04em]">
                Site para vender. App-like para reservar.
              </h3>
              <p className="mt-3 text-sm leading-7 text-white/72">
                O profissional usa o painel do Zorby para operar a agenda. O cliente final
                entra aqui para descobrir serviços e marcar horários, sem ver nada de
                administração.
              </p>

              <div className="mt-5 grid gap-3">
                {[
                  "Cliente final navega por categorias e negócios",
                  "Reserva vai sempre para a página própria do negócio",
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
