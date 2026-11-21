import { z } from "zod";
import { sql } from "@/lib/db";
import { badRequest, json } from "@/lib/api";
import { logActivity, requireSession } from "@/lib/org";
import { DEAL_STAGES, STAGE_PROBABILITY, type Deal } from "@/lib/types";

export async function GET(request: Request) {
  const session = await requireSession(request);
  if (session instanceof Response) return session;
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const source = searchParams.get("source")?.trim() ?? "";
  const stage = searchParams.get("stage")?.trim() ?? "";

  const deals = await sql<Deal>(
    `select d.*, c.full_name as contact_name, a.name as account_name
     from deals d
     left join contacts c on c.id = d.contact_id
     left join accounts a on a.id = d.account_id
     where d.org_id = $1
       and ($2 = '' or d.title ilike '%' || $2 || '%' or coalesce(c.full_name,'') ilike '%' || $2 || '%')
       and ($3 = '' or d.source = $3)
       and ($4 = '' or d.stage = $4)
     order by d.updated_at desc`,
    [session.org.id, q, source, stage],
  );
  return json({ deals, stages: DEAL_STAGES });
}

const createSchema = z.object({
  title: z.string().min(1),
  stage: z.enum(DEAL_STAGES).optional().default("lead"),
  amount: z.number().nonnegative().optional().default(0),
  contact_id: z.string().uuid().nullable().optional(),
  account_id: z.string().uuid().nullable().optional(),
  source: z.string().optional().default("manual"),
  notes: z.string().optional().default(""),
  expected_close: z.string().nullable().optional(),
  event_date: z.string().nullable().optional(),
});

export async function POST(request: Request) {
  const session = await requireSession(request);
  if (session instanceof Response) return session;
  const body = createSchema.safeParse(await request.json());
  if (!body.success) return badRequest(body.error.message);

  const stage = body.data.stage;
  const rows = await sql<Deal>(
    `insert into deals (
       org_id, contact_id, account_id, title, stage, amount, currency,
       probability, expected_close, event_date, source, owner_sub, notes
     ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
     returning *`,
    [
      session.org.id,
      body.data.contact_id ?? null,
      body.data.account_id ?? null,
      body.data.title,
      stage,
      body.data.amount,
      session.org.currency,
      STAGE_PROBABILITY[stage],
      body.data.expected_close ?? null,
      body.data.event_date ?? null,
      body.data.source,
      session.userSub,
      body.data.notes,
    ],
  );
  await logActivity(
    session.org.id,
    session.userSub,
    "deal",
    rows[0].id,
    "create",
    `Deal creado: ${rows[0].title}`,
  );
  return json({ deal: rows[0] }, 201);
}
