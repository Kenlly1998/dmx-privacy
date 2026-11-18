"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import { money } from "@/lib/money";
import type { Product } from "@/lib/types";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState({
    name: "",
    sku: "",
    unit_price: "",
    unit: "unidad",
    category: "general",
    description: "",
  });
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const data = await api<{ products: Product[] }>("/api/products");
    setProducts(data.products);
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
        }),
      });
      setForm({
        name: "",
        sku: "",
        unit_price: "",
        unit: "unidad",
        category: "general",
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
          Precios base para cotizar sin inventar números (CueMark, LED, servicios).
        </p>
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
          />
        </div>
        <div>
          <label className="label">Precio</label>
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
          <label className="label">Unidad</label>
          <input
            className="input"
            value={form.unit}
            onChange={(e) => setForm({ ...form, unit: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Categoría</label>
          <input
            className="input"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
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
        <div>
          <button className="btn btn-primary" type="submit">
            Agregar producto
          </button>
        </div>
      </form>

      {error && <div className="text-[var(--danger)]">{error}</div>}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {products.map((p) => (
          <div key={p.id} className="panel p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-medium">{p.name}</div>
                <div className="text-xs text-[var(--muted)]">
                  {p.sku || "sin SKU"} · {p.category}
                </div>
              </div>
              <span className="badge">{p.active ? "activo" : "off"}</span>
            </div>
            <div className="mt-3 font-display text-2xl text-[var(--accent)]">
              {money(p.unit_price)}
              <span className="ml-1 text-sm text-[var(--muted)]">
                / {p.unit}
              </span>
            </div>
            <p className="mt-2 text-sm text-[var(--muted)]">{p.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
