import { sql, sqlOne } from "@/lib/db";
import { json } from "@/lib/api";
import { requireSession } from "@/lib/org";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  if (searchParams.has("hub.mode")) {
    const mode = searchParams.get("hub.mode");
    const token = searchParams.get("hub.verify_token");
    const challenge = searchParams.get("hub.challenge");
    const expected = process.env.INSTAGRAM_VERIFY_TOKEN?.trim() ?? "";
    if (mode === "subscribe" && challenge && (!expected || token === expected)) {
      return new Response(challenge, { status: 200 });
    }
    return json({ error: "forbidden" }, 403);
  }

  const session = await requireSession(request);
  if (session instanceof Response) return session;
  const settings = await sqlOne<{ enabled: boolean; config: Record<string, unknown> }>(
    `select enabled, config from integration_settings where org_id = $1 and provider = 'instagram'`,
    [session.org.id],
  );
  return json({
    provider: "instagram",
    enabled: settings?.enabled ?? false,
    configured: Boolean(process.env.META_PAGE_TOKEN),
    webhookPath: "/api/integrations/instagram",
    config: settings?.config ?? {},
  });
}

export async function POST(request: Request) {
  const payload = (await request.json()) as {
    demo?: boolean;
    org_id?: string;
    from?: string;
    name?: string;
    body?: string;
    entry?: {
      messaging?: {
        sender?: { id?: string };
        message?: { text?: string; mid?: string };
      }[];
    }[];
  };

  if (payload.demo) {
    if (!payload.org_id) return json({ error: "org_id required" }, 400);
    await ingestInstagram({
      orgId: payload.org_id,
      igId: payload.from || "ig-unknown",
      name: payload.name || "Instagram lead",
      body: payload.body || "(sin texto)",
      externalId: `demo-ig-${Date.now()}`,
    });
    return json({ ok: true, demo: true });
  }

  const orgs = await sql<{ org_id: string }>(
    `select org_id from integration_settings where provider = 'instagram' and enabled = true`,
  );
  const orgId = orgs[0]?.org_id;
  if (!orgId) return json({ ok: true, ignored: true });

  for (const entry of payload.entry ?? []) {
    for (const msg of entry.messaging ?? []) {
      const text = msg.message?.text;
      if (!text) continue;
      await ingestInstagram({
        orgId,
        igId: msg.sender?.id || "ig-unknown",
        name: msg.sender?.id || "Instagram",
        body: text,
        externalId: msg.message?.mid || "",
      });
    }
  }

  return json({ ok: true });
}

async function ingestInstagram(input: {
  orgId: string;
  igId: string;
  name: string;
  body: string;
  externalId: string;
}) {
  let contact = await sqlOne<{ id: string }>(
    `select id from contacts where org_id = $1 and (phone = $2 or notes ilike '%' || $2 || '%') limit 1`,
    [input.orgId, input.igId],
  );
  if (!contact) {
    contact = await sqlOne<{ id: string }>(
      `insert into contacts (org_id, full_name, source, tags, notes)
       values ($1, $2, 'instagram', array['instagram'], $3)
       returning id`,
      [input.orgId, input.name, `IG id: ${input.igId}`],
    );
  }

  let deal = await sqlOne<{ id: string }>(
    `select id from deals where org_id = $1 and contact_id = $2 and stage not in ('won','lost')
     order by updated_at desc limit 1`,
    [input.orgId, contact?.id],
  );
  if (!deal) {
    deal = await sqlOne<{ id: string }>(
      `insert into deals (org_id, contact_id, title, stage, amount, source)
       values ($1, $2, $3, 'lead', 0, 'instagram') returning id`,
      [input.orgId, contact?.id, `Instagram — ${input.name}`],
    );
  }

  let conversation = await sqlOne<{ id: string }>(
    `select id from conversations
     where org_id = $1 and contact_id = $2 and channel = 'instagram' and status = 'open'
     order by last_message_at desc limit 1`,
    [input.orgId, contact?.id],
  );
  if (!conversation) {
    conversation = await sqlOne<{ id: string }>(
      `insert into conversations (org_id, contact_id, deal_id, channel, external_thread_id, status)
       values ($1,$2,$3,'instagram',$4,'open') returning id`,
      [input.orgId, contact?.id, deal?.id, input.igId],
    );
  }

  await sql(
    `insert into messages (conversation_id, direction, body, sender_name, external_id)
     values ($1,'inbound',$2,$3,$4)`,
    [conversation?.id, input.body, input.name, input.externalId],
  );
  await sql(`update conversations set last_message_at = now() where id = $1`, [
    conversation?.id,
  ]);
}
