import { z } from "zod";
import { sql, sqlOne } from "@/lib/db";
import { badRequest, json, notFound } from "@/lib/api";
import { logActivity, requireSession } from "@/lib/org";
import type { Quote, QuoteItem } from "@/lib/types";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: Request, ctx: Ctx) {
  const session = await requireSession(request);
  if (session instanceof Response) return session;
  const { id } = await ctx.params;
  const quote = await sqlOne<Quote>(
    `select q.*, c.full_name as contact_name, d.title as deal_title
     from quotes q
     left join contacts c on c.id = q.contact_id
     left join deals d on d.id = q.deal_id
     where q.id = $1 and q.org_id = $2`,
    [id, session.org.id],
  );
  if (!quote) return notFound();
  const items = await sql<QuoteItem>(
    `select * from quote_items where quote_id = $1 order by sort_order`,
    [id],
  );
  return json({ quote, items });
}

const patchSchema = z.object({
  status: z.enum(["draft", "sent", "accepted", "rejected", "expired"]).optional(),
  notes: z.string().optional(),
  terms: z.string().optional(),
});

export async function PATCH(request: Request, ctx: Ctx) {
  const session = await requireSession(request);
  if (session instanceof Response) return session;
  const { id } = await ctx.params;
  const body = patchSchema.safeParse(await request.json());
  if (!body.success) return badRequest(body.error.message);

  const current = await sqlOne<Quote>(
    `select * from quotes where id = $1 and org_id = $2`,
    [id, session.org.id],
  );
  if (!current) return notFound();

  const status = body.data.status ?? current.status;
  const rows = await sql<Quote>(
    `update quotes set
       status = $3,
       notes = $4,
       terms = $5,
       sent_at = case when $3 = 'sent' and sent_at is null then now() else sent_at end,
       accepted_at = case when $3 = 'accepted' then now() else accepted_at end,
       updated_at = now()
     where id = $1 and org_id = $2
     returning *`,
    [
      id,
      session.org.id,
      status,
      body.data.notes ?? current.notes,
      body.data.terms ?? current.terms,
    ],
  );

  if (status === "accepted" && current.deal_id) {
    await sql(
      `update deals set stage = 'negotiation', probability = 70, updated_at = now()
       where id = $1 and org_id = $2 and stage not in ('won','lost')`,
      [current.deal_id, session.org.id],
    );
  }

  await logActivity(
    session.org.id,
    session.userSub,
    "quote",
    id,
    "update",
    `Cotización ${rows[0].quote_number} → ${status}`,
  );
  return json({ quote: rows[0] });
}
