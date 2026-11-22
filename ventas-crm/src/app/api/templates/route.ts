import { z } from "zod";
import { sql } from "@/lib/db";
import { badRequest, json } from "@/lib/api";
import { requireSession } from "@/lib/org";

export async function GET(request: Request) {
  const session = await requireSession(request);
  if (session instanceof Response) return session;
  const channel = new URL(request.url).searchParams.get("channel");
  const templates = await sql<{
    id: string;
    name: string;
    channel: string;
    body: string;
    active: boolean;
  }>(
    `select id, name, channel, body, active from message_templates
     where org_id = $1 and active = true
       and ($2::text is null or channel = $2)
     order by name`,
    [session.org.id, channel],
  );
  return json({ templates });
}

const createSchema = z.object({
  name: z.string().min(1),
  channel: z.enum(["whatsapp", "instagram", "email", "web"]).default("whatsapp"),
  body: z.string().min(1),
});

export async function POST(request: Request) {
  const session = await requireSession(request);
  if (session instanceof Response) return session;
  const body = createSchema.safeParse(await request.json());
  if (!body.success) return badRequest(body.error.message);
  const rows = await sql(
    `insert into message_templates (org_id, name, channel, body)
     values ($1,$2,$3,$4) returning *`,
    [session.org.id, body.data.name, body.data.channel, body.data.body],
  );
  return json({ template: rows[0] }, 201);
}
