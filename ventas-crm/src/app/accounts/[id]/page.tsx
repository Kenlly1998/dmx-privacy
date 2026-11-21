"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import { money } from "@/lib/money";
import type { Account, Contact, Deal } from "@/lib/types";

export default function AccountDetailPage() {
  const params = useParams<{ id: string }>();
  const [account, setAccount] = useState<Account | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<{ account: Account; contacts: Contact[]; deals: Deal[] }>(
      `/api/accounts/${params.id}`,
    )
      .then((data) => {
        setAccount(data.account);
        setContacts(data.contacts);
        setDeals(data.deals);
      })
      .catch((e: Error) => setError(e.message));
  }, [params.id]);

  if (error) return <div className="text-[var(--danger)]">{error}</div>;
  if (!account) return <div className="text-[var(--muted)]">Cargando…</div>;

  return (
    <div className="space-y-5">
      <div>
        <Link href="/accounts" className="text-sm text-[var(--accent)]">
          ← Empresas
        </Link>
        <h1 className="font-display mt-1 text-3xl">{account.name}</h1>
        <p className="text-[var(--muted)]">
          {account.industry || "Sin industria"}
          {account.website ? ` · ${account.website}` : ""}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="panel p-4">
          <h2 className="font-display text-xl">Contactos</h2>
          <ul className="mt-3 space-y-2">
            {contacts.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/contacts/${c.id}`}
                  className="text-sm text-[var(--accent)]"
                >
                  {c.full_name}
                </Link>
                <div className="text-xs text-[var(--muted)]">
                  {c.email || c.phone || "—"}
                </div>
              </li>
            ))}
            {!contacts.length && (
              <li className="text-sm text-[var(--muted)]">Sin contactos.</li>
            )}
          </ul>
        </div>
        <div className="panel p-4">
          <h2 className="font-display text-xl">Deals</h2>
          <ul className="mt-3 space-y-2">
            {deals.map((d) => (
              <li
                key={d.id}
                className="flex items-center justify-between gap-2 text-sm"
              >
                <Link href={`/deals/${d.id}`} className="text-[var(--accent)]">
                  {d.title}
                </Link>
                <span>
                  {d.stage} · {money(d.amount)}
                </span>
              </li>
            ))}
            {!deals.length && (
              <li className="text-sm text-[var(--muted)]">Sin deals.</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
