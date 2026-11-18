"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/client";
import { money, toNumber } from "@/lib/money";
import {
  DEAL_STAGES,
  STAGE_LABELS,
  type Deal,
  type DealStage,
} from "@/lib/types";

export default function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("0");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    const data = await api<{ deals: Deal[] }>("/api/deals");
    setDeals(data.deals);
  }

  useEffect(() => {
    load().catch((e: Error) => setError(e.message));
  }, []);

  const byStage = useMemo(() => {
    const map = Object.fromEntries(
      DEAL_STAGES.map((s) => [s, [] as Deal[]]),
    ) as Record<DealStage, Deal[]>;
    for (const deal of deals) {
      map[deal.stage]?.push(deal);
    }
    return map;
  }, [deals]);

  async function createDeal(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api("/api/deals", {
        method: "POST",
        body: JSON.stringify({
          title,
          amount: Number(amount) || 0,
        }),
      });
      setTitle("");
      setAmount("0");
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function moveDeal(id: string, stage: DealStage) {
    setDeals((prev) =>
      prev.map((d) => (d.id === id ? { ...d, stage } : d)),
    );
    try {
      await api(`/api/deals/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ stage }),
      });
      await load();
    } catch (err) {
      setError((err as Error).message);
      await load();
    }
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">Pipeline</h1>
          <p className="text-[var(--muted)]">
            Arrastra mentalmente: cambia etapa con un clic. Al ganar, se crea
            proyecto.
          </p>
        </div>
      </header>

      <form onSubmit={createDeal} className="panel grid gap-3 p-4 md:grid-cols-[1fr_160px_auto]">
        <div>
          <label className="label">Nuevo deal</label>
          <input
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej. LED Wall — boda Lima"
            required
          />
        </div>
        <div>
          <label className="label">Monto</label>
          <input
            className="input"
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <div className="flex items-end">
          <button className="btn btn-primary w-full" disabled={busy}>
            Crear
          </button>
        </div>
      </form>

      {error && <div className="text-[var(--danger)]">{error}</div>}

      <div className="kanban">
        {DEAL_STAGES.map((stage) => (
          <div key={stage} className="panel min-h-[280px] p-3">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-semibold">{STAGE_LABELS[stage]}</div>
              <span className="badge">{byStage[stage].length}</span>
            </div>
            <div className="space-y-2">
              {byStage[stage].map((deal) => (
                <div key={deal.id} className="rounded-xl bg-[var(--bg)] p-3">
                  <div className="text-sm font-medium leading-snug">
                    {deal.title}
                  </div>
                  <div className="mt-1 text-xs text-[var(--muted)]">
                    {deal.contact_name || "Sin contacto"}
                  </div>
                  <div className="mt-2 text-sm font-semibold text-[var(--accent)]">
                    {money(deal.amount)}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {DEAL_STAGES.filter((s) => s !== stage).map((s) => (
                      <button
                        key={s}
                        type="button"
                        className="badge hover:border-[var(--accent)]"
                        onClick={() => moveDeal(deal.id, s)}
                      >
                        → {STAGE_LABELS[s]}
                      </button>
                    ))}
                  </div>
                  <div className="mt-2 text-[10px] text-[var(--muted)]">
                    Prob. {deal.probability}% · valor ponderado{" "}
                    {money(toNumber(deal.amount) * (deal.probability / 100))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
