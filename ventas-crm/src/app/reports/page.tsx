"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import { money } from "@/lib/money";

type Reports = {
  currency: string;
  kpis: {
    pipelineValue: number;
    weightedPipeline: number;
    winRate: number;
    wonAmount: number;
    lostCount: number;
    paymentsTotal: number;
    quoteWinRate: number;
    tasksOverdue: number;
    tasksUpcoming: number;
  };
  funnel: { stage: string; label: string; count: number; amount: number }[];
  bySource: { source: string; count: number; amount: number }[];
};

export default function ReportsPage() {
  const [data, setData] = useState<Reports | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<Reports>("/api/reports")
      .then(setData)
      .catch((e: Error) => setError(e.message));
  }, []);

  if (error) return <div className="text-[var(--danger)]">{error}</div>;
  if (!data) return <div className="text-[var(--muted)]">Cargando reportes…</div>;

  const cur = data.currency;
  const maxFunnel = Math.max(...data.funnel.map((f) => f.count), 1);

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-3xl">Reportes</h1>
        <p className="text-[var(--muted)]">
          Métricas al estilo HubSpot/Salesforce: embudo, win rate y canales.
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Pipeline", money(data.kpis.pipelineValue, cur)],
          ["Ponderado", money(data.kpis.weightedPipeline, cur)],
          ["Win rate deals", `${data.kpis.winRate}%`],
          ["Win rate cotizaciones", `${data.kpis.quoteWinRate}%`],
          ["Cobrado", money(data.kpis.paymentsTotal, cur)],
          ["Ganado", money(data.kpis.wonAmount, cur)],
          ["Tareas vencidas", String(data.kpis.tasksOverdue)],
          ["Tareas próximas", String(data.kpis.tasksUpcoming)],
        ].map(([label, value]) => (
          <div key={label} className="panel p-4">
            <div className="text-xs uppercase text-[var(--muted)]">{label}</div>
            <div className="mt-2 font-display text-2xl">{value}</div>
          </div>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="panel p-4">
          <h2 className="font-display text-xl">Embudo</h2>
          <div className="mt-4 space-y-3">
            {data.funnel.map((row) => (
              <div key={row.stage}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{row.label}</span>
                  <span className="text-[var(--muted)]">
                    {row.count} · {money(row.amount, cur)}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-[var(--bg)]">
                  <div
                    className="h-2 rounded-full bg-[var(--accent)]"
                    style={{ width: `${(row.count / maxFunnel) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel p-4">
          <h2 className="font-display text-xl">Por fuente</h2>
          <ul className="mt-3 space-y-2">
            {data.bySource.map((row) => (
              <li
                key={row.source}
                className="flex items-center justify-between rounded-xl bg-[var(--bg)] px-3 py-2 text-sm"
              >
                <span className="badge">{row.source}</span>
                <span>
                  {row.count} deals · {money(row.amount, cur)}
                </span>
              </li>
            ))}
            {!data.bySource.length && (
              <li className="text-sm text-[var(--muted)]">Sin datos.</li>
            )}
          </ul>
        </div>
      </section>
    </div>
  );
}
