"use client";

import { useEffect, useState } from "react";
import { api, formatDate } from "@/lib/client";
import { money } from "@/lib/money";
import type { Contact, Deal, Payment } from "@/lib/types";

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [form, setForm] = useState({
    amount: "",
    method: "transfer",
    reference: "",
    notes: "",
    deal_id: "",
    contact_id: "",
  });
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const [p, d, c] = await Promise.all([
      api<{ payments: Payment[] }>("/api/payments"),
      api<{ deals: Deal[] }>("/api/deals"),
      api<{ contacts: Contact[] }>("/api/contacts"),
    ]);
    setPayments(p.payments);
    setDeals(d.deals);
    setContacts(c.contacts);
  }

  useEffect(() => {
    load().catch((e: Error) => setError(e.message));
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api("/api/payments", {
        method: "POST",
        body: JSON.stringify({
          amount: Number(form.amount),
          method: form.method,
          reference: form.reference,
          notes: form.notes,
          deal_id: form.deal_id || null,
          contact_id: form.contact_id || null,
        }),
      });
      setForm({
        amount: "",
        method: "transfer",
        reference: "",
        notes: "",
        deal_id: "",
        contact_id: "",
      });
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  const total = payments
    .filter((p) => p.status === "confirmed")
    .reduce((s, p) => s + Number(p.amount), 0);

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">Pagos</h1>
          <p className="text-[var(--muted)]">
            Anticipos, cuotas y saldos vinculados a deals.
          </p>
        </div>
        <div className="panel px-4 py-3">
          <div className="text-xs text-[var(--muted)]">Confirmado</div>
          <div className="font-display text-2xl text-[var(--ok)]">
            {money(total)}
          </div>
        </div>
      </header>

      <form onSubmit={onSubmit} className="panel grid gap-3 p-4 md:grid-cols-3">
        <div>
          <label className="label">Monto</label>
          <input
            className="input"
            type="number"
            min="0.01"
            step="0.01"
            required
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Método</label>
          <select
            className="select"
            value={form.method}
            onChange={(e) => setForm({ ...form, method: e.target.value })}
          >
            <option value="transfer">Transferencia</option>
            <option value="yape">Yape</option>
            <option value="plin">Plin</option>
            <option value="cash">Efectivo</option>
            <option value="card">Tarjeta</option>
            <option value="other">Otro</option>
          </select>
        </div>
        <div>
          <label className="label">Referencia</label>
          <input
            className="input"
            value={form.reference}
            onChange={(e) => setForm({ ...form, reference: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Deal</label>
          <select
            className="select"
            value={form.deal_id}
            onChange={(e) => setForm({ ...form, deal_id: e.target.value })}
          >
            <option value="">—</option>
            {deals.map((d) => (
              <option key={d.id} value={d.id}>
                {d.title}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Contacto</label>
          <select
            className="select"
            value={form.contact_id}
            onChange={(e) => setForm({ ...form, contact_id: e.target.value })}
          >
            <option value="">—</option>
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.full_name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Notas</label>
          <input
            className="input"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </div>
        <div>
          <button className="btn btn-primary" type="submit">
            Registrar pago
          </button>
        </div>
      </form>

      {error && <div className="text-[var(--danger)]">{error}</div>}

      <div className="panel overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="text-xs uppercase text-[var(--muted)]">
            <tr>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Monto</th>
              <th className="px-4 py-3">Método</th>
              <th className="px-4 py-3">Deal / Contacto</th>
              <th className="px-4 py-3">Ref</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id} className="border-t border-[var(--stroke)]">
                <td className="px-4 py-3">{formatDate(p.paid_at)}</td>
                <td className="px-4 py-3 font-semibold">
                  {money(p.amount, p.currency)}
                </td>
                <td className="px-4 py-3">
                  <span className="badge">{p.method}</span>
                </td>
                <td className="px-4 py-3">
                  <div>{p.deal_title || "—"}</div>
                  <div className="text-[var(--muted)]">
                    {p.contact_name || "—"}
                  </div>
                </td>
                <td className="px-4 py-3 text-[var(--muted)]">
                  {p.reference || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
