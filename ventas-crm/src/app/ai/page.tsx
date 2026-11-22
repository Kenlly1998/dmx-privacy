"use client";

import { useEffect, useState } from "react";
import { api, formatDate } from "@/lib/client";
import type { AiAction, Deal } from "@/lib/types";

export default function AiPage() {
  const [actions, setActions] = useState<AiAction[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [grokConfigured, setGrokConfigured] = useState(false);
  const [actionType, setActionType] = useState<
    "followup" | "quote_draft" | "deal_summary" | "reply"
  >("followup");
  const [prompt, setPrompt] = useState(
    "Prepárame un follow-up corto y profesional para cerrar esta semana.",
  );
  const [dealId, setDealId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [demo, setDemo] = useState(false);

  async function load() {
    const [ai, d] = await Promise.all([
      api<{ actions: AiAction[]; grokConfigured: boolean }>("/api/ai"),
      api<{ deals: Deal[] }>("/api/deals"),
    ]);
    setActions(ai.actions);
    setGrokConfigured(ai.grokConfigured);
    setDeals(d.deals);
  }

  useEffect(() => {
    load().catch((e: Error) => setError(e.message));
  }, []);

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await api<{ action: AiAction; demo: boolean }>("/api/ai", {
        method: "POST",
        body: JSON.stringify({
          action_type: actionType,
          prompt,
          deal_id: dealId || null,
        }),
      });
      setDemo(res.demo);
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function decide(id: string, status: "approved" | "rejected") {
    await api("/api/ai", {
      method: "PATCH",
      body: JSON.stringify({ id, status }),
    });
    await load();
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">Grok copiloto</h1>
          <p className="text-[var(--muted)]">
            Propone follow-ups, borradores de cotización y resúmenes. Tú
            apruebas antes de enviar.
          </p>
        </div>
        <span className="badge">
          {grokConfigured ? "XAI_API_KEY activo" : "Modo demo"}
        </span>
      </header>

      <form onSubmit={generate} className="panel space-y-3 p-4">
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="label">Tipo</label>
            <select
              className="select"
              value={actionType}
              onChange={(e) =>
                setActionType(e.target.value as typeof actionType)
              }
            >
              <option value="followup">Follow-up</option>
              <option value="quote_draft">Borrador de cotización</option>
              <option value="deal_summary">Resumen de deal</option>
              <option value="reply">Respuesta a mensaje</option>
            </select>
          </div>
          <div>
            <label className="label">Deal (contexto)</label>
            <select
              className="select"
              value={dealId}
              onChange={(e) => setDealId(e.target.value)}
            >
              <option value="">Sin deal</option>
              {deals.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="label">Instrucción</label>
          <textarea
            className="textarea"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            required
          />
        </div>
        <button className="btn btn-primary" disabled={busy}>
          {busy ? "Generando…" : "Pedir propuesta a Grok"}
        </button>
        {demo && (
          <p className="text-xs text-[var(--warn)]">
            Última respuesta en modo demo. En Ajustes declara XAI_API_KEY para
            Grok en vivo.
          </p>
        )}
      </form>

      {error && <div className="text-[var(--danger)]">{error}</div>}

      <div className="space-y-3">
        {actions.map((action) => (
          <div key={action.id} className="panel p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm">
                <span className="badge">{action.action_type}</span>{" "}
                <span className="badge">{action.model}</span>{" "}
                <span className="badge">{action.status}</span>
              </div>
              <div className="text-xs text-[var(--muted)]">
                {formatDate(action.created_at)}
              </div>
            </div>
            <p className="mt-2 text-xs text-[var(--muted)]">{action.prompt}</p>
            <pre className="mt-3 whitespace-pre-wrap rounded-xl bg-[var(--bg)] p-3 text-sm font-sans">
              {action.proposal}
            </pre>
            {action.status === "pending" && (
              <div className="mt-3 flex gap-2">
                <button
                  className="btn btn-primary"
                  type="button"
                  onClick={() => decide(action.id, "approved")}
                >
                  Aprobar
                </button>
                <button
                  className="btn btn-ghost"
                  type="button"
                  onClick={() => decide(action.id, "rejected")}
                >
                  Rechazar
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
