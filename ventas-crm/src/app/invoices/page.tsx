"use client";

import { useEffect, useState } from "react";
import { api, formatDate } from "@/lib/client";
import { money, toNumber } from "@/lib/money";
import type { Invoice, Product, Quote } from "@/lib/types";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [mode, setMode] = useState("demo");
  const [quoteId, setQuoteId] = useState("");
  const [docType, setDocType] = useState("boleta");
  const [customerName, setCustomerName] = useState("");
  const [docNumber, setDocNumber] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    const [inv, q, p] = await Promise.all([
      api<{ invoices: Invoice[]; mode: string }>("/api/invoices"),
      api<{ quotes: Quote[] }>("/api/quotes"),
      api<{ products: Product[] }>("/api/products"),
    ]);
    setInvoices(inv.invoices);
    setMode(inv.mode);
    setQuotes(q.quotes.filter((x) => ["sent", "accepted"].includes(x.status)));
    setProducts(p.products);
  }

  useEffect(() => {
    load().catch((e: Error) => setError(e.message));
  }, []);

  async function issue(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    try {
      let items = products.slice(0, 1).map((p) => ({
        description: p.name,
        quantity: 1,
        unit_price: toNumber(p.unit_price),
        cost_price: toNumber(p.cost_price),
      }));

      if (quoteId) {
        const detail = await api<{
          quote: Quote;
          items: { description: string; quantity: string; unit_price: string; cost_price?: string }[];
        }>(`/api/quotes/${quoteId}`);
        items = detail.items.map((i) => ({
          description: i.description,
          quantity: toNumber(i.quantity),
          unit_price: toNumber(i.unit_price),
          cost_price: toNumber(i.cost_price),
        }));
      }

      const res = await api<{ invoice: Invoice; margin: { profit: number } }>("/api/invoices", {
        method: "POST",
        body: JSON.stringify({
          doc_type: docType,
          quote_id: quoteId || null,
          customer_doc_type: docType === "factura" ? "6" : "1",
          customer_doc_number: docNumber,
          customer_name: customerName,
          items,
          issue: true,
        }),
      });
      setMessage(
        `${res.invoice.doc_type} ${res.invoice.series}-${res.invoice.number} · ${res.invoice.status} · margen ~ ${money(res.margin.profit)}`,
      );
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">Facturación SUNAT</h1>
          <p className="text-[var(--muted)]">
            Boleta/factura desde cotización. Modo actual: <strong>{mode}</strong>.
          </p>
        </div>
        <span className="badge">{mode === "demo" ? "PSE demo" : "PSE live"}</span>
      </header>

      <form onSubmit={issue} className="panel grid gap-3 p-4 md:grid-cols-2">
        <div>
          <label className="label">Desde cotización</label>
          <select className="select" value={quoteId} onChange={(e) => setQuoteId(e.target.value)}>
            <option value="">Elegir…</option>
            {quotes.map((q) => (
              <option key={q.id} value={q.id}>
                {q.quote_number} · {money(q.total)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Tipo</label>
          <select className="select" value={docType} onChange={(e) => setDocType(e.target.value)}>
            <option value="boleta">Boleta</option>
            <option value="factura">Factura</option>
          </select>
        </div>
        <div>
          <label className="label">Cliente</label>
          <input className="input" required value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
        </div>
        <div>
          <label className="label">{docType === "factura" ? "RUC" : "DNI"}</label>
          <input className="input" required minLength={8} value={docNumber} onChange={(e) => setDocNumber(e.target.value)} />
        </div>
        <div>
          <button className="btn btn-primary" type="submit">Emitir comprobante</button>
        </div>
      </form>

      {message && <div className="panel p-3 text-sm text-[var(--ok)]">{message}</div>}
      {error && <div className="text-[var(--danger)]">{error}</div>}

      <div className="panel overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="text-xs uppercase text-[var(--muted)]">
            <tr>
              <th className="px-4 py-3">Comprobante</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((i) => (
              <tr key={i.id} className="border-t border-[var(--stroke)]">
                <td className="px-4 py-3 font-medium">
                  {i.doc_type} {i.series}-{i.number}
                </td>
                <td className="px-4 py-3">{i.customer_name}</td>
                <td className="px-4 py-3">{money(i.total, i.currency)}</td>
                <td className="px-4 py-3"><span className="badge">{i.status}</span></td>
                <td className="px-4 py-3">{formatDate(i.issued_at || i.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
