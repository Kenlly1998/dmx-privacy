import { z } from "zod";
import { sql, sqlOne } from "@/lib/db";
import { badRequest, json } from "@/lib/api";
import { logActivity, requireSession } from "@/lib/org";
import { lineTotal, toNumber } from "@/lib/money";
import type { Invoice } from "@/lib/types";

export async function GET(request: Request) {
  const session = await requireSession(request);
  if (session instanceof Response) return session;
  const invoices = await sql<Invoice>(
    `select i.*, d.title as deal_title
     from invoices i
     left join deals d on d.id = i.deal_id
     where i.org_id = $1
     order by i.created_at desc`,
    [session.org.id],
  );
  return json({
    invoices,
    pseConfigured: Boolean(process.env.SUNAT_PSE_TOKEN?.trim()),
    mode: process.env.SUNAT_PSE_TOKEN?.trim() ? "live" : "demo",
  });
}

const itemSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().positive(),
  unit_price: z.number().nonnegative(),
  cost_price: z.number().nonnegative().optional().default(0),
});

const createSchema = z.object({
  doc_type: z.enum(["boleta", "factura"]).default("boleta"),
  series: z.string().optional(),
  deal_id: z.string().uuid().nullable().optional(),
  quote_id: z.string().uuid().nullable().optional(),
  contact_id: z.string().uuid().nullable().optional(),
  customer_doc_type: z.enum(["1", "6"]).default("1"),
  customer_doc_number: z.string().min(8),
  customer_name: z.string().min(1),
  currency: z.string().optional().default("PEN"),
  igv_rate: z.number().nonnegative().optional().default(18),
  items: z.array(itemSchema).min(1),
  issue: z.boolean().optional().default(true),
});

export async function POST(request: Request) {
  const session = await requireSession(request);
  if (session instanceof Response) return session;
  const body = createSchema.safeParse(await request.json());
  if (!body.success) return badRequest(body.error.message);

  const subtotal = body.data.items.reduce(
    (s, i) => s + lineTotal(i.quantity, i.unit_price),
    0,
  );
  const igv = Math.round(subtotal * (body.data.igv_rate / 100) * 100) / 100;
  const total = Math.round((subtotal + igv) * 100) / 100;
  const series =
    body.data.series || (body.data.doc_type === "factura" ? "F001" : "B001");

  const count = await sqlOne<{ c: number }>(
    `select count(*)::int as c from invoices where org_id = $1 and series = $2`,
    [session.org.id, series],
  );
  const number = String((count?.c ?? 0) + 1).padStart(8, "0");

  const pseToken = process.env.SUNAT_PSE_TOKEN?.trim() ?? "";
  let status = "draft";
  let provider = "demo_pse";
  let cdr = "";
  let payload: Record<string, unknown> = {};

  if (body.data.issue) {
    if (pseToken) {
      // Live PSE hook — payload ready; real HTTP depends on chosen provider
      provider = "sunat_pse";
      status = "queued";
      payload = {
        note: "Listo para PSE. Configura el endpoint del proveedor elegido.",
        customer: {
          doc_type: body.data.customer_doc_type,
          doc_number: body.data.customer_doc_number,
          name: body.data.customer_name,
        },
        totals: { subtotal, igv, total },
      };
    } else {
      provider = "demo_pse";
      status = "demo";
      cdr = "ACEPTADO_DEMO";
      payload = {
        demo: true,
        message:
          "Comprobante simulado. Conecta SUNAT_PSE_TOKEN para envío real a un PSE.",
      };
    }
  }

  const invoice = await sqlOne<Invoice>(
    `insert into invoices (
       org_id, deal_id, quote_id, contact_id, doc_type, series, number, currency,
       subtotal, igv, total, customer_doc_type, customer_doc_number, customer_name,
       status, provider, payload, cdr_status, issued_at
     ) values (
       $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17::jsonb,$18,
       case when $15 in ('demo','accepted','queued') then now() else null end
     ) returning *`,
    [
      session.org.id,
      body.data.deal_id ?? null,
      body.data.quote_id ?? null,
      body.data.contact_id ?? null,
      body.data.doc_type,
      series,
      number,
      body.data.currency,
      subtotal,
      igv,
      total,
      body.data.customer_doc_type,
      body.data.customer_doc_number,
      body.data.customer_name,
      status,
      provider,
      JSON.stringify(payload),
      cdr,
    ],
  );
  if (!invoice) return badRequest("No se pudo crear el comprobante");

  for (const [index, item] of body.data.items.entries()) {
    await sql(
      `insert into invoice_items (invoice_id, description, quantity, unit_price, cost_price, line_total, sort_order)
       values ($1,$2,$3,$4,$5,$6,$7)`,
      [
        invoice.id,
        item.description,
        item.quantity,
        item.unit_price,
        item.cost_price ?? 0,
        lineTotal(item.quantity, item.unit_price),
        index,
      ],
    );
  }

  await logActivity(
    session.org.id,
    session.userSub,
    "invoice",
    invoice.id,
    "create",
    `${body.data.doc_type.toUpperCase()} ${series}-${number} · ${status}`,
  );

  const profit = body.data.items.reduce(
    (s, i) =>
      s +
      (lineTotal(i.quantity, i.unit_price) -
        lineTotal(i.quantity, toNumber(i.cost_price))),
    0,
  );

  return json({ invoice, margin: { profit: Math.round(profit * 100) / 100 } }, 201);
}
