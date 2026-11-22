"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GlobalSearch } from "./GlobalSearch";

const NAV_GROUPS = [
  {
    title: "Operaciones",
    items: [
      { href: "/", label: "Inicio" },
      { href: "/products", label: "Inventario" },
      { href: "/calendar", label: "Agenda" },
      { href: "/tasks", label: "Tareas" },
      { href: "/projects", label: "Proyectos" },
    ],
  },
  {
    title: "Ventas",
    items: [
      { href: "/deals", label: "Pipeline" },
      { href: "/quotes", label: "Cotizaciones" },
      { href: "/payments", label: "Pagos" },
      { href: "/invoices", label: "SUNAT" },
      { href: "/reports", label: "Reportes" },
    ],
  },
  {
    title: "Relación",
    items: [
      { href: "/contacts", label: "Contactos" },
      { href: "/accounts", label: "Empresas" },
      { href: "/inbox", label: "Inbox" },
      { href: "/automation", label: "Bot cotiza" },
    ],
  },
  {
    title: "Sistema",
    items: [
      { href: "/ai", label: "Grok" },
      { href: "/settings", label: "Ajustes" },
    ],
  },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen md:grid md:grid-cols-[220px_1fr]">
      <aside className="bg-[var(--header)] text-white md:min-h-screen">
        <div className="px-5 py-5">
          <div className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-[#9fd3ea]">
            Inventario rental
          </div>
          <div className="font-display mt-1 text-2xl tracking-tight">
            Ventas CRM
          </div>
          <p className="mt-1 text-xs text-[#b7d7e8]">
            Contratos · stock · cobranza
          </p>
        </div>
        <nav className="space-y-4 px-3 pb-5">
          {NAV_GROUPS.map((group) => (
            <div key={group.title}>
              <div className="mb-1 px-3 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-[#7eb6ce]">
                {group.title}
              </div>
              <div className="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible">
                {group.items.map((item) => {
                  const active =
                    item.href === "/"
                      ? pathname === "/"
                      : pathname === item.href ||
                        pathname.startsWith(`${item.href}/`);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`whitespace-nowrap rounded-md px-3 py-2 text-sm transition ${
                        active
                          ? "bg-white/15 font-semibold text-white"
                          : "text-[#c5dce8] hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </aside>
      <div>
        <div className="sticky top-0 z-10 border-b border-[var(--stroke)] bg-white/95 px-4 py-3 backdrop-blur md:px-8">
          <GlobalSearch />
        </div>
        <main className="animate-in px-4 py-5 md:px-8 md:py-7">{children}</main>
      </div>
    </div>
  );
}
