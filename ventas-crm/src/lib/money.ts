export function toNumber(value: number | string | null | undefined): number {
  if (value == null || value === "") return 0;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function money(
  value: number | string | null | undefined,
  currency = "USD",
): string {
  const amount = toNumber(value);
  try {
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export function lineTotal(quantity: number, unitPrice: number): number {
  return Math.round(quantity * unitPrice * 100) / 100;
}

export function quoteTotals(
  items: { quantity: number; unit_price: number }[],
  taxRate: number,
) {
  const subtotal =
    Math.round(
      items.reduce((sum, item) => sum + lineTotal(item.quantity, item.unit_price), 0) *
        100,
    ) / 100;
  const tax_amount = Math.round(subtotal * (taxRate / 100) * 100) / 100;
  const total = Math.round((subtotal + tax_amount) * 100) / 100;
  return { subtotal, tax_amount, total };
}

/** Margen unitario: venta - costo */
export function unitMargin(salePrice: number, costPrice: number): number {
  return Math.round((toNumber(salePrice) - toNumber(costPrice)) * 100) / 100;
}

/** % margen sobre venta: (venta - costo) / venta * 100 */
export function marginPercent(salePrice: number, costPrice: number): number {
  const sale = toNumber(salePrice);
  if (sale <= 0) return 0;
  return Math.round(((sale - toNumber(costPrice)) / sale) * 1000) / 10;
}

/** % markup sobre costo: (venta - costo) / costo * 100 */
export function markupPercent(salePrice: number, costPrice: number): number {
  const cost = toNumber(costPrice);
  if (cost <= 0) return 0;
  return Math.round(((toNumber(salePrice) - cost) / cost) * 1000) / 10;
}

export function quoteMargin(
  items: { quantity: number; unit_price: number; cost_price?: number }[],
) {
  const revenue = items.reduce(
    (s, i) => s + lineTotal(i.quantity, i.unit_price),
    0,
  );
  const cost = items.reduce(
    (s, i) => s + lineTotal(i.quantity, toNumber(i.cost_price)),
    0,
  );
  const profit = Math.round((revenue - cost) * 100) / 100;
  return {
    revenue: Math.round(revenue * 100) / 100,
    cost: Math.round(cost * 100) / 100,
    profit,
    margin_percent: revenue > 0 ? Math.round((profit / revenue) * 1000) / 10 : 0,
  };
}
