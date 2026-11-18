import { describe, expect, it } from "vitest";
import { lineTotal, quoteTotals, toNumber } from "./money";

describe("money helpers", () => {
  it("parses numbers", () => {
    expect(toNumber("12.5")).toBe(12.5);
    expect(toNumber(null)).toBe(0);
  });

  it("computes line and quote totals", () => {
    expect(lineTotal(2, 10)).toBe(20);
    const totals = quoteTotals(
      [
        { quantity: 1, unit_price: 100 },
        { quantity: 2, unit_price: 50 },
      ],
      18,
    );
    expect(totals.subtotal).toBe(200);
    expect(totals.tax_amount).toBe(36);
    expect(totals.total).toBe(236);
  });
});
