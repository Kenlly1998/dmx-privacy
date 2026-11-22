"use client";

import { useEffect, useMemo, useState } from "react";
import { api, formatDate } from "@/lib/client";
import { money, quoteMargin, toNumber } from "@/lib/money";
import type { Contact, Deal, Product, Quote, QuoteItem } from "@/lib/types";

type Line = {
  product_id: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  cost_price: number;
};

type QuoteMargin = {
  revenue: number;
  cost: number;
  profit: number;
  margin_percent: number;
};

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [selected, setSelected] = useState<{
    quote: Quote;
    items: QuoteItem[];
    margin?: QuoteMargin;
  } | null>(null);
  const [lines, setLines] = useState<Line[]>([
    {
      product_id: null,
      description: "",
      quantity: 1,
      unit_price: 0,
      cost_price: 0,
    },
  ]);
  const [dealId, setDealId] = useState("");
  const [contactId, setContactId] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const [q, p, c, d] = await Promise.all([
      api<{ quotes: Quote[] }>("/api/quotes"),
      api<{ products: Product[] }>("/api/products"),
      api<{ contacts: Contact[] }>("/api/contacts"),
      api<{ deals: Deal[] }>("/api/deals"),
    ]);
    setQuotes(q.quotes);
    setProducts(p.products.filter((x) => x.active));
    setContacts(c.contacts);
    setDeals(d.deals);
  }

  useEffect(() => {
    load().catch((e: Error) => setError(e.message));
  }, []);

  const previewMargin = useMemo(
    () =>
      quoteMargin(
        lines
          .filter((l) => l.description)
          .map((l) => ({
            quantity: l.quantity,
            unit_price: l.unit_price,
            cost_price: l.cost_price,
          })),
      ),
    [lines],
  );

  function addProduct(productId: string) {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    setLines((prev) => [
      ...prev.filter((l) => l.description),
      {
        product_id: product.id,
        description: product.name,
        quantity: 1,
        unit_price: toNumber(product.unit_price),
        cost_price: toNumber(product.cost_price),
      },
    ]);
  }

  async function createQuote(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const items = lines.filter((l) => l.description && l.quantity > 0);
    if (!items.length) {
      setError("Agrega al menos una línea");
      return;
    }
    try {
      await api("/api/quotes", {
        method: "POST",
        body: JSON.stringify({
          deal_id: dealId || null,
          contact_id: contactId || null,
          items,
          status: "sent",
        }),
      });
      setLines([
        {
          product_id: null,
          description: "",
          quantity: 1,
          unit_price: 0,
          cost_price: 0,
        },
      ]);
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function openQuote(id: string) {
    const data = await api<{
      quote: Quote;
      items: QuoteItem[];
      margin?: QuoteMargin;
    }>(`/api/quotes/${id}`);
    setSelected(data);
  }

  async function setStatus(id: string, status: string) {
    await api(`/api/quotes/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    await load();
    if (selected?.quote.id === id) await openQuote(id);
  }

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-3xl">Cotizaciones</h1>
        <p className="text-[var(--muted)]">
          Versionadas, con ítems del catálogo y estados de envío/aceptación.
        </p>
      </header>

      <form onSubmit={createQuote} className="panel space-y-4 p-4">
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <label className="label">Deal</label>
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
          <div>
            <label className="label">Contacto</label>
            <select
              className="select"
              value={contactId}
              onChange={(e) => setContactId(e.target.value)}
            >
              <option value="">Sin contacto</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Agregar del catálogo</label>
            <select
              className="select"
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) addProduct(e.target.value);
                e.target.value = "";
              }}
            >
              <option value="">Elegir producto…</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {money(p.unit_price)} (costo {money(p.cost_price)})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          {lines.map((line, index) => (
            <div
              key={index}
              className="grid gap-2 md:grid-cols-[1fr_80px_110px_110px_auto]"
            >
              <input
                className="input"
                placeholder="Descripción"
                value={line.description}
                onChange={(e) => {
                  const next = [...lines];
                  next[index] = { ...line, description: e.target.value };
                  setLines(next);
                }}
              />
              <input
                className="input"
                type="number"
                min="0.01"
                step="0.01"
                title="Cantidad"
                value={line.quantity}
                onChange={(e) => {
                  const next = [...lines];
                  next[index] = {
                    ...line,
                    quantity: Number(e.target.value) || 0,
                  };
                  setLines(next);
                }}
              />
              <input
                className="input"
                type="number"
                min="0"
                step="0.01"
                title="Precio venta"
                value={line.unit_price}
                onChange={(e) => {
                  const next = [...lines];
                  next[index] = {
                    ...line,
                    unit_price: Number(e.target.value) || 0,
                  };
                  setLines(next);
                }}
              />
              <input
                className="input"
                type="number"
                min="0"
                step="0.01"
                title="Costo"
                value={line.cost_price}
                onChange={(e) => {
                  const next = [...lines];
                  next[index] = {
                    ...line,
                    cost_price: Number(e.target.value) || 0,
                  };
                  setLines(next);
                }}
              />
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() =>
                  setLines((prev) => prev.filter((_, i) => i !== index))
                }
              >
                Quitar
              </button>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-[var(--muted)]">
            Venta {money(previewMargin.revenue)} · Costo{" "}
            {money(previewMargin.cost)} ·{" "}
            <span className="font-semibold text-[var(--text)]">
              Margen {money(previewMargin.profit)} ({previewMargin.margin_percent}
              %)
            </span>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() =>
                setLines((prev) => [
                  ...prev,
                  {
                    product_id: null,
                    description: "",
                    quantity: 1,
                    unit_price: 0,
                    cost_price: 0,
                  },
                ])
              }
            >
              + Línea
            </button>
            <button className="btn btn-primary" type="submit">
              Crear y marcar enviada
            </button>
          </div>
        </div>
      </form>

      {error && <div className="text-[var(--danger)]">{error}</div>}

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="panel overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="text-xs uppercase text-[var(--muted)]">
              <tr>
                <th className="px-4 py-3">Número</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Estado</th>
              </tr>
            </thead>
            <tbody>
              {quotes.map((q) => (
                <tr
                  key={q.id}
                  className="cursor-pointer border-t border-[var(--stroke)] hover:bg-[var(--bg-soft)]"
                  onClick={() => openQuote(q.id).catch(() => undefined)}
                >
                  <td className="px-4 py-3 font-medium">{q.quote_number}</td>
                  <td className="px-4 py-3">
                    {q.contact_name || q.deal_title || "—"}
                  </td>
                  <td className="px-4 py-3">{money(q.total, q.currency)}</td>
                  <td className="px-4 py-3">
                    <span className="badge">{q.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="panel p-4">
          {!selected ? (
            <p className="text-sm text-[var(--muted)]">
              Selecciona una cotización para ver detalle imprimible.
            </p>
          ) : (
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-display text-2xl">
                    {selected.quote.quote_number}
                  </div>
                  <div className="text-sm text-[var(--muted)]">
                    {selected.quote.contact_name} ·{" "}
                    {formatDate(selected.quote.created_at)}
                  </div>
                </div>
                <span className="badge">{selected.quote.status}</span>
              </div>
              <ul className="space-y-2 text-sm">
                {selected.items.map((item) => (
                  <li
                    key={item.id}
                    className="flex justify-between gap-3 border-b border-[var(--stroke)] pb-2"
                  >
                    <span>
                      {item.description} × {item.quantity}
                    </span>
                    <span>{money(item.line_total)}</span>
                  </li>
                ))}
              </ul>
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>{money(selected.quote.total)}</span>
              </div>
              {selected.margin && (
                <div className="rounded-md border border-[var(--stroke)] bg-[var(--bg-soft)] p-3 text-sm">
                  <div className="flex justify-between">
                    <span>Costo</span>
                    <span>{money(selected.margin.cost)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-[var(--accent)]">
                    <span>Ganancia</span>
                    <span>
                      {money(selected.margin.profit)} (
                      {selected.margin.margin_percent}%)
                    </span>
                  </div>
                </div>
              )}
              <p className="text-xs text-[var(--muted)]">
                {selected.quote.terms}
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  className="btn btn-ghost"
                  type="button"
                  onClick={() => setStatus(selected.quote.id, "accepted")}
                >
                  Marcar aceptada
                </button>
                <button
                  className="btn btn-ghost"
                  type="button"
                  onClick={() => setStatus(selected.quote.id, "rejected")}
                >
                  Rechazada
                </button>
                <button
                  className="btn btn-primary"
                  type="button"
                  onClick={() => window.print()}
                >
                  Imprimir / PDF
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
