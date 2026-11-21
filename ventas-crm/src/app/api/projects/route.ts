import { z } from "zod";
import { sql } from "@/lib/db";
import { badRequest, json } from "@/lib/api";
import { requireSession } from "@/lib/org";
import type { Project } from "@/lib/types";

export async function GET(request: Request) {
  const session = await requireSession(request);
  if (session instanceof Response) return session;
  const projects = await sql<Project>(
    `select p.*, d.title as deal_title
     from projects p
     left join deals d on d.id = p.deal_id
     where p.org_id = $1
     order by p.created_at desc`,
    [session.org.id],
  );
  const tasks = await sql<{
    id: string;
    project_id: string;
    title: string;
    done: boolean;
    due_date: string | null;
    sort_order: number;
  }>(
    `select t.* from project_tasks t
     join projects p on p.id = t.project_id
     where p.org_id = $1
     order by t.sort_order`,
    [session.org.id],
  );
  return json({ projects, tasks });
}

const createSchema = z.object({
  name: z.string().min(1),
  deal_id: z.string().uuid().nullable().optional(),
  location: z.string().optional().default(""),
  notes: z.string().optional().default(""),
  start_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
});

export async function POST(request: Request) {
  const session = await requireSession(request);
  if (session instanceof Response) return session;
  const body = createSchema.safeParse(await request.json());
  if (!body.success) return badRequest(body.error.message);
  const rows = await sql<Project>(
    `insert into projects (org_id, deal_id, name, status, start_date, end_date, location, notes)
     values ($1,$2,$3,'planned',$4,$5,$6,$7) returning *`,
    [
      session.org.id,
      body.data.deal_id ?? null,
      body.data.name,
      body.data.start_date ?? null,
      body.data.end_date ?? null,
      body.data.location,
      body.data.notes,
    ],
  );
  return json({ project: rows[0] }, 201);
}
