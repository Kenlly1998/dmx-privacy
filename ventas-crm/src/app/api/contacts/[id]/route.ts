import { z } from "zod";
import { sql, sqlOne } from "@/lib/db";
import { badRequest, json, notFound } from "@/lib/api";
import { logActivity, requireSession } from "@/lib/org";
import type { Contact } from "@/lib/types";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: Request, ctx: Ctx) {
  const session = await requireSession(request);
  if (session instanceof Response) return session;
  const { id } = await ctx.params;
  const contact = await sqlOne<Contact>(
    `select c.*, a.name as account_name from contacts c
     left join accounts a on a.id = c.account_id
     where c.id = $1 and c.org_id = $2`,
    [id, session.org.id],
  );
  if (!contact) return notFound();
  return json({ contact });
}

const patchSchema = z.object({
  full_name: z.string().min(1).optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  source: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  account_id: z.string().uuid().nullable().optional(),
});

export async function PATCH(request: Request, ctx: Ctx) {
  const session = await requireSession(request);
  if (session instanceof Response) return session;
  const { id } = await ctx.params;
  const body = patchSchema.safeParse(await request.json());
  if (!body.success) return badRequest(body.error.message);

  const current = await sqlOne<Contact>(
    `select * from contacts where id = $1 and org_id = $2`,
    [id, session.org.id],
  );
  if (!current) return notFound();

  const next = { ...current, ...body.data };
  const rows = await sql<Contact>(
    `update contacts set
       full_name = $3, email = $4, phone = $5, source = $6, notes = $7,
       tags = $8, account_id = $9, updated_at = now()
     where id = $1 and org_id = $2
     returning *`,
    [
      id,
      session.org.id,
      next.full_name,
      next.email,
      next.phone,
      next.source,
      next.notes,
      next.tags,
      next.account_id,
    ],
  );
  await logActivity(
    session.org.id,
    session.userSub,
    "contact",
    id,
    "update",
    `Contacto actualizado: ${rows[0].full_name}`,
  );
  return json({ contact: rows[0] });
}

export async function DELETE(request: Request, ctx: Ctx) {
  const session = await requireSession(request);
  if (session instanceof Response) return session;
  const { id } = await ctx.params;
  const deleted = await sql(
    `delete from contacts where id = $1 and org_id = $2 returning id`,
    [id, session.org.id],
  );
  if (!deleted.length) return notFound();
  return json({ ok: true });
}
