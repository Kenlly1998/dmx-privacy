"use client";

import { useEffect, useState } from "react";
import { api, formatDate } from "@/lib/client";
import type { Conversation, Message } from "@/lib/types";

type Template = { id: string; name: string; channel: string; body: string };

export default function InboxPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const [data, tpl] = await Promise.all([
      api<{ conversations: Conversation[] }>("/api/conversations"),
      api<{ templates: Template[] }>("/api/templates"),
    ]);
    setConversations(data.conversations);
    setTemplates(tpl.templates);
    if (!activeId && data.conversations[0]) {
      await openThread(data.conversations[0].id);
    }
  }

  async function openThread(id: string) {
    setActiveId(id);
    const data = await api<{ messages: Message[] }>(
      `/api/conversations/${id}/messages`,
    );
    setMessages(data.messages);
  }

  useEffect(() => {
    load().catch((e: Error) => setError(e.message));
  }, []);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!activeId || !body.trim()) return;
    setError(null);
    try {
      await api(`/api/conversations/${activeId}/messages`, {
        method: "POST",
        body: JSON.stringify({ body, direction: "outbound" }),
      });
      setBody("");
      await openThread(activeId);
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  const active = conversations.find((c) => c.id === activeId);

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-3xl">Inbox</h1>
        <p className="text-[var(--muted)]">
          WhatsApp e Instagram en un solo hilo, ligados a contactos y deals.
        </p>
      </header>

      {error && <div className="text-[var(--danger)]">{error}</div>}

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <div className="panel max-h-[70vh] overflow-y-auto">
          {conversations.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => openThread(c.id).catch(() => undefined)}
              className={`block w-full border-b border-[var(--stroke)] px-4 py-3 text-left hover:bg-[var(--bg-soft)] ${
                activeId === c.id ? "bg-[var(--bg-soft)]" : ""
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="font-medium">
                  {c.contact_name || "Sin contacto"}
                </div>
                <span className="badge">{c.channel}</span>
              </div>
              <div className="mt-1 line-clamp-2 text-xs text-[var(--muted)]">
                {c.preview || "Sin mensajes"}
              </div>
            </button>
          ))}
          {!conversations.length && (
            <div className="p-4 text-sm text-[var(--muted)]">
              No hay conversaciones. Conecta WhatsApp/Instagram o usa el demo en
              Ajustes.
            </div>
          )}
        </div>

        <div className="panel flex min-h-[420px] flex-col">
          <div className="border-b border-[var(--stroke)] px-4 py-3">
            <div className="font-medium">
              {active?.contact_name || "Selecciona un hilo"}
            </div>
            <div className="text-xs text-[var(--muted)]">
              {active
                ? `${active.channel} · ${formatDate(active.last_message_at)}`
                : "—"}
            </div>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                  m.direction === "outbound"
                    ? "ml-auto bg-[color-mix(in_srgb,var(--accent)_25%,var(--bg))]"
                    : "bg-[var(--bg)]"
                }`}
              >
                <div className="text-[10px] text-[var(--muted)]">
                  {m.sender_name}
                </div>
                <div className="whitespace-pre-wrap">{m.body}</div>
              </div>
            ))}
          </div>
          <div className="border-t border-[var(--stroke)] p-3">
            <div className="mb-2 flex flex-wrap gap-1">
              {templates
                .filter(
                  (t) =>
                    !active ||
                    t.channel === active.channel ||
                    t.channel === "whatsapp",
                )
                .slice(0, 5)
                .map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className="badge hover:border-[var(--accent)]"
                    disabled={!activeId}
                    onClick={() =>
                      setBody(
                        t.body
                          .replace("{{nombre}}", active?.contact_name || "hola")
                          .replace("{{cotizacion}}", "COT"),
                      )
                    }
                  >
                    {t.name}
                  </button>
                ))}
            </div>
            <form onSubmit={send} className="flex gap-2">
              <input
                className="input"
                placeholder="Escribe una respuesta…"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                disabled={!activeId}
              />
              <button className="btn btn-primary" disabled={!activeId}>
                Enviar
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
