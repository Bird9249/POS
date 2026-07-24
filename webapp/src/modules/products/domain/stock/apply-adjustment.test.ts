import { describe, expect, test } from "bun:test";
import { applyStockAdjustment, isLowStock } from "./apply-adjustment";

describe("applyStockAdjustment", () => {
  test("restock increases stock", () => {
    const r = applyStockAdjustment({
      stockQty: 10,
      type: "restock",
      quantity: 5,
    });
    expect(r).toEqual({ ok: true, stockBefore: 10, stockAfter: 15 });
  });

  test("increase increases stock", () => {
    const r = applyStockAdjustment({
      stockQty: 3,
      type: "increase",
      quantity: 2,
    });
    expect(r).toEqual({ ok: true, stockBefore: 3, stockAfter: 5 });
  });

  test("decrease reduces stock", () => {
    const r = applyStockAdjustment({
      stockQty: 10,
      type: "decrease",
      quantity: 4,
    });
    expect(r).toEqual({ ok: true, stockBefore: 10, stockAfter: 6 });
  });

  test("decrease beyond stock is rejected", () => {
    const r = applyStockAdjustment({
      stockQty: 3,
      type: "decrease",
      quantity: 5,
    });
    expect(r).toEqual({ ok: false, error: "INSUFFICIENT_STOCK" });
  });

  test("non-positive quantity is rejected", () => {
    expect(
      applyStockAdjustment({ stockQty: 5, type: "restock", quantity: 0 }),
    ).toEqual({ ok: false, error: "INVALID_QUANTITY" });
    expect(
      applyStockAdjustment({ stockQty: 5, type: "restock", quantity: -1 }),
    ).toEqual({ ok: false, error: "INVALID_QUANTITY" });
  });
});

describe("isLowStock", () => {
  test("flags when stock below min", () => {
    expect(isLowStock(3, 15)).toBe(true);
    expect(isLowStock(15, 15)).toBe(false);
    expect(isLowStock(16, 15)).toBe(false);
  });

  test("no flag when minStock unset", () => {
    expect(isLowStock(0, null)).toBe(false);
    expect(isLowStock(0, undefined)).toBe(false);
  });
});
