import { z } from "zod";
import { sql } from "@/lib/db";
import { badRequest, json } from "@/lib/api";
import { logActivity, requireSession } from "@/lib/org";
import type { Account } from "@/lib/types";

export async function GET(request: Request) {
  const session = await requireSession(request);
  if (session instanceof Response) return session;
  const accounts = await sql<
    Account & { contacts_count: number; deals_count: number }
  >(
    `select a.*,
       (select count(*)::int from contacts c where c.account_id = a.id) as contacts_count,
       (select count(*)::int from deals d where d.account_id = a.id) as deals_count
     from accounts a
     where a.org_id = $1
     order by a.updated_at desc`,
    [session.org.id],
  );
  return json({ accounts });
}

const createSchema = z.object({
  name: z.string().min(1),
  industry: z.string().optional().default(""),
  website: z.string().optional().default(""),
  notes: z.string().optional().default(""),
  account_type: z.enum(["customer", "supplier", "both"]).optional().default("customer"),
});

export async function POST(request: Request) {
  const session = await requireSession(request);
  if (session instanceof Response) return session;
  const body = createSchema.safeParse(await request.json());
  if (!body.success) return badRequest(body.error.message);
  const rows = await sql<Account>(
    `insert into accounts (org_id, name, industry, website, notes, account_type)
     values ($1,$2,$3,$4,$5,$6) returning *`,
    [
      session.org.id,
      body.data.name,
      body.data.industry,
      body.data.website,
      body.data.notes,
      body.data.account_type,
    ],
  );
  await logActivity(
    session.org.id,
    session.userSub,
    "account",
    rows[0].id,
    "create",
    `Empresa creada: ${rows[0].name}`,
  );
  return json({ account: rows[0] }, 201);
}
