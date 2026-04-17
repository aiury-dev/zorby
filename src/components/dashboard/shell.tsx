"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/agenda", label: "Agenda" },
  { href: "/dashboard/disponibilidade", label: "Disponibilidade" },
  { href: "/dashboard/clientes", label: "Clientes" },
  { href: "/dashboard/servicos", label: "Serviços" },
  { href: "/dashboard/profissionais", label: "Profissionais" },
  { href: "/dashboard/configuracoes", label: "Configurações" },
  { href: "/dashboard/billing", label: "Assinatura" },
  { href: "/dashboard/relatorios", label: "Relatórios" },
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
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#eef4ff_100%)]">
      <div className="mx-auto max-w-7xl px-4 py-4 md:px-6">
        <div className="mb-4 rounded-[24px] border border-[color:var(--color-border-default)] bg-[#0f172a] p-4 text-white lg:hidden">
          <p className="text-xs uppercase tracking-[0.24em] text-white/60">Zorby</p>
          <div className="mt-3 flex flex-col gap-3">
            <div>
              <h2 className="text-xl font-semibold">{props.businessName}</h2>
              <p className="mt-1 text-sm text-white/70">{props.subscriptionLabel}</p>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {navigation.map((item) => {
                const isActive = isNavItemActive(pathname, item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${
                      isActive ? "bg-white text-[#0f172a]" : "bg-white/8 text-white/80"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex gap-6">
          <aside className="sticky top-6 hidden h-[calc(100vh-3rem)] w-72 flex-col rounded-[28px] border border-[color:var(--color-border-default)] bg-[#0f172a] p-6 text-white shadow-[0_20px_60px_rgba(15,23,42,0.18)] lg:flex">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-white/60">Zorby</p>
              <h2 className="mt-3 text-2xl font-semibold">{props.businessName}</h2>
              <p className="mt-2 text-sm text-white/70">{props.subscriptionLabel}</p>
            </div>
            <nav className="mt-8 space-y-2">
              {navigation.map((item) => {
                const isActive = isNavItemActive(pathname, item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`block rounded-2xl px-4 py-3 text-sm font-medium transition ${
                      isActive
                        ? "bg-white text-[#0f172a]"
                        : "text-white/80 hover:bg-white/8 hover:text-white"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </aside>
          <div className="flex-1 rounded-[28px] border border-[color:var(--color-border-default)] bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.06),0_20px_60px_rgba(15,23,42,0.08)] md:p-8">
            {props.children}
          </div>
        </div>
      </div>
    </div>
  );
}
