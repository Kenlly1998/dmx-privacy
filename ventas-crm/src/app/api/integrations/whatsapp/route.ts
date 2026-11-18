import { createHmac, timingSafeEqual } from "node:crypto";
import { sql, sqlOne } from "@/lib/db";
import { json } from "@/lib/api";
import { requireSession } from "@/lib/org";

async function handleVerify(request: Request) {
  const { searchParams } = new URL(request.url);
  if (!searchParams.has("hub.mode")) return null;

  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");
  const expected = process.env.WHATSAPP_VERIFY_TOKEN?.trim() ?? "";

  if (mode === "subscribe" && challenge) {
    if (expected && token === expected) {
      return new Response(challenge, { status: 200 });
    }
    if (!expected) {
      return new Response(challenge, { status: 200 });
    }
  }
  return json({ error: "forbidden" }, 403);
}

export async function GET(request: Request) {
  const verified = await handleVerify(request);
  if (verified) return verified;

  const session = await requireSession(request);
  if (session instanceof Response) return session;

  const settings = await sqlOne<{ enabled: boolean; config: Record<string, unknown> }>(
    `select enabled, config from integration_settings where org_id = $1 and provider = 'whatsapp'`,
    [session.org.id],
  );

  return json({
    provider: "whatsapp",
    enabled: settings?.enabled ?? false,
    configured: Boolean(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_ID),
    verifyTokenSet: Boolean(process.env.WHATSAPP_VERIFY_TOKEN),
    webhookPath: "/api/integrations/whatsapp",
    config: settings?.config ?? {},
  });
}

type WaMessage = {
  from?: string;
  id?: string;
  text?: { body?: string };
};

export async function POST(request: Request) {
  const raw = await request.text();
  const appSecret = process.env.WHATSAPP_APP_SECRET?.trim() ?? "";
  if (appSecret) {
    const signature = request.headers.get("x-hub-signature-256") ?? "";
    const expected =
      "sha256=" + createHmac("sha256", appSecret).update(raw).digest("hex");
    try {
      const a = Buffer.from(signature);
      const b = Buffer.from(expected);
      if (a.length !== b.length || !timingSafeEqual(a, b)) {
        return json({ error: "invalid signature" }, 401);
      }
    } catch {
      return json({ error: "invalid signature" }, 401);
    }
  }

  let payload: {
    entry?: {
      changes?: {
        value?: {
          contacts?: { wa_id?: string; profile?: { name?: string } }[];
          messages?: WaMessage[];
        };
      }[];
    }[];
    demo?: boolean;
    org_id?: string;
    from?: string;
    name?: string;
    body?: string;
  };

  try {
    payload = JSON.parse(raw);
  } catch {
    return json({ error: "invalid json" }, 400);
  }

  if (payload.demo) {
    const orgId = payload.org_id;
    if (!orgId) return json({ error: "org_id required for demo" }, 400);
    await ingestInbound({
      orgId,
      phone: payload.from || "unknown",
      name: payload.name || "WhatsApp lead",
      body: payload.body || "(sin texto)",
      externalId: `demo-${Date.now()}`,
    });
    return json({ ok: true, demo: true });
  }

  const orgs = await sql<{ org_id: string }>(
    `select org_id from integration_settings where provider = 'whatsapp' and enabled = true`,
  );
  const orgId = orgs[0]?.org_id;
  if (!orgId) return json({ ok: true, ignored: true });

  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const value = change.value;
      const contact = value?.contacts?.[0];
      for (const message of value?.messages ?? []) {
        if (!message.text?.body) continue;
        await ingestInbound({
          orgId,
          phone: message.from || contact?.wa_id || "unknown",
          name: contact?.profile?.name || message.from || "WhatsApp",
          body: message.text.body,
          externalId: message.id || "",
        });
      }
    }
  }

  return json({ ok: true });
}

async function ingestInbound(input: {
  orgId: string;
  phone: string;
  name: string;
  body: string;
  externalId: string;
}) {
  let contact = await sqlOne<{ id: string }>(
    `select id from contacts where org_id = $1 and phone = $2 limit 1`,
    [input.orgId, input.phone],
  );
  if (!contact) {
    contact = await sqlOne<{ id: string }>(
      `insert into contacts (org_id, full_name, phone, source, tags, notes)
       values ($1, $2, $3, 'whatsapp', array['whatsapp'], 'Creado desde WhatsApp')
       returning id`,
      [input.orgId, input.name, input.phone],
    );
  }

  let deal = await sqlOne<{ id: string }>(
    `select id from deals where org_id = $1 and contact_id = $2 and stage not in ('won','lost')
     order by updated_at desc limit 1`,
    [input.orgId, contact?.id],
  );
  if (!deal) {
    deal = await sqlOne<{ id: string }>(
      `insert into deals (org_id, contact_id, title, stage, amount, source, notes)
       values ($1, $2, $3, 'lead', 0, 'whatsapp', 'Deal auto desde WhatsApp')
       returning id`,
      [input.orgId, contact?.id, `WhatsApp — ${input.name}`],
    );
  }

  let conversation = await sqlOne<{ id: string }>(
    `select id from conversations
     where org_id = $1 and contact_id = $2 and channel = 'whatsapp' and status = 'open'
     order by last_message_at desc limit 1`,
    [input.orgId, contact?.id],
  );
  if (!conversation) {
    conversation = await sqlOne<{ id: string }>(
      `insert into conversations (org_id, contact_id, deal_id, channel, external_thread_id, status)
       values ($1, $2, $3, 'whatsapp', $4, 'open') returning id`,
      [input.orgId, contact?.id, deal?.id, input.phone],
    );
  }

  await sql(
    `insert into messages (conversation_id, direction, body, sender_name, external_id, status)
     values ($1, 'inbound', $2, $3, $4, 'delivered')`,
    [conversation?.id, input.body, input.name, input.externalId],
  );
  await sql(
    `update conversations set last_message_at = now(), deal_id = coalesce(deal_id, $2) where id = $1`,
    [conversation?.id, deal?.id],
  );
}
