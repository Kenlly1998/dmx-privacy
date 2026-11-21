import { describe, expect, it } from "vitest";
import {
  lineTotal,
  marginPercent,
  markupPercent,
  quoteMargin,
  quoteTotals,
  toNumber,
  unitMargin,
} from "./money";

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

  it("computes unit margin, margin % and markup %", () => {
    expect(unitMargin(1890, 1350)).toBe(540);
    expect(marginPercent(1890, 1350)).toBe(28.6);
    expect(markupPercent(1890, 1350)).toBe(40);
    expect(marginPercent(0, 10)).toBe(0);
    expect(markupPercent(100, 0)).toBe(0);
  });

  it("aggregates quote margin across lines", () => {
    const m = quoteMargin([
      { quantity: 1, unit_price: 100, cost_price: 60 },
      { quantity: 2, unit_price: 50, cost_price: 20 },
    ]);
    expect(m.revenue).toBe(200);
    expect(m.cost).toBe(100);
    expect(m.profit).toBe(100);
    expect(m.margin_percent).toBe(50);
  });
});
