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
