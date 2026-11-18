"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "Inicio" },
  { href: "/deals", label: "Pipeline" },
  { href: "/contacts", label: "Contactos" },
  { href: "/quotes", label: "Cotizaciones" },
  { href: "/payments", label: "Pagos" },
  { href: "/inbox", label: "Inbox" },
  { href: "/products", label: "Catálogo" },
  { href: "/projects", label: "Proyectos" },
  { href: "/ai", label: "Grok" },
  { href: "/settings", label: "Ajustes" },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen md:grid md:grid-cols-[240px_1fr]">
      <aside className="border-b border-[var(--stroke)] md:border-b-0 md:border-r md:min-h-screen bg-[color-mix(in_srgb,var(--bg-elevated)_80%,transparent)] backdrop-blur">
        <div className="px-5 py-5">
          <div className="font-display text-2xl tracking-tight">Ventas CRM</div>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Cotiza · cobra · conecta canales
          </p>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:overflow-visible">
          {NAV.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`whitespace-nowrap rounded-xl px-3 py-2 text-sm transition ${
                  active
                    ? "bg-[var(--bg-soft)] text-[var(--accent)]"
                    : "text-[var(--muted)] hover:bg-[var(--bg-soft)] hover:text-[var(--text)]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="px-4 py-5 md:px-8 md:py-7">{children}</main>
    </div>
  );
}
