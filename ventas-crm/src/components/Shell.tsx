"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GlobalSearch } from "./GlobalSearch";

const NAV = [
  { href: "/", label: "Inicio" },
  { href: "/products", label: "Equipos" },
  { href: "/deals", label: "Pipeline" },
  { href: "/calendar", label: "Eventos" },
  { href: "/tasks", label: "Tareas" },
  { href: "/quotes", label: "Cotizaciones" },
  { href: "/payments", label: "Pagos" },
  { href: "/invoices", label: "SUNAT" },
  { href: "/inbox", label: "Inbox" },
  { href: "/automation", label: "Bot" },
  { href: "/contacts", label: "Contactos" },
  { href: "/accounts", label: "Empresas" },
  { href: "/reports", label: "Reportes" },
  { href: "/projects", label: "Proyectos" },
  { href: "/ai", label: "Grok" },
  { href: "/settings", label: "Más" },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen md:grid md:grid-cols-[220px_1fr]">
      <aside className="border-b border-[var(--stroke)] bg-[color-mix(in_srgb,var(--bg-elevated)_92%,transparent)] backdrop-blur md:border-b-0 md:border-r md:min-h-screen">
        <div className="px-5 py-5">
          <div className="eyebrow">KLA PRO</div>
          <div className="font-display mt-2 text-2xl tracking-tight">
            CRM
          </div>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Ventas · equipos · cobranza
          </p>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-4 md:flex-col md:overflow-visible">
          {NAV.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`whitespace-nowrap rounded-xl px-3 py-2 text-sm transition ${
                  active
                    ? "bg-[var(--accent-soft)] font-semibold text-[var(--accent-strong)] ring-1 ring-[rgba(255,61,110,0.35)]"
                    : "text-[var(--muted)] hover:bg-[var(--bg-soft)] hover:text-[var(--text)]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div>
        <div className="sticky top-0 z-10 border-b border-[var(--stroke)] bg-[color-mix(in_srgb,var(--bg)_88%,transparent)] px-4 py-3 backdrop-blur md:px-8">
          <GlobalSearch />
        </div>
        <main className="animate-in px-4 py-5 md:px-8 md:py-7">{children}</main>
      </div>
    </div>
  );
}
