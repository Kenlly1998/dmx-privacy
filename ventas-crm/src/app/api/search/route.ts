import { sql } from "@/lib/db";
import { json } from "@/lib/api";
import { requireSession } from "@/lib/org";

export async function GET(request: Request) {
  const session = await requireSession(request);
  if (session instanceof Response) return session;
  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return json({ results: [] });

  const orgId = session.org.id;
  const like = `%${q}%`;

  const [contacts, deals, quotes, accounts] = await Promise.all([
    sql<{ id: string; full_name: string; email: string; phone: string }>(
      `select id, full_name, email, phone from contacts
       where org_id = $1 and (full_name ilike $2 or email ilike $2 or phone ilike $2)
       order by updated_at desc limit 8`,
      [orgId, like],
    ),
    sql<{ id: string; title: string; stage: string; amount: string }>(
      `select id, title, stage, amount::text from deals
       where org_id = $1 and title ilike $2
       order by updated_at desc limit 8`,
      [orgId, like],
    ),
    sql<{ id: string; quote_number: string; status: string; total: string }>(
      `select id, quote_number, status, total::text from quotes
       where org_id = $1 and quote_number ilike $2
       order by created_at desc limit 5`,
      [orgId, like],
    ),
    sql<{ id: string; name: string; industry: string }>(
      `select id, name, industry from accounts
       where org_id = $1 and name ilike $2
       order by updated_at desc limit 5`,
      [orgId, like],
    ),
  ]);

  const results = [
    ...contacts.map((c) => ({
      type: "contact" as const,
      id: c.id,
      title: c.full_name,
      subtitle: c.email || c.phone || "Contacto",
      href: `/contacts/${c.id}`,
    })),
    ...deals.map((d) => ({
      type: "deal" as const,
      id: d.id,
      title: d.title,
      subtitle: `${d.stage} · ${d.amount}`,
      href: `/deals/${d.id}`,
    })),
    ...quotes.map((qrow) => ({
      type: "quote" as const,
      id: qrow.id,
      title: qrow.quote_number,
      subtitle: `${qrow.status} · ${qrow.total}`,
      href: `/quotes?id=${qrow.id}`,
    })),
    ...accounts.map((a) => ({
      type: "account" as const,
      id: a.id,
      title: a.name,
      subtitle: a.industry || "Empresa",
      href: `/accounts/${a.id}`,
    })),
  ];

  return json({ results });
}
