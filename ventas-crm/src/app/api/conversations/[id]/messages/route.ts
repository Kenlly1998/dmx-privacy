import { z } from "zod";
import { sql, sqlOne } from "@/lib/db";
import { badRequest, json, notFound } from "@/lib/api";
import { requireSession } from "@/lib/org";
import type { Message } from "@/lib/types";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: Request, ctx: Ctx) {
  const session = await requireSession(request);
  if (session instanceof Response) return session;
  const { id } = await ctx.params;
  const conv = await sqlOne(
    `select id from conversations where id = $1 and org_id = $2`,
    [id, session.org.id],
  );
  if (!conv) return notFound();
  const messages = await sql<Message>(
    `select * from messages where conversation_id = $1 order by created_at asc`,
    [id],
  );
  return json({ messages });
}

const postSchema = z.object({
  body: z.string().min(1),
  direction: z.enum(["inbound", "outbound"]).default("outbound"),
});

export async function POST(request: Request, ctx: Ctx) {
  const session = await requireSession(request);
  if (session instanceof Response) return session;
  const { id } = await ctx.params;
  const body = postSchema.safeParse(await request.json());
  if (!body.success) return badRequest(body.error.message);

  const conv = await sqlOne(
    `select id from conversations where id = $1 and org_id = $2`,
    [id, session.org.id],
  );
  if (!conv) return notFound();

  const rows = await sql<Message>(
    `insert into messages (conversation_id, direction, body, sender_name, status)
     values ($1,$2,$3,$4,'delivered') returning *`,
    [
      id,
      body.data.direction,
      body.data.body,
      body.data.direction === "outbound" ? session.displayName : "Contacto",
    ],
  );
  await sql(
    `update conversations set last_message_at = now() where id = $1`,
    [id],
  );
  return json({ message: rows[0] }, 201);
}
