import { describe, expect, test } from "bun:test";
import {
  ZERO_STOCK_POLICY,
  canSellOutOfStock,
  shouldWarnOutOfStock,
} from "./stock-policy";

describe("zero-stock policy (Phase 7 locked)", () => {
  test("policy is warn (allow sale + toast)", () => {
    expect(ZERO_STOCK_POLICY).toBe("warn");
    expect(canSellOutOfStock()).toBe(true);
  });

  test("warns at zero and negative, not positive", () => {
    expect(shouldWarnOutOfStock(0)).toBe(true);
    expect(shouldWarnOutOfStock(-1)).toBe(true);
    expect(shouldWarnOutOfStock(1)).toBe(false);
  });
});
