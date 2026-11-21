"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api, formatDate } from "@/lib/client";
import { money } from "@/lib/money";
import {
  DEAL_STAGES,
  STAGE_LABELS,
  type Deal,
  type DealStage,
} from "@/lib/types";

type TimelineItem = {
  id: string;
  kind: string;
  summary: string;
  created_at: string;
};

export default function DealDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [deal, setDeal] = useState<Deal | null>(null);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const [d, t] = await Promise.all([
      api<{ deal: Deal }>(`/api/deals/${id}`),
      api<{ items: TimelineItem[] }>(`/api/timeline?deal_id=${id}`),
    ]);
    setDeal(d.deal);
    setTimeline(t.items);
    setNote(d.deal.notes || "");
  }

  useEffect(() => {
    load().catch((e: Error) => setError(e.message));
  }, [id]);

  async function setStage(stage: DealStage) {
    await api(`/api/deals/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ stage }),
    });
    await load();
  }

  async function saveNotes() {
    await api(`/api/deals/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ notes: note }),
    });
    await load();
  }

  if (error) return <div className="text-[var(--danger)]">{error}</div>;
  if (!deal) return <div className="text-[var(--muted)]">Cargando deal…</div>;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/deals" className="text-sm text-[var(--accent)]">
            ← Pipeline
          </Link>
          <h1 className="font-display mt-1 text-3xl">{deal.title}</h1>
          <p className="text-[var(--muted)]">
            {deal.contact_name || "Sin contacto"}
            {deal.account_name ? ` · ${deal.account_name}` : ""}
          </p>
        </div>
        <div className="panel px-4 py-3 text-right">
          <div className="text-xs text-[var(--muted)]">Monto</div>
          <div className="font-display text-2xl text-[var(--accent)]">
            {money(deal.amount, deal.currency)}
          </div>
          <div className="text-xs text-[var(--muted)]">
            Prob. {deal.probability}%
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {DEAL_STAGES.map((stage) => (
          <button
            key={stage}
            type="button"
            className={`badge ${deal.stage === stage ? "border-[var(--accent)] text-[var(--accent)]" : ""}`}
            onClick={() => setStage(stage)}
          >
            {STAGE_LABELS[stage]}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
        <div className="panel space-y-3 p-4">
          <h2 className="font-display text-xl">Ficha</h2>
          <div className="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <div className="label">Fuente</div>
              <div>{deal.source}</div>
            </div>
            <div>
              <div className="label">Cierre esperado</div>
              <div>{formatDate(deal.expected_close)}</div>
            </div>
            <div>
              <div className="label">Fecha evento</div>
              <div>{formatDate(deal.event_date)}</div>
            </div>
            <div>
              <div className="label">Etapa</div>
              <div>{STAGE_LABELS[deal.stage]}</div>
            </div>
          </div>
          <div>
            <label className="label">Notas</label>
            <textarea
              className="textarea"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <button type="button" className="btn btn-primary mt-2" onClick={saveNotes}>
              Guardar notas
            </button>
          </div>
          {deal.contact_id && (
            <Link
              href={`/contacts/${deal.contact_id}`}
              className="text-sm text-[var(--accent)]"
            >
              Ver contacto →
            </Link>
          )}
        </div>

        <div className="panel p-4">
          <h2 className="font-display text-xl">Timeline</h2>
          <p className="mb-3 text-xs text-[var(--muted)]">
            Como HubSpot: actividad, mensajes, pagos, cotizaciones y tareas.
          </p>
          <ul className="space-y-3">
            {timeline.map((item) => (
              <li
                key={item.id}
                className="border-b border-[var(--stroke)] pb-3 last:border-0"
              >
                <div className="flex items-center gap-2">
                  <span className="badge">{item.kind}</span>
                  <span className="text-xs text-[var(--muted)]">
                    {formatDate(item.created_at)}
                  </span>
                </div>
                <div className="mt-1 text-sm">{item.summary}</div>
              </li>
            ))}
            {!timeline.length && (
              <li className="text-sm text-[var(--muted)]">Sin eventos aún.</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
