"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import type { Contact } from "@/lib/types";

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [q, setQ] = useState("");
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    source: "manual",
    notes: "",
  });
  const [error, setError] = useState<string | null>(null);

  async function load(query = q) {
    const data = await api<{ contacts: Contact[] }>(
      `/api/contacts?q=${encodeURIComponent(query)}`,
    );
    setContacts(data.contacts);
  }

  useEffect(() => {
    load().catch((e: Error) => setError(e.message));
  }, []);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api("/api/contacts", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setForm({
        full_name: "",
        email: "",
        phone: "",
        source: "manual",
        notes: "",
      });
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-3xl">Contactos</h1>
        <p className="text-[var(--muted)]">
          Clientes y leads desde WhatsApp, Instagram o alta manual.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        <input
          className="input max-w-md"
          placeholder="Buscar nombre, email o teléfono"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") load().catch(() => undefined);
          }}
        />
        <button className="btn btn-ghost" type="button" onClick={() => load()}>
          Buscar
        </button>
      </div>

      <form onSubmit={onCreate} className="panel grid gap-3 p-4 md:grid-cols-2">
        <div>
          <label className="label">Nombre</label>
          <input
            className="input"
            required
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Fuente</label>
          <select
            className="select"
            value={form.source}
            onChange={(e) => setForm({ ...form, source: e.target.value })}
          >
            <option value="manual">Manual</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="instagram">Instagram</option>
            <option value="referido">Referido</option>
            <option value="web">Web</option>
          </select>
        </div>
        <div>
          <label className="label">Email</label>
          <input
            className="input"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Teléfono</label>
          <input
            className="input"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </div>
        <div className="md:col-span-2">
          <label className="label">Notas</label>
          <textarea
            className="textarea"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </div>
        <div>
          <button className="btn btn-primary" type="submit">
            Guardar contacto
          </button>
        </div>
      </form>

      {error && <div className="text-[var(--danger)]">{error}</div>}

      <div className="panel overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="text-xs uppercase text-[var(--muted)]">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Cuenta</th>
              <th className="px-4 py-3">Contacto</th>
              <th className="px-4 py-3">Fuente</th>
              <th className="px-4 py-3">Tags</th>
            </tr>
          </thead>
          <tbody>
            {contacts.map((c) => (
              <tr key={c.id} className="border-t border-[var(--stroke)]">
                <td className="px-4 py-3 font-medium">{c.full_name}</td>
                <td className="px-4 py-3 text-[var(--muted)]">
                  {c.account_name || "—"}
                </td>
                <td className="px-4 py-3">
                  <div>{c.email || "—"}</div>
                  <div className="text-[var(--muted)]">{c.phone || "—"}</div>
                </td>
                <td className="px-4 py-3">
                  <span className="badge">{c.source}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {(c.tags || []).map((t) => (
                      <span key={t} className="badge">
                        {t}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
