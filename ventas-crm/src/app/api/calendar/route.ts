import { z } from "zod";
import { sql } from "@/lib/db";
import { badRequest, json } from "@/lib/api";
import { logActivity, requireSession } from "@/lib/org";
import type { CalendarEvent } from "@/lib/types";

export async function GET(request: Request) {
  const session = await requireSession(request);
  if (session instanceof Response) return session;
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const events = await sql<CalendarEvent>(
    `select e.*, d.title as deal_title, c.full_name as contact_name
     from calendar_events e
     left join deals d on d.id = e.deal_id
     left join contacts c on c.id = e.contact_id
     where e.org_id = $1
       and ($2::timestamptz is null or e.starts_at >= $2::timestamptz)
       and ($3::timestamptz is null or e.starts_at <= $3::timestamptz)
     order by e.starts_at asc`,
    [session.org.id, from, to],
  );

  // Also surface deals with event_date as soft calendar items
  const dealEvents = await sql<{
    id: string;
    title: string;
    event_date: string;
    contact_name: string | null;
  }>(
    `select d.id, d.title, d.event_date::text, c.full_name as contact_name
     from deals d
     left join contacts c on c.id = d.contact_id
     where d.org_id = $1 and d.event_date is not null and d.stage not in ('lost')
     order by d.event_date`,
    [session.org.id],
  );

  return json({
    events,
    deal_dates: dealEvents.map((d) => ({
      id: `deal-${d.id}`,
      title: d.title,
      event_type: "deal_event",
      starts_at: d.event_date,
      deal_id: d.id,
      contact_name: d.contact_name,
    })),
  });
}

const createSchema = z.object({
  title: z.string().min(1),
  event_type: z
    .enum(["job", "training", "delivery", "meeting", "other"])
    .default("job"),
  starts_at: z.string().min(1),
  ends_at: z.string().nullable().optional(),
  location: z.string().optional().default(""),
  deal_id: z.string().uuid().nullable().optional(),
  project_id: z.string().uuid().nullable().optional(),
  contact_id: z.string().uuid().nullable().optional(),
  notes: z.string().optional().default(""),
});

export async function POST(request: Request) {
  const session = await requireSession(request);
  if (session instanceof Response) return session;
  const body = createSchema.safeParse(await request.json());
  if (!body.success) return badRequest(body.error.message);

  const rows = await sql<CalendarEvent>(
    `insert into calendar_events (
       org_id, title, event_type, starts_at, ends_at, location,
       deal_id, project_id, contact_id, notes
     ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning *`,
    [
      session.org.id,
      body.data.title,
      body.data.event_type,
      body.data.starts_at,
      body.data.ends_at ?? null,
      body.data.location,
      body.data.deal_id ?? null,
      body.data.project_id ?? null,
      body.data.contact_id ?? null,
      body.data.notes,
    ],
  );
  await logActivity(
    session.org.id,
    session.userSub,
    "calendar_event",
    rows[0].id,
    "create",
    `Agenda: ${rows[0].title}`,
  );
  return json({ event: rows[0] }, 201);
}
