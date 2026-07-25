/**
 * Locked Phase 7 policy: allow selling at zero/negative stock with a warning.
 * Server also accepts the sale so offline outbox always syncs.
 */
export const ZERO_STOCK_POLICY = "warn" as const;

export type ZeroStockPolicy = typeof ZERO_STOCK_POLICY;

/** True when adding this product should show the out-of-stock warning toast. */
export function shouldWarnOutOfStock(stockQty: number): boolean {
  return stockQty <= 0;
}

/** Whether the cart may accept an out-of-stock line. */
export function canSellOutOfStock(): boolean {
  return ZERO_STOCK_POLICY === "warn";
}
