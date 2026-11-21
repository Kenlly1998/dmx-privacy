"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import { money } from "@/lib/money";

type ProductRow = {
  id: string;
  name: string;
  sku: string;
  brand?: string;
  supplier_name?: string | null;
  description: string;
  unit_price: number | string;
  cost_price?: number | string;
  unit: string;
  category: string;
  active: boolean;
  unit_margin?: number;
  margin_percent?: number;
  markup_percent?: number;
};

type Account = { id: string; name: string; account_type?: string };

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [suppliers, setSuppliers] = useState<Account[]>([]);
  const [form, setForm] = useState({
    name: "",
    sku: "",
    brand: "",
    unit_price: "",
    cost_price: "",
    unit: "unidad",
    category: "reventa",
    supplier_account_id: "",
    description: "",
  });
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const [p, a] = await Promise.all([
      api<{ products: ProductRow[] }>("/api/products"),
      api<{ accounts: Account[] }>("/api/accounts"),
    ]);
    setProducts(p.products);
    setSuppliers(
      a.accounts.filter(
        (x) => x.account_type === "supplier" || x.account_type === "both",
      ),
    );
  }

  useEffect(() => {
    load().catch((e: Error) => setError(e.message));
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api("/api/products", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          unit_price: Number(form.unit_price),
          cost_price: Number(form.cost_price || 0),
          supplier_account_id: form.supplier_account_id || null,
        }),
      });
      setForm({
        name: "",
        sku: "",
        brand: "",
        unit_price: "",
        cost_price: "",
        unit: "unidad",
        category: "reventa",
        supplier_account_id: "",
        description: "",
      });
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-3xl">Catálogo</h1>
        <p className="text-[var(--muted)]">
          Precio de venta, costo y margen. Ideal para reventa de otras marcas.
        </p>
      </header>

      <form onSubmit={onSubmit} className="panel grid gap-3 p-4 md:grid-cols-3">
        <div>
          <label className="label">Nombre</label>
          <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label className="label">SKU</label>
          <input className="input" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="CHV-SPOT300" />
        </div>
        <div>
          <label className="label">Marca</label>
          <input className="input" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
        </div>
        <div>
          <label className="label">Precio venta</label>
          <input className="input" type="number" min="0" step="0.01" required value={form.unit_price} onChange={(e) => setForm({ ...form, unit_price: e.target.value })} />
        </div>
        <div>
          <label className="label">Costo (proveedor)</label>
          <input className="input" type="number" min="0" step="0.01" value={form.cost_price} onChange={(e) => setForm({ ...form, cost_price: e.target.value })} />
        </div>
        <div>
          <label className="label">Proveedor</label>
          <select className="select" value={form.supplier_account_id} onChange={(e) => setForm({ ...form, supplier_account_id: e.target.value })}>
            <option value="">—</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Categoría</label>
          <select className="select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            <option value="reventa">Reventa</option>
            <option value="renta">Renta</option>
            <option value="servicio">Servicio</option>
            <option value="capacitacion">Capacitación</option>
            <option value="software">Software</option>
            <option value="paquete">Paquete</option>
          </select>
        </div>
        <div>
          <label className="label">Unidad</label>
          <input className="input" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
        </div>
        <div>
          <label className="label">Descripción</label>
          <input className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div>
          <button className="btn btn-primary" type="submit">Agregar producto</button>
        </div>
      </form>

      {error && <div className="text-[var(--danger)]">{error}</div>}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {products.map((p) => (
          <div key={p.id} className="panel p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-xs text-[var(--muted)]">{p.brand || "Sin marca"} · {p.category}</div>
                <div className="font-medium">{p.name}</div>
                <div className="text-xs text-[var(--muted)]">{p.sku || "sin SKU"}{p.supplier_name ? ` · ${p.supplier_name}` : ""}</div>
              </div>
              <span className="badge">{p.active ? "activo" : "off"}</span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div>
                <div className="label">Venta</div>
                <div className="font-display text-xl text-[var(--accent)]">{money(p.unit_price)}</div>
              </div>
              <div>
                <div className="label">Costo</div>
                <div>{money(p.cost_price)}</div>
              </div>
              <div>
                <div className="label">Margen $</div>
                <div className="text-[var(--ok)]">{money(p.unit_margin)}</div>
              </div>
              <div>
                <div className="label">Margen %</div>
                <div>{p.margin_percent ?? 0}% <span className="text-[var(--muted)]">(markup {p.markup_percent ?? 0}%)</span></div>
              </div>
            </div>
            <p className="mt-2 text-sm text-[var(--muted)]">{p.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
