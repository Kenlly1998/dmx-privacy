import { sql } from "@/lib/db";
import { json } from "@/lib/api";
import { requireSession } from "@/lib/org";
import { toNumber } from "@/lib/money";

export async function GET(request: Request) {
  const session = await requireSession(request);
  if (session instanceof Response) return session;
  const orgId = session.org.id;

  const [pipeline, payments, quotes, activity, openInbox, weekTasks, weekEvents, margin] =
    await Promise.all([
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
      sql<{ id: string; title: string; due_at: string | null; priority: string }>(
        `select id, title, due_at::text, priority from tasks
         where org_id = $1 and status = 'open'
           and (due_at is null or due_at::date <= current_date + 7)
         order by due_at nulls last limit 10`,
        [orgId],
      ),
      sql<{ id: string; title: string; event_type: string; starts_at: string }>(
        `select id, title, event_type, starts_at::text from calendar_events
         where org_id = $1
           and starts_at::date >= current_date
           and starts_at::date <= current_date + 14
         order by starts_at limit 10`,
        [orgId],
      ),
      sql<{ revenue: string; cost: string }>(
        `select
           coalesce(sum(qi.line_total),0)::text as revenue,
           coalesce(sum(qi.quantity * qi.cost_price),0)::text as cost
         from quote_items qi
         join quotes q on q.id = qi.quote_id
         where q.org_id = $1 and q.status in ('sent','accepted','draft')`,
        [orgId],
      ),
    ]);

  const won = pipeline.find((p) => p.stage === "won");
  const openDeals = pipeline.filter((p) => !["won", "lost"].includes(p.stage));
  const pipelineValue = openDeals.reduce((s, p) => s + toNumber(p.amount), 0);
  const revenue = toNumber(margin[0]?.revenue);
  const cost = toNumber(margin[0]?.cost);
  const profit = Math.round((revenue - cost) * 100) / 100;

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
      quoteRevenue: revenue,
      quoteCost: cost,
      quoteProfit: profit,
      quoteMarginPercent: revenue > 0 ? Math.round((profit / revenue) * 1000) / 10 : 0,
    },
    pipeline,
    activity,
    myWeek: {
      tasks: weekTasks,
      events: weekEvents,
    },
  });
}
