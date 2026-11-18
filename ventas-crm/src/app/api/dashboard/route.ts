import { sql } from "@/lib/db";
import { json } from "@/lib/api";
import { requireSession } from "@/lib/org";
import { toNumber } from "@/lib/money";

export async function GET(request: Request) {
  const session = await requireSession(request);
  if (session instanceof Response) return session;
  const orgId = session.org.id;

  const [pipeline, payments, quotes, activity, openInbox] = await Promise.all([
    sql<{ stage: string; count: number; amount: string }>(
      `select stage, count(*)::int as count, coalesce(sum(amount),0)::text as amount
       from deals where org_id = $1 group by stage`,
      [orgId],
    ),
    sql<{ total: string; count: number }>(
      `select coalesce(sum(amount),0)::text as total, count(*)::int as count
       from payments where org_id = $1 and status = 'confirmed'`,
      [orgId],
    ),
    sql<{ open_quotes: number; draft_quotes: number }>(
      `select
         count(*) filter (where status in ('sent','viewed'))::int as open_quotes,
         count(*) filter (where status = 'draft')::int as draft_quotes
       from quotes where org_id = $1`,
      [orgId],
    ),
    sql<{ id: string; summary: string; created_at: string; action: string }>(
      `select id, summary, created_at::text, action from activity_log
       where org_id = $1 order by created_at desc limit 8`,
      [orgId],
    ),
    sql<{ c: number }>(
      `select count(*)::int as c from conversations where org_id = $1 and status = 'open'`,
      [orgId],
    ),
  ]);

  const won = pipeline.find((p) => p.stage === "won");
  const openDeals = pipeline.filter((p) => !["won", "lost"].includes(p.stage));
  const pipelineValue = openDeals.reduce((s, p) => s + toNumber(p.amount), 0);

  return json({
    currency: session.org.currency,
    orgName: session.org.name,
    viewer: session.displayName,
    kpis: {
      pipelineValue,
      openDeals: openDeals.reduce((s, p) => s + p.count, 0),
      paymentsTotal: toNumber(payments[0]?.total),
      paymentsCount: payments[0]?.count ?? 0,
      openQuotes: quotes[0]?.open_quotes ?? 0,
      draftQuotes: quotes[0]?.draft_quotes ?? 0,
      wonAmount: toNumber(won?.amount),
      openInbox: openInbox[0]?.c ?? 0,
    },
    pipeline,
    activity,
  });
}
