import { z } from "zod";
import { sql, sqlOne } from "@/lib/db";
import { badRequest, json } from "@/lib/api";
import { logActivity, requireSession } from "@/lib/org";
import { lineTotal, quoteTotals } from "@/lib/money";
import type { Quote, QuoteItem } from "@/lib/types";

export async function GET(request: Request) {
  const session = await requireSession(request);
  if (session instanceof Response) return session;
  const quotes = await sql<Quote>(
    `select q.*, c.full_name as contact_name, d.title as deal_title
     from quotes q
     left join contacts c on c.id = q.contact_id
     left join deals d on d.id = q.deal_id
     where q.org_id = $1
     order by q.created_at desc`,
    [session.org.id],
  );
  return json({ quotes });
}

const itemSchema = z.object({
  product_id: z.string().uuid().nullable().optional(),
  description: z.string().min(1),
  quantity: z.number().positive(),
  unit_price: z.number().nonnegative(),
});

const createSchema = z.object({
  deal_id: z.string().uuid().nullable().optional(),
  contact_id: z.string().uuid().nullable().optional(),
  tax_rate: z.number().nonnegative().optional().default(0),
  notes: z.string().optional().default(""),
  terms: z
    .string()
    .optional()
    .default("Anticipo 40%. Saldo antes del evento. Validez 15 días."),
  valid_until: z.string().nullable().optional(),
  items: z.array(itemSchema).min(1),
  status: z.enum(["draft", "sent"]).optional().default("draft"),
});

export async function POST(request: Request) {
  const session = await requireSession(request);
  if (session instanceof Response) return session;
  const body = createSchema.safeParse(await request.json());
  if (!body.success) return badRequest(body.error.message);

  const count = await sqlOne<{ c: number }>(
    `select count(*)::int as c from quotes where org_id = $1`,
    [session.org.id],
  );
  const quoteNumber = `COT-${new Date().getFullYear()}-${String((count?.c ?? 0) + 1).padStart(3, "0")}`;
  const totals = quoteTotals(
    body.data.items.map((i) => ({
      quantity: i.quantity,
      unit_price: i.unit_price,
    })),
    body.data.tax_rate,
  );

  const quote = await sqlOne<Quote>(
    `insert into quotes (
       org_id, deal_id, contact_id, quote_number, version, status, currency,
       subtotal, tax_rate, tax_amount, total, valid_until, notes, terms, sent_at
     ) values ($1,$2,$3,$4,1,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
     returning *`,
    [
      session.org.id,
      body.data.deal_id ?? null,
      body.data.contact_id ?? null,
      quoteNumber,
      body.data.status,
      session.org.currency,
      totals.subtotal,
      body.data.tax_rate,
      totals.tax_amount,
      totals.total,
      body.data.valid_until ?? null,
      body.data.notes,
      body.data.terms,
      body.data.status === "sent" ? new Date().toISOString() : null,
    ],
  );
  if (!quote) return badRequest("No se pudo crear la cotización");

  const items: QuoteItem[] = [];
  for (const [index, item] of body.data.items.entries()) {
    const lt = lineTotal(item.quantity, item.unit_price);
    const rows = await sql<QuoteItem>(
      `insert into quote_items (quote_id, product_id, description, quantity, unit_price, line_total, sort_order)
       values ($1,$2,$3,$4,$5,$6,$7) returning *`,
      [
        quote.id,
        item.product_id ?? null,
        item.description,
        item.quantity,
        item.unit_price,
        lt,
        index,
      ],
    );
    items.push(rows[0]);
  }

  if (body.data.deal_id) {
    await sql(
      `update deals set amount = $3, stage = case when stage in ('lead','qualified') then 'quoted' else stage end,
         probability = case when stage in ('lead','qualified') then 50 else probability end,
         updated_at = now()
       where id = $1 and org_id = $2`,
      [body.data.deal_id, session.org.id, totals.total],
    );
  }

  await logActivity(
    session.org.id,
    session.userSub,
    "quote",
    quote.id,
    "create",
    `Cotización ${quote.quote_number} creada`,
  );
  return json({ quote, items }, 201);
}
