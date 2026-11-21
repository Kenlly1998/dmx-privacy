import { z } from "zod";
import { sql, sqlOne } from "@/lib/db";
import { badRequest, json } from "@/lib/api";
import { logActivity, requireSession } from "@/lib/org";
import { lineTotal, quoteMargin, quoteTotals, toNumber } from "@/lib/money";
import { createGrokProposal } from "@/lib/grok";
import type { Product, Quote, QuoteItem } from "@/lib/types";

/**
 * Bot de cotización:
 * 1) Interpreta mensaje / keywords
 * 2) Matchea catálogo
 * 3) Crea cotización draft
 * 4) (opcional) propone texto WA con Grok
 */
const schema = z.object({
  message: z.string().min(1),
  contact_id: z.string().uuid().nullable().optional(),
  deal_id: z.string().uuid().nullable().optional(),
  conversation_id: z.string().uuid().nullable().optional(),
  auto_send_draft_text: z.boolean().optional().default(false),
});

function matchProducts(products: Product[], message: string) {
  const tokens = message
    .toLowerCase()
    .split(/[^a-záéíóúñ0-9]+/i)
    .filter((t) => t.length > 2);
  const scored = products
    .map((p) => {
      const hay = `${p.name} ${p.brand ?? ""} ${p.sku} ${p.category} ${p.description}`.toLowerCase();
      const score = tokens.reduce((s, t) => (hay.includes(t) ? s + 1 : s), 0);
      return { product: p, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);
  return (scored.length ? scored : products.slice(0, 2).map((p) => ({ product: p, score: 0 })))
    .slice(0, 4)
    .map((x) => x.product);
}

export async function POST(request: Request) {
  const session = await requireSession(request);
  if (session instanceof Response) return session;
  const body = schema.safeParse(await request.json());
  if (!body.success) return badRequest(body.error.message);

  const products = await sql<Product>(
    `select * from products where org_id = $1 and active = true`,
    [session.org.id],
  );
  if (!products.length) return badRequest("Catálogo vacío");

  const matched = matchProducts(products, body.data.message);
  const items = matched.map((p) => ({
    product_id: p.id,
    description: `${p.brand ? p.brand + " · " : ""}${p.name}`,
    quantity: 1,
    unit_price: toNumber(p.unit_price),
    cost_price: toNumber(p.cost_price),
  }));
  const totals = quoteTotals(items, 0);
  const margin = quoteMargin(items);

  let dealId = body.data.deal_id ?? null;
  if (!dealId) {
    const deal = await sqlOne<{ id: string }>(
      `insert into deals (org_id, contact_id, title, stage, amount, source, notes)
       values ($1, $2, $3, 'quoted', $4, 'bot', $5) returning id`,
      [
        session.org.id,
        body.data.contact_id ?? null,
        `Cotización bot — ${matched.map((p) => p.name).join(", ").slice(0, 60)}`,
        totals.total,
        body.data.message,
      ],
    );
    dealId = deal?.id ?? null;
  }

  const count = await sqlOne<{ c: number }>(
    `select count(*)::int as c from quotes where org_id = $1`,
    [session.org.id],
  );
  const quoteNumber = `COT-${new Date().getFullYear()}-${String((count?.c ?? 0) + 1).padStart(3, "0")}`;

  const quote = await sqlOne<Quote>(
    `insert into quotes (
       org_id, deal_id, contact_id, quote_number, version, status, currency,
       subtotal, tax_rate, tax_amount, total, notes, terms
     ) values ($1,$2,$3,$4,1,'draft',$5,$6,0,0,$6,$7,$8)
     returning *`,
    [
      session.org.id,
      dealId,
      body.data.contact_id ?? null,
      quoteNumber,
      session.org.currency,
      totals.total,
      `Generada por bot desde: "${body.data.message}"`,
      "Anticipo 40%. Validez 15 días. Sujeto a aprobación.",
    ],
  );
  if (!quote) return badRequest("No se pudo crear borrador");

  const quoteItems: QuoteItem[] = [];
  for (const [index, item] of items.entries()) {
    const rows = await sql<QuoteItem>(
      `insert into quote_items (quote_id, product_id, description, quantity, unit_price, cost_price, line_total, sort_order)
       values ($1,$2,$3,$4,$5,$6,$7,$8) returning *`,
      [
        quote.id,
        item.product_id,
        item.description,
        item.quantity,
        item.unit_price,
        item.cost_price,
        lineTotal(item.quantity, item.unit_price),
        index,
      ],
    );
    quoteItems.push(rows[0]);
  }

  const grok = await createGrokProposal({
    orgId: session.org.id,
    actionType: "quote_draft",
    prompt: `Arma un mensaje corto de WhatsApp presentando esta cotización ${quote.quote_number} con margen interno ${margin.margin_percent}% (no menciones el margen al cliente). Mensaje del lead: ${body.data.message}`,
    dealId,
    contactId: body.data.contact_id,
    channel: "whatsapp",
    inboundMessage: body.data.message,
  });

  const action = await sqlOne<{ id: string }>(
    `insert into ai_actions (org_id, deal_id, contact_id, action_type, prompt, proposal, status, model)
     values ($1,$2,$3,'quote_draft',$4,$5,'pending',$6) returning id`,
    [
      session.org.id,
      dealId,
      body.data.contact_id ?? null,
      body.data.message,
      grok.proposal,
      grok.model,
    ],
  );

  await logActivity(
    session.org.id,
    session.userSub,
    "quote",
    quote.id,
    "bot_draft",
    `Bot creó borrador ${quote.quote_number} (margen ${margin.margin_percent}%)`,
  );

  return json({
    quote,
    items: quoteItems,
    margin,
    matched_products: matched.map((p) => ({
      id: p.id,
      name: p.name,
      brand: p.brand,
      unit_price: p.unit_price,
      cost_price: p.cost_price,
    })),
    ai_action_id: action?.id,
    whatsapp_draft: grok.proposal,
    demo: grok.demo,
    requires_approval: true,
  }, 201);
}

const approveSchema = z.object({
  quote_id: z.string().uuid(),
  conversation_id: z.string().uuid().nullable().optional(),
  ai_action_id: z.string().uuid().nullable().optional(),
  message: z.string().min(1),
});

/** Aprueba cotización draft y (opcional) envía texto al inbox WA */
export async function PATCH(request: Request) {
  const session = await requireSession(request);
  if (session instanceof Response) return session;
  const body = approveSchema.safeParse(await request.json());
  if (!body.success) return badRequest(body.error.message);

  const quote = await sqlOne<Quote>(
    `update quotes set status = 'sent', sent_at = coalesce(sent_at, now()), updated_at = now()
     where id = $1 and org_id = $2 returning *`,
    [body.data.quote_id, session.org.id],
  );
  if (!quote) return badRequest("Cotización no encontrada");

  if (body.data.ai_action_id) {
    await sql(
      `update ai_actions set status = 'approved', decided_at = now() where id = $1 and org_id = $2`,
      [body.data.ai_action_id, session.org.id],
    );
  }

  let messageId: string | null = null;
  if (body.data.conversation_id) {
    const msg = await sqlOne<{ id: string }>(
      `insert into messages (conversation_id, direction, body, sender_name, status)
       values ($1,'outbound',$2,$3,'delivered') returning id`,
      [body.data.conversation_id, body.data.message, session.displayName],
    );
    await sql(`update conversations set last_message_at = now() where id = $1`, [
      body.data.conversation_id,
    ]);
    messageId = msg?.id ?? null;
  }

  await logActivity(
    session.org.id,
    session.userSub,
    "quote",
    quote.id,
    "approve_send",
    `Cotización ${quote.quote_number} aprobada y enviada`,
  );

  return json({ quote, message_id: messageId });
}
