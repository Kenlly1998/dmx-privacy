import { sql, sqlOne } from "@/lib/db";
import { json, notFound } from "@/lib/api";
import { requireSession } from "@/lib/org";
import type { Account, Contact, Deal } from "@/lib/types";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: Request, ctx: Ctx) {
  const session = await requireSession(request);
  if (session instanceof Response) return session;
  const { id } = await ctx.params;
  const account = await sqlOne<Account>(
    `select * from accounts where id = $1 and org_id = $2`,
    [id, session.org.id],
  );
  if (!account) return notFound();
  const [contacts, deals] = await Promise.all([
    sql<Contact>(
      `select * from contacts where account_id = $1 and org_id = $2 order by full_name`,
      [id, session.org.id],
    ),
    sql<Deal>(
      `select d.*, c.full_name as contact_name from deals d
       left join contacts c on c.id = d.contact_id
       where d.account_id = $1 and d.org_id = $2 order by updated_at desc`,
      [id, session.org.id],
    ),
  ]);
  return json({ account, contacts, deals });
}
