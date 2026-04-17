"use client";

import { useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bell,
  CalendarDays,
  ChevronRight,
  Clock3,
  CreditCard,
  LayoutDashboard,
  Menu,
  Search,
  Settings2,
  Sparkles,
  UserRound,
  Users,
  WandSparkles,
  Wrench,
  X,
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

function getPageLabel(pathname: string) {
  const currentItem =
    navigation.find((item) => item.href !== "/dashboard" && pathname.startsWith(item.href)) ??
    navigation.find((item) => item.href === pathname);

  return currentItem?.label ?? "Dashboard";
}

function getInitials(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function DashboardShell(props: {
  businessName: string;
  subscriptionLabel: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const pageLabel = useMemo(() => getPageLabel(pathname), [pathname]);
  const initials = useMemo(() => getInitials(props.businessName) || "ZO", [props.businessName]);

  return (
    <div className="min-h-screen bg-[var(--navy)] text-slate-100">
      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 flex w-[248px] flex-col border-r border-white/6 bg-[var(--navy-2)] transition-transform duration-300 ease-out",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        ].join(" ")}
      >
        <div className="border-b border-white/6 px-4 pb-4 pt-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-[10px] bg-[color:var(--color-brand-500)] text-white shadow-[0_14px_28px_rgba(37,99,235,0.28)]">
              <WandSparkles className="size-4" />
            </div>
            <div className="font-semibold tracking-[-0.03em] text-white [font-family:var(--font-display)]">
              zorby.
            </div>
          </div>

          <div className="rounded-[14px] border border-white/8 bg-[var(--navy-3)] p-3">
            <div className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-[10px] bg-[color:var(--color-brand-500)] text-xs font-semibold text-white [font-family:var(--font-display)]">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold text-white">{props.businessName}</p>
                <p className="mt-0.5 truncate text-[11px] text-slate-400">{props.subscriptionLabel}</p>
              </div>
              <ChevronRight className="size-4 text-slate-500" />
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-3">
          <p className="px-3 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-600">
            Navegação
          </p>
          <div className="space-y-1">
            {navigation.map((item) => {
              const isActive = isNavItemActive(pathname, item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    "relative flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-[13.5px] transition",
                    isActive
                      ? "bg-[rgba(37,99,235,0.12)] font-medium text-[#93B4FF]"
                      : "text-slate-400 hover:bg-white/4 hover:text-slate-100",
                  ].join(" ")}
                >
                  {isActive ? (
                    <span className="absolute inset-y-[20%] left-0 w-0.5 rounded-r-full bg-[color:var(--color-brand-500)]" />
                  ) : null}
                  <Icon className="size-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="border-t border-white/6 px-3 pb-4 pt-3">
          <div className="rounded-[14px] border border-[rgba(37,99,235,0.25)] bg-[linear-gradient(135deg,rgba(37,99,235,0.15),rgba(37,99,235,0.08))] p-3">
            <p className="text-xs font-semibold text-slate-100">Painel pronto para escala</p>
            <p className="mt-1 text-[11px] leading-5 text-slate-400">
              Mantenha agenda, disponibilidade e cobrança sempre alinhadas.
            </p>
            <Link
              href="/dashboard/billing"
              className="mt-3 inline-flex h-8 w-full items-center justify-center rounded-[10px] bg-[color:var(--color-brand-500)] px-3 text-xs font-semibold text-white transition hover:bg-[color:var(--color-brand-600)]"
            >
              Ver assinatura
            </Link>
          </div>
        </div>
      </aside>

      {sidebarOpen ? (
        <button
          aria-label="Fechar menu"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}

      <div className="min-h-screen lg:pl-[248px]">
        <header className="sticky top-0 z-30 border-b border-white/6 bg-[rgba(13,17,23,0.9)] backdrop-blur">
          <div className="flex h-14 items-center justify-between px-4 md:px-7">
            <div className="flex items-center gap-3">
              <button
                className="inline-flex size-8 items-center justify-center rounded-[10px] border border-white/8 text-slate-400 transition hover:bg-white/4 hover:text-white lg:hidden"
                onClick={() => setSidebarOpen(true)}
                aria-label="Abrir menu"
              >
                <Menu className="size-4" />
              </button>

              <div className="flex items-center gap-2 text-sm">
                <span className="text-slate-600">Painel</span>
                <span className="text-slate-600">/</span>
                <span className="font-medium text-slate-100">{pageLabel}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button className="inline-flex size-8 items-center justify-center rounded-[10px] border border-white/8 text-slate-400 transition hover:bg-white/4 hover:text-white">
                <Search className="size-4" />
              </button>
              <button className="inline-flex size-8 items-center justify-center rounded-[10px] border border-white/8 text-slate-400 transition hover:bg-white/4 hover:text-white">
                <Bell className="size-4" />
              </button>
              <button className="hidden size-8 items-center justify-center rounded-full border border-white/8 bg-[var(--navy-4)] text-[11px] font-semibold text-slate-400 md:inline-flex [font-family:var(--font-display)]">
                {initials}
              </button>
              <button
                className="inline-flex size-8 items-center justify-center rounded-[10px] border border-white/8 text-slate-400 transition hover:bg-white/4 hover:text-white lg:hidden"
                onClick={() => setSidebarOpen(false)}
                aria-label="Fechar menu"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>
        </header>

        <main className="px-4 py-4 md:px-7 md:py-7">
          <div className="mx-auto max-w-[1100px]">{props.children}</div>
        </main>
      </div>
    </div>
  );
}
