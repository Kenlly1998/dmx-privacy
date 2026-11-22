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
  pipeline: { stage: string; count: number; amount: string }[];
  activity: { id: string; summary: string; created_at: string; action: string }[];
  myWeek?: {
    tasks: { id: string; title: string; due_at: string | null; priority: string }[];
    events: { id: string; title: string; event_type: string; starts_at: string }[];
  };
  openDeals?: {
    id: string;
    title: string;
    stage: DealStage;
    amount: number | string;
    contact_name?: string | null;
    event_date?: string | null;
    updated_at?: string;
  }[];
};

export default function HomePage() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [deals, setDeals] = useState<
    {
      id: string;
      title: string;
      stage: DealStage;
      amount: number | string;
      contact_name?: string | null;
      event_date?: string | null;
      updated_at: string;
    }[]
  >([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api<Dashboard>("/api/dashboard"),
      api<{ deals: typeof deals }>("/api/deals"),
    ])
      .then(([dash, d]) => {
        setData(dash);
        setDeals(
          d.deals
            .filter((x) => x.stage !== "won" && x.stage !== "lost")
            .slice(0, 8),
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

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[var(--accent)]">
            {data.orgName} · controla tus alquileres
          </p>
          <h1 className="font-display text-3xl md:text-4xl">
            Hola, {data.viewer.split(" ")[0]}
          </h1>
          <p className="mt-1 max-w-xl text-[var(--muted)]">
            Contratos, inventario y saldos en una sola pantalla — estilo
            Inventario Rental.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/deals" className="btn btn-primary">
            + Nuevo contrato
          </Link>
          <Link href="/products" className="btn btn-ghost">
            Administrar artículos
          </Link>
        </div>
      </header>

      <section className="panel grid grid-cols-2 gap-3 p-4 md:grid-cols-4">
        <div>
          <div className="label">Contratos</div>
          <div className="font-display text-2xl">{data.kpis.openDeals}</div>
        </div>
        <div>
          <div className="label">Esperado</div>
          <div className="font-display text-2xl">
            {money(data.kpis.pipelineValue, currency)}
          </div>
        </div>
        <div>
          <div className="label">Pagado</div>
          <div className="font-display text-2xl text-[var(--ok)]">
            {money(data.kpis.paymentsTotal, currency)}
          </div>
        </div>
        <div>
          <div className="label">Margen cotizado</div>
          <div className="font-display text-2xl text-[var(--accent)]">
            {money(data.kpis.quoteProfit ?? 0, currency)}
          </div>
          <div className="text-xs text-[var(--muted)]">
            {data.kpis.quoteMarginPercent ?? 0}% sobre venta
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl">Contratos abiertos</h2>
          <Link href="/deals" className="text-sm font-semibold text-[var(--accent)]">
            Ver pipeline
          </Link>
        </div>
        <div className="space-y-3">
          {deals.map((deal) => (
            <Link key={deal.id} href={`/deals/${deal.id}`} className="panel block p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="text-xs text-[var(--muted)]">
                    Deal · {deal.id.slice(0, 8).toUpperCase()}
                  </div>
                  <div className="text-lg font-semibold">
                    {deal.contact_name || "Sin contacto"}
                  </div>
                  <div className="text-sm text-[var(--muted)]">{deal.title}</div>
                </div>
                <span
                  className={`badge ${
                    deal.stage === "negotiation"
                      ? "badge-warn"
                      : deal.stage === "quoted"
                        ? "badge-info"
                        : "badge-ok"
                  }`}
                >
                  {STAGE_LABELS[deal.stage]}
                </span>
              </div>
              <div className="metric-grid mt-3 border-t border-[var(--stroke)] pt-3">
                <div>
                  <div className="k">Actualizado</div>
                  <div className="v">{formatDate(deal.updated_at)}</div>
                </div>
                <div>
                  <div className="k">Evento</div>
                  <div className="v">{formatDate(deal.event_date) || "—"}</div>
                </div>
                <div>
                  <div className="k">Monto</div>
                  <div className="v text-[var(--accent)]">
                    {money(deal.amount, currency)}
                  </div>
                </div>
              </div>
            </Link>
          ))}
          {!deals.length && (
            <div className="panel p-6 text-sm text-[var(--muted)]">
              Sin contratos abiertos. Crea un deal desde Pipeline.
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="panel p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-xl">Mi semana — tareas</h2>
            <Link href="/tasks" className="text-sm text-[var(--accent)]">
              Ver
            </Link>
          </div>
          <ul className="space-y-2">
            {(data.myWeek?.tasks ?? []).map((t) => (
              <li key={t.id} className="flex justify-between gap-2 text-sm">
                <span>{t.title}</span>
                <span
                  className={`badge ${t.priority === "high" ? "badge-danger" : "badge-info"}`}
                >
                  {t.priority}
                </span>
              </li>
            ))}
            {!data.myWeek?.tasks?.length && (
              <li className="text-sm text-[var(--muted)]">Sin tareas próximas.</li>
            )}
          </ul>
        </div>
        <div className="panel p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-xl">Mi semana — agenda</h2>
            <Link href="/calendar" className="text-sm text-[var(--accent)]">
              Ver
            </Link>
          </div>
          <ul className="space-y-2">
            {(data.myWeek?.events ?? []).map((e) => (
              <li key={e.id} className="text-sm">
                <span className="badge badge-info">{e.event_type}</span> {e.title}
                <div className="text-xs text-[var(--muted)]">
                  {formatDate(e.starts_at)}
                </div>
              </li>
            ))}
            {!data.myWeek?.events?.length && (
              <li className="text-sm text-[var(--muted)]">Sin eventos próximos.</li>
            )}
          </ul>
        </div>
      </section>
    </div>
  );
}
