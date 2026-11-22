"use client";

import { useEffect, useMemo, useState } from "react";
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
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (category !== "all" && p.category !== category) return false;
      if (!q) return true;
      const hay = `${p.name} ${p.sku} ${p.brand ?? ""} ${p.supplier_name ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [products, query, category]);

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
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="eyebrow">Equipos</div>
          <h1 className="font-display mt-1 text-3xl md:text-4xl">Inventario</h1>
          <p className="mt-1 max-w-2xl text-[var(--muted)]">
            Catálogo KLA PRO: SKU, marca, costo, venta y margen.
          </p>
        </div>
        <div className="text-sm text-[var(--muted)]">
          {filtered.length} de {products.length} ítems
        </div>
      </header>

      <form onSubmit={onSubmit} className="panel grid gap-3 p-4 md:grid-cols-3">
        <div>
          <label className="label">Nombre</label>
          <input
            className="input"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>
        <div>
          <label className="label">SKU</label>
          <input
            className="input"
            value={form.sku}
            onChange={(e) => setForm({ ...form, sku: e.target.value })}
            placeholder="CHV-SPOT300"
          />
        </div>
        <div>
          <label className="label">Marca</label>
          <input
            className="input"
            value={form.brand}
            onChange={(e) => setForm({ ...form, brand: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Precio venta</label>
          <input
            className="input"
            type="number"
            min="0"
            step="0.01"
            required
            value={form.unit_price}
            onChange={(e) => setForm({ ...form, unit_price: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Costo (proveedor)</label>
          <input
            className="input"
            type="number"
            min="0"
            step="0.01"
            value={form.cost_price}
            onChange={(e) => setForm({ ...form, cost_price: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Proveedor</label>
          <select
            className="select"
            value={form.supplier_account_id}
            onChange={(e) =>
              setForm({ ...form, supplier_account_id: e.target.value })
            }
          >
            <option value="">—</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Categoría</label>
          <select
            className="select"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          >
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
          <input
            className="input"
            value={form.unit}
            onChange={(e) => setForm({ ...form, unit: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Descripción</label>
          <input
            className="input"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
        <div className="md:col-span-3">
          <button className="btn btn-primary" type="submit">
            Nuevo equipo
          </button>
        </div>
      </form>

      {error && <div className="text-[var(--danger)]">{error}</div>}

      <div className="panel overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-[var(--stroke)] bg-[var(--bg-soft)] px-4 py-3">
          <input
            className="input max-w-sm"
            placeholder="Buscar SKU, marca, proveedor…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <select
            className="select max-w-[180px]"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="all">Todas las categorías</option>
            <option value="reventa">Reventa</option>
            <option value="renta">Renta</option>
            <option value="servicio">Servicio</option>
            <option value="capacitacion">Capacitación</option>
            <option value="software">Software</option>
            <option value="paquete">Paquete</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="table-inv min-w-[920px]">
            <thead>
              <tr>
                <th>SKU / Ítem</th>
                <th>Categoría</th>
                <th>Proveedor</th>
                <th>Costo</th>
                <th>Venta</th>
                <th>Margen</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="font-medium">{p.name}</div>
                    <div className="text-xs text-[var(--muted)]">
                      {p.sku || "sin SKU"}
                      {p.brand ? ` · ${p.brand}` : ""}
                    </div>
                  </td>
                  <td>
                    <span className="badge">{p.category}</span>
                  </td>
                  <td className="text-[var(--muted)]">
                    {p.supplier_name || "—"}
                  </td>
                  <td>{money(p.cost_price)}</td>
                  <td className="font-semibold text-[var(--accent-strong)]">
                    {money(p.unit_price)}
                  </td>
                  <td>
                    <div className="font-semibold text-[var(--ok)]">
                      {money(p.unit_margin)} · {p.margin_percent ?? 0}%
                    </div>
                    <div className="text-xs text-[var(--muted)]">
                      markup {p.markup_percent ?? 0}%
                    </div>
                  </td>
                  <td>
                    <span className="badge">
                      {p.active ? "activo" : "off"}
                    </span>
                  </td>
                </tr>
              ))}
              {!filtered.length && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-[var(--muted)]">
                    Sin ítems para este filtro.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
