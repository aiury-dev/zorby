"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import {
  BarChart3,
  CalendarDays,
  ChevronRight,
  Clock3,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Sparkles,
  UserCheck,
  Users,
  WandSparkles,
  Wrench,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const navigation: Array<{
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
}> = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/dashboard/disponibilidade", label: "Disponibilidade", icon: Clock3 },
  { href: "/dashboard/clientes", label: "Clientes", icon: Users },
  { href: "/dashboard/servicos", label: "Serviços", icon: Wrench },
  { href: "/dashboard/profissionais", label: "Profissionais", icon: UserCheck },
  { href: "/dashboard/relatorios", label: "Relatórios", icon: BarChart3 },
  { href: "/dashboard/configuracoes", label: "Configurações", icon: Settings },
  { href: "/dashboard/billing", label: "Assinatura", icon: CreditCard },
] as const;

function getInitials(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function getPageLabel(pathname: string) {
  const currentItem =
    navigation.find((item) => item.href !== "/dashboard" && pathname.startsWith(item.href)) ??
    navigation.find((item) => item.href === pathname);

  return currentItem?.label ?? "Dashboard";
}

function NavItem(props: {
  href: string;
  label: string;
  active: boolean;
  exact?: boolean;
  icon: (typeof navigation)[number]["icon"];
  onClick?: () => void;
}) {
  const Icon = props.icon;

  return (
    <Link
      href={props.href}
      onClick={props.onClick}
      className={[
        "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
        props.active
          ? "bg-white/10 text-white"
          : "text-white/50 hover:bg-white/6 hover:text-white/80",
      ].join(" ")}
    >
      {props.active ? (
        <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-[var(--z-blue)]" />
      ) : null}
      <Icon
        size={16}
        className={[
          "shrink-0 transition-colors",
          props.active
            ? "text-[var(--z-blue)]"
            : "text-white/35 group-hover:text-white/60",
        ].join(" ")}
      />
      <span className="flex-1 truncate">{props.label}</span>
      {props.active ? <ChevronRight size={12} className="text-white/30" /> : null}
    </Link>
  );
}

export function DashboardShell(props: {
  businessName: string;
  subscriptionLabel: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const initials = useMemo(() => getInitials(props.businessName) || "ZO", [props.businessName]);
  const pageLabel = useMemo(() => getPageLabel(pathname), [pathname]);

  const sidebarContent = (
    <>
      <div className="flex items-center gap-2.5 px-1 pb-6 pt-1">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--z-blue-dim)] text-[var(--z-blue)]">
          <WandSparkles size={15} />
        </div>
        <span className="text-sm font-semibold tracking-tight text-white">Zorby</span>
        <span className="ml-auto rounded-md bg-white/8 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white/40">
          Admin
        </span>
      </div>

      <div className="mb-5 rounded-xl border border-white/8 bg-white/5 px-3.5 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--z-blue)] text-xs font-semibold text-white [font-family:var(--font-display)]">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{props.businessName}</p>
            <div className="mt-1 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <p className="truncate text-xs text-white/50">{props.subscriptionLabel}</p>
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5">
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-white/25">
          Menu
        </p>
        {navigation.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);

          return (
            <NavItem
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              exact={item.exact}
              active={active}
              onClick={() => setMobileOpen(false)}
            />
          );
        })}
      </nav>

      <div className="mt-4 border-t border-white/8 pt-4">
        <div className="rounded-xl border border-[rgba(79,142,247,0.22)] bg-[linear-gradient(180deg,rgba(79,142,247,0.12),rgba(79,142,247,0.04))] p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[rgba(79,142,247,0.16)] text-[var(--z-blue)]">
              <Sparkles size={16} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-100">Painel pronto para escalar</p>
              <p className="mt-1 text-[11px] leading-5 text-slate-400">
                Mantenha agenda, disponibilidade e cobrança sempre alinhadas.
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/billing"
            onClick={() => setMobileOpen(false)}
            className="mt-3 inline-flex h-9 w-full items-center justify-center rounded-[10px] bg-[var(--z-blue)] px-3 text-xs font-semibold text-white transition hover:bg-[var(--z-blue-hover)]"
          >
            Ver assinatura
          </Link>
        </div>

        <Link
          href="/api/auth/signout"
          className="mt-3 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/40 transition hover:bg-white/6 hover:text-white/70"
        >
          <LogOut size={16} />
          Sair
        </Link>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[var(--z-bg)] text-slate-100">
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-[var(--z-border)] bg-[var(--z-surface)] px-4 py-5 lg:flex">
        {sidebarContent}
      </aside>

      {mobileOpen ? (
        <button
          aria-label="Fechar menu"
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-[var(--z-border)] bg-[var(--z-surface)] px-4 py-5 transition-transform duration-200 lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-white/40 hover:bg-white/8 hover:text-white"
          aria-label="Fechar menu"
        >
          <X size={18} />
        </button>
        {sidebarContent}
      </aside>

      <div className="min-h-screen lg:pl-60">
        <header className="sticky top-0 z-30 border-b border-[var(--z-border)] bg-[rgba(10,15,26,0.84)] backdrop-blur">
          <div className="flex h-14 items-center justify-between px-4 md:px-7">
            <div className="flex items-center gap-3">
              <button
                className="inline-flex h-8 w-8 items-center justify-center rounded-[10px] border border-white/8 text-slate-400 transition hover:bg-white/4 hover:text-white lg:hidden"
                onClick={() => setMobileOpen(true)}
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

            <div className="hidden items-center gap-2 md:flex">
              <div className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/8 bg-[var(--navy-4)] text-[11px] font-semibold text-slate-400 [font-family:var(--font-display)]">
                {initials}
              </div>
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
