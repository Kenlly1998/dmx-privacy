import { z } from "zod";
import { sql } from "@/lib/db";
import { badRequest, json } from "@/lib/api";
import { requireSession } from "@/lib/org";

export async function GET(request: Request) {
  const session = await requireSession(request);
  if (session instanceof Response) return session;
  const rows = await sql<{
    provider: string;
    enabled: boolean;
    config: Record<string, unknown>;
  }>(
    `select provider, enabled, config from integration_settings where org_id = $1 order by provider`,
    [session.org.id],
  );
  return json({
    integrations: rows,
    secrets: {
      XAI_API_KEY: Boolean(process.env.XAI_API_KEY?.trim()),
      WHATSAPP_TOKEN: Boolean(process.env.WHATSAPP_TOKEN?.trim()),
      WHATSAPP_PHONE_ID: Boolean(process.env.WHATSAPP_PHONE_ID?.trim()),
      META_PAGE_TOKEN: Boolean(process.env.META_PAGE_TOKEN?.trim()),
    },
  });
}

const patchSchema = z.object({
  provider: z.enum(["whatsapp", "instagram", "grok"]),
  enabled: z.boolean(),
});

export async function PATCH(request: Request) {
  const session = await requireSession(request);
  if (session instanceof Response) return session;
  const body = patchSchema.safeParse(await request.json());
  if (!body.success) return badRequest(body.error.message);

  const rows = await sql(
    `insert into integration_settings (org_id, provider, enabled, config)
     values ($1, $2, $3, '{}'::jsonb)
     on conflict (org_id, provider)
     do update set enabled = excluded.enabled, updated_at = now()
     returning provider, enabled`,
    [session.org.id, body.data.provider, body.data.enabled],
  );
  return json({ integration: rows[0] });
}
