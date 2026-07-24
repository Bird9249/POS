import { describe, expect, test } from "bun:test";
import {
  billDiscountKip,
  computeCartTotals,
  lineDiscountKip,
  lineTotal,
} from "./cart-math";

describe("cart math", () => {
  test("line total without discount", () => {
    expect(lineTotal({ unitPrice: 5000, quantity: 3 })).toBe(15_000);
  });

  test("line discount percent", () => {
    expect(
      lineDiscountKip(10_000, 2, { type: "percent", value: 10 }),
    ).toBe(2_000);
    expect(
      lineTotal({
        unitPrice: 10_000,
        quantity: 2,
        discount: { type: "percent", value: 10 },
      }),
    ).toBe(18_000);
  });

  test("line discount amount (kip)", () => {
    expect(
      lineTotal({
        unitPrice: 8000,
        quantity: 1,
        discount: { type: "amount", value: 1000 },
      }),
    ).toBe(7000);
  });

  test("discount cannot make line negative", () => {
    expect(
      lineTotal({
        unitPrice: 5000,
        quantity: 1,
        discount: { type: "amount", value: 999_999 },
      }),
    ).toBe(0);
  });

  test("percent clamped 0–100", () => {
    expect(
      lineDiscountKip(1000, 1, { type: "percent", value: 150 }),
    ).toBe(1000);
  });

  test("bill discount and amount due", () => {
    const totals = computeCartTotals(
      [
        { unitPrice: 5000, quantity: 2 },
        {
          unitPrice: 8000,
          quantity: 1,
          discount: { type: "amount", value: 1000 },
        },
      ],
      { type: "percent", value: 10 },
    );
    // lines: 10000 + 7000 = 17000; bill 10% = 1700; due = 15300
    expect(totals.linesSubtotal).toBe(17_000);
    expect(totals.billDiscount).toBe(1_700);
    expect(totals.amountDue).toBe(15_300);
  });

  test("bill discount amount does not go negative", () => {
    expect(billDiscountKip(5_000, { type: "amount", value: 9_000 })).toBe(5_000);
    expect(
      computeCartTotals([{ unitPrice: 1000, quantity: 1 }], {
        type: "amount",
        value: 5000,
      }).amountDue,
    ).toBe(0);
  });

  test("quantity <= 0 yields 0", () => {
    expect(lineTotal({ unitPrice: 5000, quantity: 0 })).toBe(0);
  });
});
