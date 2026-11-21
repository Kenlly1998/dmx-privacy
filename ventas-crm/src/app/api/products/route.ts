import { z } from "zod";
import { sql } from "@/lib/db";
import { badRequest, json } from "@/lib/api";
import { requireSession } from "@/lib/org";
import { marginPercent, markupPercent, toNumber, unitMargin } from "@/lib/money";
import type { Product } from "@/lib/types";

export async function GET(request: Request) {
  const session = await requireSession(request);
  if (session instanceof Response) return session;
  const products = await sql<Product>(
    `select p.*, a.name as supplier_name
     from products p
     left join accounts a on a.id = p.supplier_account_id
     where p.org_id = $1
     order by p.active desc, p.brand asc, p.name asc`,
    [session.org.id],
  );
  const enriched = products.map((p) => {
    const sale = toNumber(p.unit_price);
    const cost = toNumber(p.cost_price);
    return {
      ...p,
      unit_margin: unitMargin(sale, cost),
      margin_percent: marginPercent(sale, cost),
      markup_percent: markupPercent(sale, cost),
    };
  });
  return json({ products: enriched });
}

const createSchema = z.object({
  name: z.string().min(1),
  sku: z.string().optional().default(""),
  description: z.string().optional().default(""),
  unit_price: z.number().nonnegative(),
  cost_price: z.number().nonnegative().optional().default(0),
  brand: z.string().optional().default(""),
  supplier_account_id: z.string().uuid().nullable().optional(),
  tax_affect: z.enum(["gravado", "exonerado", "inafecto"]).optional().default("gravado"),
  unit: z.string().optional().default("unidad"),
  category: z.string().optional().default("general"),
});

export async function POST(request: Request) {
  const session = await requireSession(request);
  if (session instanceof Response) return session;
  const body = createSchema.safeParse(await request.json());
  if (!body.success) return badRequest(body.error.message);
  const rows = await sql<Product>(
    `insert into products (
       org_id, sku, name, description, unit_price, cost_price, brand,
       supplier_account_id, tax_affect, unit, category
     ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) returning *`,
    [
      session.org.id,
      body.data.sku,
      body.data.name,
      body.data.description,
      body.data.unit_price,
      body.data.cost_price,
      body.data.brand,
      body.data.supplier_account_id ?? null,
      body.data.tax_affect,
      body.data.unit,
      body.data.category,
    ],
  );
  return json({ product: rows[0] }, 201);
}
