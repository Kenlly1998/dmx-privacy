import { z } from "zod";
import { sql } from "@/lib/db";
import { badRequest, json } from "@/lib/api";
import { logActivity, requireSession } from "@/lib/org";
import { createGrokProposal } from "@/lib/grok";
import type { AiAction } from "@/lib/types";

export async function GET(request: Request) {
  const session = await requireSession(request);
  if (session instanceof Response) return session;
  const actions = await sql<AiAction>(
    `select * from ai_actions where org_id = $1 order by created_at desc limit 30`,
    [session.org.id],
  );
  return json({
    actions,
    grokConfigured: Boolean(process.env.XAI_API_KEY?.trim()),
  });
}

const createSchema = z.object({
  action_type: z.enum(["followup", "quote_draft", "deal_summary", "reply"]),
  prompt: z.string().min(1),
  deal_id: z.string().uuid().nullable().optional(),
  contact_id: z.string().uuid().nullable().optional(),
  channel: z.string().optional(),
  inbound_message: z.string().optional(),
});

export async function POST(request: Request) {
  const session = await requireSession(request);
  if (session instanceof Response) return session;
  const body = createSchema.safeParse(await request.json());
  if (!body.success) return badRequest(body.error.message);

  const result = await createGrokProposal({
    orgId: session.org.id,
    actionType: body.data.action_type,
    prompt: body.data.prompt,
    dealId: body.data.deal_id,
    contactId: body.data.contact_id,
    channel: body.data.channel,
    inboundMessage: body.data.inbound_message,
  });

  const rows = await sql<AiAction>(
    `insert into ai_actions (org_id, deal_id, contact_id, action_type, prompt, proposal, status, model)
     values ($1,$2,$3,$4,$5,$6,'pending',$7) returning *`,
    [
      session.org.id,
      body.data.deal_id ?? null,
      body.data.contact_id ?? null,
      body.data.action_type,
      body.data.prompt,
      result.proposal,
      result.model,
    ],
  );

  await logActivity(
    session.org.id,
    session.userSub,
    "ai_action",
    rows[0].id,
    "propose",
    `Grok propuso ${body.data.action_type}${result.demo ? " (demo)" : ""}`,
  );

  return json({ action: rows[0], demo: result.demo }, 201);
}

const decideSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["approved", "rejected"]),
});

export async function PATCH(request: Request) {
  const session = await requireSession(request);
  if (session instanceof Response) return session;
  const body = decideSchema.safeParse(await request.json());
  if (!body.success) return badRequest(body.error.message);

  const rows = await sql<AiAction>(
    `update ai_actions set status = $3, decided_at = now()
     where id = $1 and org_id = $2 returning *`,
    [body.data.id, session.org.id, body.data.status],
  );
  if (!rows.length) return badRequest("Acción no encontrada");
  return json({ action: rows[0] });
}
