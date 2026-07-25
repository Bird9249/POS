/** Server-side cart math (mirrors native checkout). */

export type DiscountType = "percent" | "amount";

export type LineDiscount = {
  type: DiscountType;
  value: number;
};

function clampPercent(v: number) {
  return Math.min(100, Math.max(0, v));
}

export function lineDiscountKip(
  unitPrice: number,
  quantity: number,
  discount?: LineDiscount | null,
): number {
  const subtotal = Math.max(
    0,
    Math.trunc(unitPrice) * Math.max(0, Math.trunc(quantity)),
  );
  if (!discount || !Number.isFinite(discount.value) || discount.value <= 0) {
    return 0;
  }
  const raw =
    discount.type === "percent"
      ? Math.floor((subtotal * clampPercent(discount.value)) / 100)
      : Math.trunc(discount.value);
  return Math.min(subtotal, Math.max(0, raw));
}

export function lineTotal(input: {
  unitPrice: number;
  quantity: number;
  discount?: LineDiscount | null;
}): number {
  const qty = Math.trunc(input.quantity);
  if (qty <= 0) return 0;
  const unit = Math.trunc(input.unitPrice);
  const subtotal = Math.max(0, unit * qty);
  return Math.max(0, subtotal - lineDiscountKip(unit, qty, input.discount));
}

export function billDiscountKip(
  linesSubtotal: number,
  discount?: LineDiscount | null,
): number {
  const base = Math.max(0, Math.trunc(linesSubtotal));
  if (!discount || !Number.isFinite(discount.value) || discount.value <= 0) {
    return 0;
  }
  const raw =
    discount.type === "percent"
      ? Math.floor((base * clampPercent(discount.value)) / 100)
      : Math.trunc(discount.value);
  return Math.min(base, Math.max(0, raw));
}

export function computeCartTotals(
  lines: Array<{
    unitPrice: number;
    quantity: number;
    discount?: LineDiscount | null;
  }>,
  billDiscount?: LineDiscount | null,
) {
  const linesSubtotal = lines.reduce((sum, line) => sum + lineTotal(line), 0);
  const bill = billDiscountKip(linesSubtotal, billDiscount ?? null);
  return {
    linesSubtotal,
    billDiscount: bill,
    amountDue: Math.max(0, linesSubtotal - bill),
  };
}
