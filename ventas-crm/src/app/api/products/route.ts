import { z } from "zod";
import { sql } from "@/lib/db";
import { badRequest, json } from "@/lib/api";
import { requireSession } from "@/lib/org";
import type { Product } from "@/lib/types";

export async function GET(request: Request) {
  const session = await requireSession(request);
  if (session instanceof Response) return session;
  const products = await sql<Product>(
    `select * from products where org_id = $1 order by active desc, name asc`,
    [session.org.id],
  );
  return json({ products });
}

const createSchema = z.object({
  name: z.string().min(1),
  sku: z.string().optional().default(""),
  description: z.string().optional().default(""),
  unit_price: z.number().nonnegative(),
  unit: z.string().optional().default("unidad"),
  category: z.string().optional().default("general"),
});

export async function POST(request: Request) {
  const session = await requireSession(request);
  if (session instanceof Response) return session;
  const body = createSchema.safeParse(await request.json());
  if (!body.success) return badRequest(body.error.message);
  const rows = await sql<Product>(
    `insert into products (org_id, sku, name, description, unit_price, unit, category)
     values ($1,$2,$3,$4,$5,$6,$7) returning *`,
    [
      session.org.id,
      body.data.sku,
      body.data.name,
      body.data.description,
      body.data.unit_price,
      body.data.unit,
      body.data.category,
    ],
  );
  return json({ product: rows[0] }, 201);
}
