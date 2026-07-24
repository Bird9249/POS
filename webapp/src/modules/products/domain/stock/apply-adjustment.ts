export type StockAdjustType = "restock" | "increase" | "decrease";

export type ApplyAdjustmentInput = {
  stockQty: number;
  type: StockAdjustType;
  quantity: number;
};

export type ApplyAdjustmentResult =
  | { ok: true; stockBefore: number; stockAfter: number }
  | { ok: false; error: "INVALID_QUANTITY" | "INSUFFICIENT_STOCK" };

/** Pure stock math — no DB. Decrease must not go negative. */
export function applyStockAdjustment(
  input: ApplyAdjustmentInput,
): ApplyAdjustmentResult {
  const quantity = input.quantity;
  if (!Number.isInteger(quantity) || quantity <= 0) {
    return { ok: false, error: "INVALID_QUANTITY" };
  }

  const stockBefore = input.stockQty;
  if (!Number.isInteger(stockBefore) || stockBefore < 0) {
    return { ok: false, error: "INVALID_QUANTITY" };
  }

  if (input.type === "decrease") {
    if (quantity > stockBefore) {
      return { ok: false, error: "INSUFFICIENT_STOCK" };
    }
    return { ok: true, stockBefore, stockAfter: stockBefore - quantity };
  }

  // restock + increase both add
  return { ok: true, stockBefore, stockAfter: stockBefore + quantity };
}

export function isLowStock(stockQty: number, minStock: number | null | undefined) {
  return minStock != null && stockQty < minStock;
}
