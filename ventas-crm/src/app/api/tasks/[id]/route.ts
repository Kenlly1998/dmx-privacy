import { z } from "zod";
import { sql, sqlOne } from "@/lib/db";
import { badRequest, json, notFound } from "@/lib/api";
import { logActivity, requireSession } from "@/lib/org";
import type { TaskRow } from "../route";

type Ctx = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  title: z.string().min(1).optional(),
  status: z.enum(["open", "done", "canceled"]).optional(),
  priority: z.enum(["low", "normal", "high"]).optional(),
  due_at: z.string().nullable().optional(),
  notes: z.string().optional(),
});

export async function PATCH(request: Request, ctx: Ctx) {
  const session = await requireSession(request);
  if (session instanceof Response) return session;
  const { id } = await ctx.params;
  const body = patchSchema.safeParse(await request.json());
  if (!body.success) return badRequest(body.error.message);

  const current = await sqlOne<TaskRow>(
    `select * from tasks where id = $1 and org_id = $2`,
    [id, session.org.id],
  );
  if (!current) return notFound();

  const status = body.data.status ?? current.status;
  const rows = await sql<TaskRow>(
    `update tasks set
       title = $3,
       status = $4,
       priority = $5,
       due_at = $6,
       notes = $7,
       completed_at = case when $4 = 'done' then coalesce(completed_at, now()) else null end
     where id = $1 and org_id = $2
     returning *`,
    [
      id,
      session.org.id,
      body.data.title ?? current.title,
      status,
      body.data.priority ?? current.priority,
      body.data.due_at !== undefined ? body.data.due_at : current.due_at,
      body.data.notes ?? current.notes,
    ],
  );

  if (body.data.status === "done") {
    await logActivity(
      session.org.id,
      session.userSub,
      "task",
      id,
      "complete",
      `Tarea completada: ${rows[0].title}`,
    );
  }
  return json({ task: rows[0] });
}
