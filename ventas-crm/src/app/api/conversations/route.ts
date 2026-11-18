import { z } from "zod";
import { sql } from "@/lib/db";
import { badRequest, json } from "@/lib/api";
import { requireSession } from "@/lib/org";
import type { Conversation } from "@/lib/types";

export async function GET(request: Request) {
  const session = await requireSession(request);
  if (session instanceof Response) return session;
  const conversations = await sql<Conversation>(
    `select c.*, ct.full_name as contact_name,
       (select body from messages m where m.conversation_id = c.id order by created_at desc limit 1) as preview
     from conversations c
     left join contacts ct on ct.id = c.contact_id
     where c.org_id = $1
     order by c.last_message_at desc`,
    [session.org.id],
  );
  return json({ conversations });
}

const createSchema = z.object({
  channel: z.enum(["whatsapp", "instagram", "web", "email"]),
  contact_id: z.string().uuid().nullable().optional(),
  deal_id: z.string().uuid().nullable().optional(),
  body: z.string().min(1),
  direction: z.enum(["inbound", "outbound"]).default("outbound"),
});

export async function POST(request: Request) {
  const session = await requireSession(request);
  if (session instanceof Response) return session;
  const body = createSchema.safeParse(await request.json());
  if (!body.success) return badRequest(body.error.message);

  const conv = await sql<{ id: string }>(
    `insert into conversations (org_id, contact_id, deal_id, channel, status, last_message_at)
     values ($1,$2,$3,$4,'open', now()) returning id`,
    [
      session.org.id,
      body.data.contact_id ?? null,
      body.data.deal_id ?? null,
      body.data.channel,
    ],
  );
  await sql(
    `insert into messages (conversation_id, direction, body, sender_name, status)
     values ($1,$2,$3,$4,'delivered')`,
    [
      conv[0].id,
      body.data.direction,
      body.data.body,
      body.data.direction === "outbound" ? session.displayName : "Contacto",
    ],
  );
  return json({ conversationId: conv[0].id }, 201);
}
