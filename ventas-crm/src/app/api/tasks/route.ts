import { z } from "zod";
import { sql } from "@/lib/db";
import { badRequest, json } from "@/lib/api";
import { logActivity, requireSession } from "@/lib/org";

export type TaskRow = {
  id: string;
  title: string;
  due_at: string | null;
  status: string;
  priority: string;
  deal_id: string | null;
  contact_id: string | null;
  notes: string;
  created_at: string;
  completed_at: string | null;
  deal_title?: string | null;
  contact_name?: string | null;
};

export async function GET(request: Request) {
  const session = await requireSession(request);
  if (session instanceof Response) return session;
  const status = new URL(request.url).searchParams.get("status") ?? "open";

  const tasks = await sql<TaskRow>(
    `select t.*, d.title as deal_title, c.full_name as contact_name
     from tasks t
     left join deals d on d.id = t.deal_id
     left join contacts c on c.id = t.contact_id
     where t.org_id = $1
       and ($2 = 'all' or t.status = $2)
     order by
       case when t.status = 'open' then 0 else 1 end,
       t.due_at nulls last,
       t.created_at desc`,
    [session.org.id, status],
  );
  return json({ tasks });
}

const createSchema = z.object({
  title: z.string().min(1),
  due_at: z.string().nullable().optional(),
  priority: z.enum(["low", "normal", "high"]).optional().default("normal"),
  deal_id: z.string().uuid().nullable().optional(),
  contact_id: z.string().uuid().nullable().optional(),
  notes: z.string().optional().default(""),
});

export async function POST(request: Request) {
  const session = await requireSession(request);
  if (session instanceof Response) return session;
  const body = createSchema.safeParse(await request.json());
  if (!body.success) return badRequest(body.error.message);

  const rows = await sql<TaskRow>(
    `insert into tasks (org_id, title, due_at, priority, deal_id, contact_id, owner_sub, notes)
     values ($1,$2,$3,$4,$5,$6,$7,$8) returning *`,
    [
      session.org.id,
      body.data.title,
      body.data.due_at ?? null,
      body.data.priority,
      body.data.deal_id ?? null,
      body.data.contact_id ?? null,
      session.userSub,
      body.data.notes,
    ],
  );
  await logActivity(
    session.org.id,
    session.userSub,
    "task",
    rows[0].id,
    "create",
    `Tarea creada: ${rows[0].title}`,
  );
  return json({ task: rows[0] }, 201);
}
