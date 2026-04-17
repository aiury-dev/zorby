"use client";

import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CalendarDays,
  Clock3,
  CreditCard,
  LayoutDashboard,
  Settings2,
  Sparkles,
  UserRound,
  Users,
  Wrench,
} from "lucide-react";

const navigation: Array<{ href: string; label: string; icon: LucideIcon }> = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/dashboard/disponibilidade", label: "Disponibilidade", icon: Clock3 },
  { href: "/dashboard/clientes", label: "Clientes", icon: Users },
  { href: "/dashboard/servicos", label: "Serviços", icon: Wrench },
  { href: "/dashboard/profissionais", label: "Profissionais", icon: UserRound },
  { href: "/dashboard/configuracoes", label: "Configurações", icon: Settings2 },
  { href: "/dashboard/billing", label: "Assinatura", icon: CreditCard },
  { href: "/dashboard/relatorios", label: "Relatórios", icon: BarChart3 },
];

function isNavItemActive(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === href;
  }

  return pathname.startsWith(href);
}

export function DashboardShell(props: {
  businessName: string;
  subscriptionLabel: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#dbeafe_0%,transparent_24%),linear-gradient(180deg,#f8fafc_0%,#eef4ff_100%)]">
      <div className="mx-auto max-w-[1480px] px-4 py-4 md:px-6 md:py-6">
        <div className="mb-4 rounded-[28px] border border-white/70 bg-white/90 p-4 shadow-[0_18px_40px_rgba(15,23,42,0.08)] backdrop-blur lg:hidden">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--color-fg-muted)]">
                Zorby
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-[color:var(--color-fg-default)]">
                {props.businessName}
              </h2>
              <p className="mt-1 text-sm text-[color:var(--color-fg-muted)]">
                {props.subscriptionLabel}
              </p>
            </div>
            <div className="rounded-2xl bg-[linear-gradient(135deg,#0f172a_0%,#1d4ed8_100%)] p-3 text-white">
              <Sparkles className="size-5" />
            </div>
          </div>

          <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
            {navigation.map((item) => {
              const isActive = isNavItemActive(pathname, item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    "inline-flex items-center gap-2 whitespace-nowrap rounded-full border px-4 py-2.5 text-sm font-medium transition",
                    isActive
                      ? "border-transparent bg-[color:var(--color-brand-500)] text-white"
                      : "border-[color:var(--color-border-default)] bg-white text-[color:var(--color-fg-default)]",
                  ].join(" ")}
                >
                  <Icon className="size-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="sticky top-6 hidden h-[calc(100vh-3rem)] overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,#0b1220_0%,#101e3a_36%,#132f58_100%)] text-white shadow-[0_30px_70px_rgba(15,23,42,0.22)] lg:flex lg:flex-col">
            <div className="border-b border-white/10 px-6 py-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/45">
                    Zorby
                  </p>
                  <h2 className="mt-3 text-[1.8rem] font-semibold leading-tight">
                    {props.businessName}
                  </h2>
                  <p className="mt-2 text-sm text-white/65">{props.subscriptionLabel}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
                  <Sparkles className="size-5" />
                </div>
              </div>

              <div className="mt-6 rounded-[24px] border border-white/10 bg-white/[0.06] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/45">
                  Operação central
                </p>
                <p className="mt-3 text-sm leading-7 text-white/72">
                  Agenda, clientes, serviços e cobrança no mesmo fluxo.
                </p>
              </div>
            </div>

            <nav className="flex-1 space-y-2 px-4 py-5">
              {navigation.map((item) => {
                const isActive = isNavItemActive(pathname, item.href);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={[
                      "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
                      isActive
                        ? "bg-white text-[#0f172a] shadow-[0_10px_20px_rgba(255,255,255,0.08)]"
                        : "text-white/75 hover:bg-white/8 hover:text-white",
                    ].join(" ")}
                  >
                    <Icon className="size-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="border-t border-white/10 px-6 py-5">
              <div className="rounded-[24px] border border-white/10 bg-white/[0.06] p-4">
                <p className="text-sm font-semibold">Painel pronto para escala</p>
                <p className="mt-2 text-sm leading-6 text-white/65">
                  Mantenha agenda, disponibilidade e cobrança sempre alinhadas.
                </p>
              </div>
            </div>
          </aside>

          <div className="rounded-[32px] border border-white/80 bg-white/92 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.10)] backdrop-blur md:p-8">
            {props.children}
          </div>
        </div>
      </div>
    </div>
  );
}
