"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api, formatDate } from "@/lib/client";
import type { Contact } from "@/lib/types";

type TimelineItem = {
  id: string;
  kind: string;
  summary: string;
  created_at: string;
};

export default function ContactDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [contact, setContact] = useState<Contact | null>(null);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api<{ contact: Contact }>(`/api/contacts/${id}`),
      api<{ items: TimelineItem[] }>(`/api/timeline?contact_id=${id}`),
    ])
      .then(([c, t]) => {
        setContact(c.contact);
        setTimeline(t.items);
      })
      .catch((e: Error) => setError(e.message));
  }, [id]);

  if (error) return <div className="text-[var(--danger)]">{error}</div>;
  if (!contact) return <div className="text-[var(--muted)]">Cargando…</div>;

  return (
    <div className="space-y-5">
      <div>
        <Link href="/contacts" className="text-sm text-[var(--accent)]">
          ← Contactos
        </Link>
        <h1 className="font-display mt-1 text-3xl">{contact.full_name}</h1>
        <p className="text-[var(--muted)]">
          {contact.account_name || "Sin empresa"} · fuente {contact.source}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="panel space-y-2 p-4 text-sm">
          <h2 className="font-display text-xl">Datos</h2>
          <div>Email: {contact.email || "—"}</div>
          <div>Teléfono: {contact.phone || "—"}</div>
          <div className="flex flex-wrap gap-1">
            {(contact.tags || []).map((t) => (
              <span key={t} className="badge">
                {t}
              </span>
            ))}
          </div>
          <p className="text-[var(--muted)]">{contact.notes || "Sin notas"}</p>
        </div>

        <div className="panel p-4">
          <h2 className="font-display text-xl">Timeline</h2>
          <ul className="mt-3 space-y-3">
            {timeline.map((item) => (
              <li
                key={item.id}
                className="border-b border-[var(--stroke)] pb-3 last:border-0"
              >
                <div className="flex gap-2">
                  <span className="badge">{item.kind}</span>
                  <span className="text-xs text-[var(--muted)]">
                    {formatDate(item.created_at)}
                  </span>
                </div>
                <div className="mt-1 text-sm">{item.summary}</div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
