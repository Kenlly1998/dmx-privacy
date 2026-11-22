import { z } from "zod";
import { sql } from "@/lib/db";
import { badRequest, json } from "@/lib/api";
import { logActivity, requireSession } from "@/lib/org";
import type { Contact } from "@/lib/types";

export async function GET(request: Request) {
  const session = await requireSession(request);
  if (session instanceof Response) return session;
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";

  const rows = await sql<Contact>(
    `select c.*, a.name as account_name
     from contacts c
     left join accounts a on a.id = c.account_id
     where c.org_id = $1
       and ($2 = '' or c.full_name ilike '%' || $2 || '%' or c.email ilike '%' || $2 || '%' or c.phone ilike '%' || $2 || '%')
     order by c.updated_at desc`,
    [session.org.id, q],
  );
  return json({ contacts: rows });
}

const createSchema = z.object({
  full_name: z.string().min(1),
  email: z.string().optional().default(""),
  phone: z.string().optional().default(""),
  source: z.string().optional().default("manual"),
  notes: z.string().optional().default(""),
  tags: z.array(z.string()).optional().default([]),
  account_id: z.string().uuid().nullable().optional(),
});

export async function POST(request: Request) {
  const session = await requireSession(request);
  if (session instanceof Response) return session;
  const body = createSchema.safeParse(await request.json());
  if (!body.success) return badRequest(body.error.message);

  const rows = await sql<Contact>(
    `insert into contacts (org_id, account_id, full_name, email, phone, source, tags, notes)
     values ($1, $2, $3, $4, $5, $6, $7, $8)
     returning *`,
    [
      session.org.id,
      body.data.account_id ?? null,
      body.data.full_name,
      body.data.email,
      body.data.phone,
      body.data.source,
      body.data.tags,
      body.data.notes,
    ],
  );
  const contact = rows[0];
  await logActivity(
    session.org.id,
    session.userSub,
    "contact",
    contact.id,
    "create",
    `Contacto creado: ${contact.full_name}`,
  );
  return json({ contact }, 201);
}
