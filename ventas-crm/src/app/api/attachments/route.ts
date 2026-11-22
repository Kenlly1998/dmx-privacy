import { z } from "zod";
import { sql } from "@/lib/db";
import { badRequest, json } from "@/lib/api";
import { requireSession } from "@/lib/org";

export async function GET(request: Request) {
  const session = await requireSession(request);
  if (session instanceof Response) return session;
  const { searchParams } = new URL(request.url);
  const entityType = searchParams.get("entity_type");
  const entityId = searchParams.get("entity_id");
  if (!entityType || !entityId) return badRequest("entity_type y entity_id requeridos");

  const rows = await sql(
    `select * from attachments
     where org_id = $1 and entity_type = $2 and entity_id = $3
     order by created_at desc`,
    [session.org.id, entityType, entityId],
  );
  return json({ attachments: rows });
}

const createSchema = z.object({
  entity_type: z.enum(["deal", "contact", "project", "quote", "invoice"]),
  entity_id: z.string().uuid(),
  file_name: z.string().min(1),
  file_url: z.string().optional().default(""),
  content_type: z.string().optional().default("text/plain"),
  notes: z.string().optional().default(""),
});

export async function POST(request: Request) {
  const session = await requireSession(request);
  if (session instanceof Response) return session;
  const body = createSchema.safeParse(await request.json());
  if (!body.success) return badRequest(body.error.message);

  // Sin storage binario aún: guardamos referencia/URL o nota de archivo
  const rows = await sql(
    `insert into attachments (org_id, entity_type, entity_id, file_name, file_url, content_type, notes)
     values ($1,$2,$3,$4,$5,$6,$7) returning *`,
    [
      session.org.id,
      body.data.entity_type,
      body.data.entity_id,
      body.data.file_name,
      body.data.file_url || `note://${encodeURIComponent(body.data.file_name)}`,
      body.data.content_type,
      body.data.notes,
    ],
  );
  return json({ attachment: rows[0] }, 201);
}
