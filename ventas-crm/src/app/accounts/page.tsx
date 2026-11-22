"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/client";

type AccountRow = {
  id: string;
  name: string;
  industry: string;
  website: string;
  notes: string;
  contacts_count: number;
  deals_count: number;
};

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<AccountRow[]>([]);
  const [form, setForm] = useState({
    name: "",
    industry: "",
    website: "",
    notes: "",
    account_type: "customer",
  });
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const data = await api<{ accounts: AccountRow[] }>("/api/accounts");
    setAccounts(data.accounts);
  }

  useEffect(() => {
    load().catch((e: Error) => setError(e.message));
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    await api("/api/accounts", {
      method: "POST",
      body: JSON.stringify(form),
    });
    setForm({ name: "", industry: "", website: "", notes: "", account_type: "customer" });
    await load();
  }

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-3xl">Empresas</h1>
        <p className="text-[var(--muted)]">
          Clientes y proveedores (reventa). Tipo: customer / supplier / both.
        </p>
      </header>

      <form onSubmit={onSubmit} className="panel grid gap-3 p-4 md:grid-cols-2">
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
          <label className="label">Tipo</label>
          <select
            className="select"
            value={form.account_type}
            onChange={(e) => setForm({ ...form, account_type: e.target.value })}
          >
            <option value="customer">Cliente</option>
            <option value="supplier">Proveedor</option>
            <option value="both">Ambos</option>
          </select>
        </div>
        <div>
          <label className="label">Industria</label>
          <input
            className="input"
            value={form.industry}
            onChange={(e) => setForm({ ...form, industry: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Website</label>
          <input
            className="input"
            value={form.website}
            onChange={(e) => setForm({ ...form, website: e.target.value })}
          />
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
            Crear empresa
          </button>
        </div>
      </form>

      {error && <div className="text-[var(--danger)]">{error}</div>}

      <div className="grid gap-3 md:grid-cols-2">
        {accounts.map((a) => (
          <Link key={a.id} href={`/accounts/${a.id}`} className="panel block p-4">
            <div className="flex items-center gap-2">
              <div className="font-medium">{a.name}</div>
              <span className="badge">{(a as { account_type?: string }).account_type || "customer"}</span>
            </div>
            <div className="text-xs text-[var(--muted)]">
              {a.industry || "Sin industria"} · {a.contacts_count} contactos ·{" "}
              {a.deals_count} deals
            </div>
            {a.website && (
              <div className="mt-1 text-sm text-[var(--accent)]">{a.website}</div>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
