"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import { money } from "@/lib/money";
import type { Contact, Conversation } from "@/lib/types";

type BotResult = {
  quote: { id: string; quote_number: string; total: string | number };
  margin: { profit: number; margin_percent: number; cost: number; revenue: number };
  matched_products: { name: string; brand?: string; unit_price: string | number }[];
  ai_action_id?: string;
  whatsapp_draft: string;
  demo: boolean;
};

export default function AutomationPage() {
  const [message, setMessage] = useState(
    "Hola, quiero cotizar Spot 300 y una capacitación DMX para mi equipo",
  );
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [contactId, setContactId] = useState("");
  const [conversationId, setConversationId] = useState("");
  const [result, setResult] = useState<BotResult | null>(null);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api<{ contacts: Contact[] }>("/api/contacts"),
      api<{ conversations: Conversation[] }>("/api/conversations"),
    ])
      .then(([c, conv]) => {
        setContacts(c.contacts);
        setConversations(conv.conversations);
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  async function runBot(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(null);
    try {
      const res = await api<BotResult>("/api/automation/quote", {
        method: "POST",
        body: JSON.stringify({
          message,
          contact_id: contactId || null,
          conversation_id: conversationId || null,
        }),
      });
      setResult(res);
      setDraft(res.whatsapp_draft);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function approveSend() {
    if (!result) return;
    setError(null);
    try {
      await api("/api/automation/quote", {
        method: "PATCH",
        body: JSON.stringify({
          quote_id: result.quote.id,
          conversation_id: conversationId || null,
          ai_action_id: result.ai_action_id || null,
          message: draft,
        }),
      });
      setOk(`Aprobado: ${result.quote.quote_number} enviada (o lista para WA).`);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-3xl">Bot de cotización</h1>
        <p className="text-[var(--muted)]">
          El bot lee el catálogo, arma borrador con margen interno y tú apruebas antes de enviar.
        </p>
      </header>

      <form onSubmit={runBot} className="panel space-y-3 p-4">
        <div>
          <label className="label">Mensaje del cliente (WA/IG)</label>
          <textarea className="textarea" value={message} onChange={(e) => setMessage(e.target.value)} />
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="label">Contacto</label>
            <select className="select" value={contactId} onChange={(e) => setContactId(e.target.value)}>
              <option value="">—</option>
              {contacts.map((c) => <option key={c.id} value={c.id}>{c.full_name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Conversación inbox (opcional)</label>
            <select className="select" value={conversationId} onChange={(e) => setConversationId(e.target.value)}>
              <option value="">—</option>
              {conversations.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.channel} · {c.contact_name || c.id.slice(0, 8)}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button className="btn btn-primary" type="submit">Generar borrador con bot</button>
      </form>

      {error && <div className="text-[var(--danger)]">{error}</div>}
      {ok && <div className="panel p-3 text-sm text-[var(--ok)]">{ok}</div>}

      {result && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="panel space-y-3 p-4">
            <h2 className="font-display text-xl">{result.quote.quote_number}</h2>
            <div className="text-sm">Total cliente: {money(result.quote.total)}</div>
            <div className="text-sm text-[var(--ok)]">
              Margen interno: {money(result.margin.profit)} ({result.margin.margin_percent}%)
            </div>
            <div className="text-xs text-[var(--muted)]">
              Costo {money(result.margin.cost)} · Venta {money(result.margin.revenue)} — no se muestra al cliente
            </div>
            <ul className="space-y-1 text-sm">
              {result.matched_products.map((p, i) => (
                <li key={i}>• {p.brand ? `${p.brand} · ` : ""}{p.name} — {money(p.unit_price)}</li>
              ))}
            </ul>
          </div>
          <div className="panel space-y-3 p-4">
            <h2 className="font-display text-xl">Mensaje a enviar</h2>
            <textarea className="textarea" value={draft} onChange={(e) => setDraft(e.target.value)} />
            <button type="button" className="btn btn-primary" onClick={approveSend}>
              Aprobar y enviar
            </button>
            {result.demo && (
              <p className="text-xs text-[var(--warn)]">Grok en modo demo (sin XAI_API_KEY).</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
