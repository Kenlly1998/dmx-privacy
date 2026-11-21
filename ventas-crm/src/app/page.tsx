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
};

export default function HomePage() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<Dashboard>("/api/dashboard")
      .then(setData)
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
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-[var(--muted)]">{data.orgName}</p>
          <h1 className="font-display text-3xl md:text-4xl">
            Hola, {data.viewer.split(" ")[0]}
          </h1>
          <p className="mt-1 max-w-xl text-[var(--muted)]">
            Pipeline activo, cobranza y canales en un solo lugar. Listo para
            cotizar y cerrar.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/quotes" className="btn btn-primary">
            Nueva cotización
          </Link>
          <Link href="/deals" className="btn btn-ghost">
            Ver pipeline
          </Link>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {[
          ["Pipeline abierto", money(data.kpis.pipelineValue, currency), `${data.kpis.openDeals} deals`],
          ["Cobrado", money(data.kpis.paymentsTotal, currency), `${data.kpis.paymentsCount} pagos`],
          ["Cotizaciones", String(data.kpis.openQuotes), `${data.kpis.draftQuotes} borradores`],
          ["Inbox abierto", String(data.kpis.openInbox), "WhatsApp / Instagram"],
          [
            "Margen cotizado",
            money(data.kpis.quoteProfit ?? 0, currency),
            `${data.kpis.quoteMarginPercent ?? 0}% sobre venta`,
          ],
        ].map(([label, value, hint]) => (
          <div key={label} className="panel p-4">
            <div className="text-xs uppercase tracking-wide text-[var(--muted)]">
              {label}
            </div>
            <div className="mt-2 font-display text-2xl">{value}</div>
            <div className="mt-1 text-sm text-[var(--muted)]">{hint}</div>
          </div>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="panel p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-xl">Embudo</h2>
            <Link href="/deals" className="text-sm text-[var(--accent)]">
              Abrir
            </Link>
          </div>
          <div className="space-y-2">
            {(
              ["lead", "qualified", "quoted", "negotiation", "won", "lost"] as DealStage[]
            ).map((stage) => {
              const row = data.pipeline.find((p) => p.stage === stage);
              return (
                <div
                  key={stage}
                  className="flex items-center justify-between rounded-xl bg-[var(--bg)] px-3 py-2"
                >
                  <div>
                    <div className="text-sm font-medium">
                      {STAGE_LABELS[stage]}
                    </div>
                    <div className="text-xs text-[var(--muted)]">
                      {row?.count ?? 0} deals
                    </div>
                  </div>
                  <div className="text-sm font-semibold">
                    {money(row?.amount ?? 0, currency)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="panel p-4">
          <h2 className="font-display text-xl">Actividad</h2>
          <ul className="mt-3 space-y-3">
            {data.activity.map((item) => (
              <li key={item.id} className="border-b border-[var(--stroke)] pb-3 last:border-0">
                <div className="text-sm">{item.summary}</div>
                <div className="mt-1 text-xs text-[var(--muted)]">
                  {item.action} · {formatDate(item.created_at)}
                </div>
              </li>
            ))}
            {!data.activity.length && (
              <li className="text-sm text-[var(--muted)]">Sin actividad aún.</li>
            )}
          </ul>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="panel p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-xl">Mi semana — tareas</h2>
            <Link href="/tasks" className="text-sm text-[var(--accent)]">Ver</Link>
          </div>
          <ul className="space-y-2">
            {(data.myWeek?.tasks ?? []).map((t) => (
              <li key={t.id} className="flex justify-between gap-2 text-sm">
                <span>{t.title}</span>
                <span className="badge">{t.priority}</span>
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
            <Link href="/calendar" className="text-sm text-[var(--accent)]">Ver</Link>
          </div>
          <ul className="space-y-2">
            {(data.myWeek?.events ?? []).map((e) => (
              <li key={e.id} className="text-sm">
                <span className="badge">{e.event_type}</span>{" "}
                {e.title}
                <div className="text-xs text-[var(--muted)]">{formatDate(e.starts_at)}</div>
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
