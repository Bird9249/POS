export type DiscountType = "percent" | "amount";

export type LineDiscount = {
  type: DiscountType;
  /** Percent 0–100, or kip amount ≥ 0 */
  value: number;
};

export type CartLineInput = {
  unitPrice: number;
  quantity: number;
  discount?: LineDiscount | null;
};

export type BillDiscount = LineDiscount | null;

/** Line discount in kip (never exceeds subtotal). */
export function lineDiscountKip(
  unitPrice: number,
  quantity: number,
  discount?: LineDiscount | null,
): number {
  const subtotal = Math.max(0, Math.trunc(unitPrice) * Math.max(0, Math.trunc(quantity)));
  if (!discount || !Number.isFinite(discount.value) || discount.value <= 0) {
    return 0;
  }
  const raw =
    discount.type === "percent"
      ? Math.floor((subtotal * clampPercent(discount.value)) / 100)
      : Math.trunc(discount.value);
  return Math.min(subtotal, Math.max(0, raw));
}

/** ยอดรายการ = ราคาขาย × จำนวน − ส่วนลดรายการ */
export function lineTotal(input: CartLineInput): number {
  const qty = Math.trunc(input.quantity);
  if (qty <= 0) return 0;
  const unit = Math.trunc(input.unitPrice);
  const subtotal = Math.max(0, unit * qty);
  return Math.max(0, subtotal - lineDiscountKip(unit, qty, input.discount));
}

export function billDiscountKip(
  linesSubtotal: number,
  discount?: BillDiscount,
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

export type CartTotals = {
  linesSubtotal: number;
  billDiscount: number;
  amountDue: number;
};

/** ยอดก่อนชำระ = ผลรวมยอดรายการ − ส่วนลดทั้งบิล */
export function computeCartTotals(
  lines: CartLineInput[],
  billDiscount?: BillDiscount,
): CartTotals {
  const linesSubtotal = lines.reduce((sum, line) => sum + lineTotal(line), 0);
  const bill = billDiscountKip(linesSubtotal, billDiscount ?? null);
  return {
    linesSubtotal,
    billDiscount: bill,
    amountDue: Math.max(0, linesSubtotal - bill),
  };
}

function clampPercent(v: number) {
  return Math.min(100, Math.max(0, v));
}

export function isValidLineDiscount(discount: LineDiscount): boolean {
  if (!Number.isFinite(discount.value) || discount.value < 0) return false;
  if (discount.type === "percent") {
    return discount.value <= 100;
  }
  return Number.isInteger(discount.value) || Number.isFinite(discount.value);
}
