"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, formatDate } from "@/lib/client";
import { money } from "@/lib/money";
import { STAGE_LABELS, type DealStage } from "@/lib/types";

type Dashboard = {
  currency: string;
  orgName: string;
  viewer: string;
  kpis: {
    pipelineValue: number;
    openDeals: number;
    paymentsTotal: number;
    paymentsCount: number;
    openQuotes: number;
    draftQuotes: number;
    wonAmount: number;
    openInbox: number;
    quoteProfit?: number;
    quoteMarginPercent?: number;
  };
  activity: { id: string; summary: string; created_at: string; action: string }[];
  myWeek?: {
    tasks: { id: string; title: string; due_at: string | null; priority: string }[];
    events: { id: string; title: string; event_type: string; starts_at: string }[];
  };
};

type Product = {
  id: string;
  active: boolean;
  category: string;
};

type Deal = {
  id: string;
  title: string;
  stage: DealStage;
  amount: number | string;
  contact_name?: string | null;
  event_date?: string | null;
  updated_at: string;
};

export default function HomePage() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api<Dashboard>("/api/dashboard"),
      api<{ products: Product[] }>("/api/products"),
      api<{ deals: Deal[] }>("/api/deals"),
    ])
      .then(([dash, p, d]) => {
        setData(dash);
        setProducts(p.products);
        setDeals(
          d.deals.filter((x) => x.stage !== "won" && x.stage !== "lost").slice(0, 6),
        );
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  if (error) {
    return (
      <div className="panel p-6 text-[var(--danger)]">
        No se pudo cargar el dashboard: {error}
      </div>
    );
  }

  if (!data) {
    return <div className="text-[var(--muted)]">Cargando panel…</div>;
  }

  const currency = data.currency;
  const equipos = products.length;
  const activos = products.filter((p) => p.active).length;
  const renta = products.filter((p) => p.category === "renta").length;
  const disponibilidad =
    equipos > 0 ? Math.round((activos / equipos) * 100) : 0;

  const hoy = new Date();
  const dias = [
    "domingo",
    "lunes",
    "martes",
    "miércoles",
    "jueves",
    "viernes",
    "sábado",
  ];
  const eyebrow = `${dias[hoy.getDay()]} · ${hoy.toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })}`;

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="eyebrow">{eyebrow}</div>
          <h1 className="font-display mt-1 text-3xl md:text-4xl">
            Hola, {data.viewer.split(" ")[0]}
          </h1>
          <p className="mt-1 text-[var(--muted)]">
            {data.orgName} · estilo Inventario Rental
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/products" className="btn btn-primary">
            Nuevo equipo
          </Link>
          <Link href="/deals" className="btn btn-ghost">
            Nuevo deal
          </Link>
        </div>
      </header>

      <div className="panel flex flex-wrap items-center gap-3 p-4">
        <div className="grid h-12 w-12 place-items-center rounded-xl bg-[var(--accent-soft)] text-lg font-extrabold text-[var(--accent-strong)] ring-1 ring-[rgba(255,61,110,0.35)]">
          IR
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-base font-extrabold tracking-tight">
            {data.orgName}
          </div>
          <div className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-[var(--accent-2)]">
            Iluminación · ventas + inventario
          </div>
        </div>
        <Link href="/settings" className="btn btn-soft">
          Tu logo
        </Link>
      </div>

      <section className="stat-grid">
        <Link href="/products" className="stat">
          <span className="stat-tone" style={{ background: "var(--accent-strong)" }} />
          <div className="stat-label">Equipos</div>
          <div className="stat-value">{equipos}</div>
          <div className="stat-sub">{activos} activos</div>
        </Link>
        <div className="stat">
          <span
            className="stat-tone"
            style={{
              background:
                disponibilidad >= 90
                  ? "var(--ok)"
                  : disponibilidad >= 75
                    ? "var(--warn)"
                    : "var(--danger)",
            }}
          />
          <div className="stat-label">Disponibilidad</div>
          <div
            className="stat-value"
            style={{
              color:
                disponibilidad >= 90
                  ? "var(--ok)"
                  : disponibilidad >= 75
                    ? "var(--warn)"
                    : "var(--danger)",
            }}
          >
            {disponibilidad}%
          </div>
          <div className="stat-sub">{renta} en categoría renta</div>
        </div>
        <Link href="/deals" className="stat">
          <span className="stat-tone" style={{ background: "var(--accent-2)" }} />
          <div className="stat-label">Pipeline</div>
          <div className="stat-value" style={{ color: "var(--accent-2)" }}>
            {data.kpis.openDeals}
          </div>
          <div className="stat-sub">
            {money(data.kpis.pipelineValue, currency)} esperado
          </div>
        </Link>
        <div className="stat">
          <span className="stat-tone" style={{ background: "var(--ok)" }} />
          <div className="stat-label">Margen cotizado</div>
          <div className="stat-value" style={{ color: "var(--ok)" }}>
            {money(data.kpis.quoteProfit ?? 0, currency)}
          </div>
          <div className="stat-sub">
            {data.kpis.quoteMarginPercent ?? 0}% sobre venta
          </div>
        </div>
      </section>

      <section className="panel p-4">
        <div className="section-title">
          <span className="text-[var(--ok)]">●</span> Atención hoy
        </div>
        <div className="rounded-xl border border-[rgba(52,211,153,0.35)] bg-[rgba(52,211,153,0.08)] px-3 py-3 text-sm text-[var(--ok)]">
          Todo en orden: sin alertas críticas. Inbox abierto:{" "}
          {data.kpis.openInbox}.
        </div>
      </section>

      <section className="panel p-4">
        <div className="section-title">
          <span className="text-[var(--accent-strong)]">⚡</span> Acciones
          rápidas
        </div>
        <div className="tile-grid">
          {[
            ["/products", "Equipos", "Inventario + margen", "var(--accent-strong)"],
            ["/quotes", "Cotizar", "Con costo snapshot", "var(--accent-2)"],
            ["/calendar", "Eventos", "Agenda de shows", "var(--info)"],
            ["/automation", "Bot cotiza", "WA / IG → draft", "var(--warn)"],
            ["/inbox", "Inbox", "Canales abiertos", "var(--ok)"],
            ["/invoices", "SUNAT", "Boleta / factura", "var(--info)"],
          ].map(([href, label, sub, color]) => (
            <Link key={href} href={href} className="tile">
              <div
                className="tile-icon"
                style={{
                  color: color as string,
                  background: `color-mix(in srgb, ${color} 14%, transparent)`,
                  borderColor: `color-mix(in srgb, ${color} 35%, transparent)`,
                }}
              >
                {(label as string).slice(0, 1)}
              </div>
              <div className="tile-label">{label}</div>
              <div className="tile-sub">{sub}</div>
            </Link>
          ))}
        </div>
      </section>

      <section className="panel p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="section-title mb-0">
            <span className="text-[var(--info)]">◌</span> Próximos / abiertos
          </div>
          <Link href="/deals" className="text-sm font-semibold text-[var(--accent-2)]">
            Todos
          </Link>
        </div>
        <div className="space-y-2">
          {deals.map((deal) => (
            <Link
              key={deal.id}
              href={`/deals/${deal.id}`}
              className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-[var(--surface-raised)]"
            >
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-[var(--accent-soft)] font-mono text-xs font-bold text-[var(--accent-strong)] ring-1 ring-[rgba(255,61,110,0.3)]">
                {deal.stage.slice(0, 3).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold">
                  {deal.contact_name || deal.title}
                </div>
                <div className="truncate text-xs text-[var(--text-dim)]">
                  {[formatDate(deal.event_date), deal.title, money(deal.amount, currency)]
                    .filter(Boolean)
                    .join(" · ")}
                </div>
              </div>
              <span
                className={`badge ${
                  deal.stage === "negotiation"
                    ? "badge-warn"
                    : deal.stage === "quoted"
                      ? "badge-info"
                      : "badge-accent"
                }`}
              >
                {STAGE_LABELS[deal.stage]}
              </span>
            </Link>
          ))}
          {!deals.length && (
            <p className="text-sm text-[var(--muted)]">No hay deals abiertos.</p>
          )}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="panel p-4">
          <div className="section-title">Actividad reciente</div>
          <ul className="space-y-3">
            {data.activity.slice(0, 6).map((item) => (
              <li key={item.id} className="flex gap-2 text-sm">
                <span className="mt-1.5 h-2 w-2 rounded-full bg-[var(--accent-strong)]" />
                <div>
                  <div>{item.summary}</div>
                  <div className="text-xs text-[var(--muted)]">
                    {item.action} · {formatDate(item.created_at)}
                  </div>
                </div>
              </li>
            ))}
            {!data.activity.length && (
              <li className="text-sm text-[var(--muted)]">Aún no hay movimientos.</li>
            )}
          </ul>
        </div>
        <div className="panel p-4">
          <div className="section-title">Mi semana</div>
          <ul className="space-y-2 text-sm">
            {(data.myWeek?.tasks ?? []).map((t) => (
              <li key={t.id} className="flex justify-between gap-2">
                <span>{t.title}</span>
                <span
                  className={`badge ${t.priority === "high" ? "badge-danger" : "badge-info"}`}
                >
                  {t.priority}
                </span>
              </li>
            ))}
            {(data.myWeek?.events ?? []).map((e) => (
              <li key={e.id}>
                <span className="badge badge-accent">{e.event_type}</span> {e.title}
                <div className="text-xs text-[var(--muted)]">
                  {formatDate(e.starts_at)}
                </div>
              </li>
            ))}
            {!data.myWeek?.tasks?.length && !data.myWeek?.events?.length && (
              <li className="text-[var(--muted)]">Sin tareas ni eventos.</li>
            )}
          </ul>
        </div>
      </section>
    </div>
  );
}
