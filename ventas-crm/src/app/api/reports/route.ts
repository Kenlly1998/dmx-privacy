import { sql } from "@/lib/db";
import { json } from "@/lib/api";
import { requireSession } from "@/lib/org";
import { toNumber } from "@/lib/money";
import { DEAL_STAGES, STAGE_LABELS } from "@/lib/types";

export async function GET(request: Request) {
  const session = await requireSession(request);
  if (session instanceof Response) return session;
  const orgId = session.org.id;

  const [byStage, bySource, payments, quotes, tasksDue] = await Promise.all([
    sql<{ stage: string; count: number; amount: string }>(
      `select stage, count(*)::int as count, coalesce(sum(amount),0)::text as amount
       from deals where org_id = $1 group by stage`,
      [orgId],
    ),
    sql<{ source: string; count: number; amount: string }>(
      `select source, count(*)::int as count, coalesce(sum(amount),0)::text as amount
       from deals where org_id = $1 group by source order by count desc`,
      [orgId],
    ),
    sql<{ total: string; count: number }>(
      `select coalesce(sum(amount),0)::text as total, count(*)::int as count
       from payments where org_id = $1 and status = 'confirmed'`,
      [orgId],
    ),
    sql<{ sent: number; accepted: number; rejected: number }>(
      `select
         count(*) filter (where status in ('sent','viewed'))::int as sent,
         count(*) filter (where status = 'accepted')::int as accepted,
         count(*) filter (where status = 'rejected')::int as rejected
       from quotes where org_id = $1`,
      [orgId],
    ),
    sql<{ overdue: number; upcoming: number }>(
      `select
         count(*) filter (where status = 'open' and due_at < now())::int as overdue,
         count(*) filter (where status = 'open' and due_at >= now())::int as upcoming
       from tasks where org_id = $1`,
      [orgId],
    ),
  ]);

  const won = byStage.find((s) => s.stage === "won");
  const lost = byStage.find((s) => s.stage === "lost");
  const closedCount = (won?.count ?? 0) + (lost?.count ?? 0);
  const winRate = closedCount > 0 ? ((won?.count ?? 0) / closedCount) * 100 : 0;

  const open = byStage.filter((s) => !["won", "lost"].includes(s.stage));
  const pipelineValue = open.reduce((sum, s) => sum + toNumber(s.amount), 0);
  const weighted = await sql<{ w: string }>(
    `select coalesce(sum(amount * probability / 100.0),0)::text as w
     from deals where org_id = $1 and stage not in ('won','lost')`,
    [orgId],
  );

  const funnel = DEAL_STAGES.map((stage) => {
    const row = byStage.find((s) => s.stage === stage);
    return {
      stage,
      label: STAGE_LABELS[stage],
      count: row?.count ?? 0,
      amount: toNumber(row?.amount),
    };
  });

  const quoteAccepted = quotes[0]?.accepted ?? 0;
  const quoteSent = (quotes[0]?.sent ?? 0) + quoteAccepted + (quotes[0]?.rejected ?? 0);
  const quoteWinRate = quoteSent > 0 ? (quoteAccepted / quoteSent) * 100 : 0;

  return json({
    currency: session.org.currency,
    kpis: {
      pipelineValue,
      weightedPipeline: toNumber(weighted[0]?.w),
      winRate: Math.round(winRate * 10) / 10,
      wonAmount: toNumber(won?.amount),
      lostCount: lost?.count ?? 0,
      paymentsTotal: toNumber(payments[0]?.total),
      quoteWinRate: Math.round(quoteWinRate * 10) / 10,
      tasksOverdue: tasksDue[0]?.overdue ?? 0,
      tasksUpcoming: tasksDue[0]?.upcoming ?? 0,
    },
    funnel,
    bySource: bySource.map((s) => ({
      source: s.source,
      count: s.count,
      amount: toNumber(s.amount),
    })),
  });
}
