"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/client";

type Attachment = {
  id: string;
  file_name: string;
  file_url: string;
  notes: string;
  created_at: string;
};

type Props = {
  entityType: "deal" | "contact" | "project" | "quote" | "invoice";
  entityId: string;
};

export function AttachmentsPanel({ entityType, entityId }: Props) {
  const [items, setItems] = useState<Attachment[]>([]);
  const [fileName, setFileName] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const data = await api<{ attachments: Attachment[] }>(
      `/api/attachments?entity_type=${entityType}&entity_id=${entityId}`,
    );
    setItems(data.attachments);
  }

  useEffect(() => {
    load().catch((e: Error) => setError(e.message));
  }, [entityType, entityId]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api("/api/attachments", {
        method: "POST",
        body: JSON.stringify({
          entity_type: entityType,
          entity_id: entityId,
          file_name: fileName,
          file_url: fileUrl,
          notes,
        }),
      });
      setFileName("");
      setFileUrl("");
      setNotes("");
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div className="panel space-y-3 p-4">
      <h2 className="font-display text-xl">Adjuntos</h2>
      <p className="text-xs text-[var(--muted)]">
        Referencias a planos, PDFs o links (sin storage binario aún).
      </p>
      <form onSubmit={onSubmit} className="grid gap-2 sm:grid-cols-2">
        <input
          className="input"
          required
          placeholder="Nombre archivo"
          value={fileName}
          onChange={(e) => setFileName(e.target.value)}
        />
        <input
          className="input"
          placeholder="URL (opcional)"
          value={fileUrl}
          onChange={(e) => setFileUrl(e.target.value)}
        />
        <input
          className="input sm:col-span-2"
          placeholder="Nota"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <button type="submit" className="btn btn-primary sm:col-span-2">
          Agregar adjunto
        </button>
      </form>
      {error && <div className="text-sm text-[var(--danger)]">{error}</div>}
      <ul className="space-y-2 text-sm">
        {items.map((a) => (
          <li
            key={a.id}
            className="flex justify-between gap-2 border-b border-[var(--stroke)] pb-2"
          >
            <div>
              <div className="font-medium">{a.file_name}</div>
              {a.notes && (
                <div className="text-xs text-[var(--muted)]">{a.notes}</div>
              )}
            </div>
            {a.file_url && !a.file_url.startsWith("note://") ? (
              <a
                href={a.file_url}
                target="_blank"
                rel="noreferrer"
                className="text-[var(--accent)]"
              >
                Abrir
              </a>
            ) : (
              <span className="badge">nota</span>
            )}
          </li>
        ))}
        {!items.length && (
          <li className="text-[var(--muted)]">Sin adjuntos.</li>
        )}
      </ul>
    </div>
  );
}
