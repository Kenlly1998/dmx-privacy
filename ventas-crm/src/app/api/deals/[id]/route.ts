import { z } from "zod";
import { sql, sqlOne } from "@/lib/db";
import { badRequest, json, notFound } from "@/lib/api";
import { logActivity, requireSession } from "@/lib/org";
import { DEAL_STAGES, STAGE_PROBABILITY, type Deal } from "@/lib/types";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: Request, ctx: Ctx) {
  const session = await requireSession(request);
  if (session instanceof Response) return session;
  const { id } = await ctx.params;
  const deal = await sqlOne<Deal>(
    `select d.*, c.full_name as contact_name, a.name as account_name
     from deals d
     left join contacts c on c.id = d.contact_id
     left join accounts a on a.id = d.account_id
     where d.id = $1 and d.org_id = $2`,
    [id, session.org.id],
  );
  if (!deal) return notFound();
  return json({ deal });
}

const patchSchema = z.object({
  title: z.string().min(1).optional(),
  stage: z.enum(DEAL_STAGES).optional(),
  amount: z.number().nonnegative().optional(),
  contact_id: z.string().uuid().nullable().optional(),
  account_id: z.string().uuid().nullable().optional(),
  source: z.string().optional(),
  notes: z.string().optional(),
  lost_reason: z.string().optional(),
  expected_close: z.string().nullable().optional(),
  event_date: z.string().nullable().optional(),
});

export async function PATCH(request: Request, ctx: Ctx) {
  const session = await requireSession(request);
  if (session instanceof Response) return session;
  const { id } = await ctx.params;
  const body = patchSchema.safeParse(await request.json());
  if (!body.success) return badRequest(body.error.message);

  const current = await sqlOne<Deal>(
    `select * from deals where id = $1 and org_id = $2`,
    [id, session.org.id],
  );
  if (!current) return notFound();

  const stage = body.data.stage ?? current.stage;
  const probability =
    body.data.stage != null ? STAGE_PROBABILITY[body.data.stage] : current.probability;

  const rows = await sql<Deal>(
    `update deals set
       title = $3, stage = $4, amount = $5, contact_id = $6, account_id = $7,
       source = $8, notes = $9, lost_reason = $10, expected_close = $11,
       event_date = $12, probability = $13, updated_at = now()
     where id = $1 and org_id = $2
     returning *`,
    [
      id,
      session.org.id,
      body.data.title ?? current.title,
      stage,
      body.data.amount ?? current.amount,
      body.data.contact_id !== undefined ? body.data.contact_id : current.contact_id,
      body.data.account_id !== undefined ? body.data.account_id : current.account_id,
      body.data.source ?? current.source,
      body.data.notes ?? current.notes,
      body.data.lost_reason ?? current.lost_reason,
      body.data.expected_close !== undefined
        ? body.data.expected_close
        : current.expected_close,
      body.data.event_date !== undefined ? body.data.event_date : current.event_date,
      probability,
    ],
  );

  if (body.data.stage === "won") {
    const existing = await sqlOne(
      `select id from projects where deal_id = $1 and org_id = $2`,
      [id, session.org.id],
    );
    if (!existing) {
      const project = await sqlOne<{ id: string }>(
        `insert into projects (org_id, deal_id, name, status, start_date, notes)
         values ($1, $2, $3, 'planned', current_date, 'Creado al ganar el deal')
         returning id`,
        [session.org.id, id, rows[0].title],
      );
      if (project) {
        for (const [i, title] of [
          "Kickoff con cliente",
          "Confirmar logística",
          "Entrega / show",
          "Cierre de cobranza",
        ].entries()) {
          await sql(
            `insert into project_tasks (project_id, title, sort_order) values ($1,$2,$3)`,
            [project.id, title, i],
          );
        }
      }
    }
  }

  await logActivity(
    session.org.id,
    session.userSub,
    "deal",
    id,
    body.data.stage ? "stage_change" : "update",
    body.data.stage
      ? `Deal ${rows[0].title} → ${body.data.stage}`
      : `Deal actualizado: ${rows[0].title}`,
  );
  return json({ deal: rows[0] });
}
