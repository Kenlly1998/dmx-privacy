import { sql } from "@/lib/db";
import { json } from "@/lib/api";
import { requireSession } from "@/lib/org";

type TimelineItem = {
  id: string;
  kind: string;
  summary: string;
  created_at: string;
  entity_type?: string;
  entity_id?: string | null;
  meta?: Record<string, unknown>;
};

export async function GET(request: Request) {
  const session = await requireSession(request);
  if (session instanceof Response) return session;
  const { searchParams } = new URL(request.url);
  const dealId = searchParams.get("deal_id");
  const contactId = searchParams.get("contact_id");
  const orgId = session.org.id;

  const items: TimelineItem[] = [];

  const activity = await sql<{
    id: string;
    summary: string;
    created_at: string;
    entity_type: string;
    entity_id: string | null;
    action: string;
  }>(
    `select id, summary, created_at::text, entity_type, entity_id, action
     from activity_log
     where org_id = $1
       and ($2::uuid is null or entity_id = $2 or (entity_type = 'deal' and entity_id = $2))
       and ($3::uuid is null or entity_id = $3 or (entity_type = 'contact' and entity_id = $3))
     order by created_at desc
     limit 40`,
    [orgId, dealId, contactId],
  );
  for (const row of activity) {
    items.push({
      id: `act-${row.id}`,
      kind: "activity",
      summary: row.summary,
      created_at: row.created_at,
      entity_type: row.entity_type,
      entity_id: row.entity_id,
      meta: { action: row.action },
    });
  }

  const payments = await sql<{
    id: string;
    amount: string;
    method: string;
    paid_at: string;
    created_at: string;
    deal_id: string | null;
    contact_id: string | null;
  }>(
    `select id, amount::text, method, paid_at::text, created_at::text, deal_id, contact_id
     from payments
     where org_id = $1
       and ($2::uuid is null or deal_id = $2)
       and ($3::uuid is null or contact_id = $3)
     order by created_at desc limit 20`,
    [orgId, dealId, contactId],
  );
  for (const p of payments) {
    items.push({
      id: `pay-${p.id}`,
      kind: "payment",
      summary: `Pago ${p.amount} vía ${p.method}`,
      created_at: p.created_at,
      entity_type: "payment",
      entity_id: p.id,
    });
  }

  const quotes = await sql<{
    id: string;
    quote_number: string;
    status: string;
    total: string;
    created_at: string;
  }>(
    `select id, quote_number, status, total::text, created_at::text
     from quotes
     where org_id = $1
       and ($2::uuid is null or deal_id = $2)
       and ($3::uuid is null or contact_id = $3)
     order by created_at desc limit 20`,
    [orgId, dealId, contactId],
  );
  for (const q of quotes) {
    items.push({
      id: `quote-${q.id}`,
      kind: "quote",
      summary: `Cotización ${q.quote_number} (${q.status}) · ${q.total}`,
      created_at: q.created_at,
      entity_type: "quote",
      entity_id: q.id,
    });
  }

  if (contactId || dealId) {
    const messages = await sql<{
      id: string;
      body: string;
      direction: string;
      created_at: string;
      channel: string;
    }>(
      `select m.id, m.body, m.direction, m.created_at::text, c.channel
       from messages m
       join conversations c on c.id = m.conversation_id
       where c.org_id = $1
         and ($2::uuid is null or c.deal_id = $2)
         and ($3::uuid is null or c.contact_id = $3)
       order by m.created_at desc limit 30`,
      [orgId, dealId, contactId],
    );
    for (const m of messages) {
      items.push({
        id: `msg-${m.id}`,
        kind: "message",
        summary: `${m.channel} ${m.direction}: ${m.body.slice(0, 120)}`,
        created_at: m.created_at,
        entity_type: "message",
        entity_id: m.id,
      });
    }
  }

  const tasks = await sql<{
    id: string;
    title: string;
    status: string;
    created_at: string;
    completed_at: string | null;
  }>(
    `select id, title, status, created_at::text, completed_at::text
     from tasks
     where org_id = $1
       and ($2::uuid is null or deal_id = $2)
       and ($3::uuid is null or contact_id = $3)
     order by created_at desc limit 20`,
    [orgId, dealId, contactId],
  );
  for (const t of tasks) {
    items.push({
      id: `task-${t.id}`,
      kind: "task",
      summary: `Tarea ${t.status === "done" ? "completada" : "creada"}: ${t.title}`,
      created_at: t.completed_at || t.created_at,
      entity_type: "task",
      entity_id: t.id,
    });
  }

  items.sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  return json({ items: items.slice(0, 60) });
}
