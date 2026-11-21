import { beforeAll, describe, expect, it } from "vitest";
import { sql, sqlOne } from "./db";
import { ensureSeedData } from "./seed";

describe("database seed", () => {
  let orgId = "";

  beforeAll(async () => {
    const org = await sqlOne<{ id: string }>(
      `insert into organizations (name) values ('Test Org') returning id`,
    );
    orgId = org!.id;
    await ensureSeedData(orgId);
  }, 60000);

  it("creates catalog and sample deals", async () => {
    const products = await sqlOne<{ c: number }>(
      `select count(*)::int as c from products where org_id = $1`,
      [orgId],
    );
    const deals = await sqlOne<{ c: number }>(
      `select count(*)::int as c from deals where org_id = $1`,
      [orgId],
    );
    expect(products!.c).toBeGreaterThanOrEqual(8);
    expect(deals!.c).toBeGreaterThanOrEqual(3);
  });

  it("keeps quote totals consistent", async () => {
    const quote = await sqlOne<{ total: string; subtotal: string }>(
      `select total::text, subtotal::text from quotes where org_id = $1 limit 1`,
      [orgId],
    );
    expect(Number(quote!.total)).toBeGreaterThan(0);
    expect(Number(quote!.subtotal)).toBe(Number(quote!.total));
  });

  it("seeds leader extras (templates + tasks)", async () => {
    const templates = await sqlOne<{ c: number }>(
      `select count(*)::int as c from message_templates where org_id = $1`,
      [orgId],
    );
    const tasks = await sqlOne<{ c: number }>(
      `select count(*)::int as c from tasks where org_id = $1`,
      [orgId],
    );
    expect(templates!.c).toBeGreaterThanOrEqual(5);
    expect(tasks!.c).toBeGreaterThanOrEqual(3);
  });

  it("seeds suppliers, costs and calendar", async () => {
    const suppliers = await sqlOne<{ c: number }>(
      `select count(*)::int as c from accounts
       where org_id = $1 and account_type in ('supplier','both')`,
      [orgId],
    );
    const withCost = await sqlOne<{ c: number }>(
      `select count(*)::int as c from products
       where org_id = $1 and cost_price > 0`,
      [orgId],
    );
    const events = await sqlOne<{ c: number }>(
      `select count(*)::int as c from calendar_events where org_id = $1`,
      [orgId],
    );
    expect(suppliers!.c).toBeGreaterThanOrEqual(1);
    expect(withCost!.c).toBeGreaterThanOrEqual(5);
    expect(events!.c).toBeGreaterThanOrEqual(1);
  });
});
