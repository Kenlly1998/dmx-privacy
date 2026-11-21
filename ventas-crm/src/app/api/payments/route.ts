import { z } from "zod";
import { sql } from "@/lib/db";
import { badRequest, json } from "@/lib/api";
import { logActivity, requireSession } from "@/lib/org";
import type { Payment } from "@/lib/types";

export async function GET(request: Request) {
  const session = await requireSession(request);
  if (session instanceof Response) return session;
  const payments = await sql<Payment>(
    `select p.*, c.full_name as contact_name, d.title as deal_title
     from payments p
     left join contacts c on c.id = p.contact_id
     left join deals d on d.id = p.deal_id
     where p.org_id = $1
     order by p.paid_at desc, p.created_at desc`,
    [session.org.id],
  );
  return json({ payments });
}

const createSchema = z.object({
  amount: z.number().positive(),
  method: z.enum(["transfer", "cash", "card", "yape", "plin", "other"]).default("transfer"),
  status: z.enum(["pending", "confirmed", "refunded"]).default("confirmed"),
  paid_at: z.string().optional(),
  reference: z.string().optional().default(""),
  notes: z.string().optional().default(""),
  deal_id: z.string().uuid().nullable().optional(),
  quote_id: z.string().uuid().nullable().optional(),
  contact_id: z.string().uuid().nullable().optional(),
});

export async function POST(request: Request) {
  const session = await requireSession(request);
  if (session instanceof Response) return session;
  const body = createSchema.safeParse(await request.json());
  if (!body.success) return badRequest(body.error.message);

  const rows = await sql<Payment>(
    `insert into payments (
       org_id, deal_id, quote_id, contact_id, amount, currency, method, status, paid_at, reference, notes
     ) values ($1,$2,$3,$4,$5,$6,$7,$8,coalesce($9::date, current_date),$10,$11)
     returning *`,
    [
      session.org.id,
      body.data.deal_id ?? null,
      body.data.quote_id ?? null,
      body.data.contact_id ?? null,
      body.data.amount,
      session.org.currency,
      body.data.method,
      body.data.status,
      body.data.paid_at ?? null,
      body.data.reference,
      body.data.notes,
    ],
  );
  await logActivity(
    session.org.id,
    session.userSub,
    "payment",
    rows[0].id,
    "create",
    `Pago registrado: ${body.data.amount} (${body.data.method})`,
  );
  return json({ payment: rows[0] }, 201);
}
