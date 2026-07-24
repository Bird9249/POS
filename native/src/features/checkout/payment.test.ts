import { describe, expect, test } from "bun:test";
import { computeCashChange, validateTransferPayment } from "./payment";

describe("cash change", () => {
  test("computes change", () => {
    expect(
      computeCashChange({ amountDue: 45_000, amountReceived: 50_000 }),
    ).toEqual({ ok: true, changeAmount: 5_000 });
  });

  test("exact amount → 0 change", () => {
    expect(
      computeCashChange({ amountDue: 10_000, amountReceived: 10_000 }),
    ).toEqual({ ok: true, changeAmount: 0 });
  });

  test("insufficient → invalid", () => {
    expect(
      computeCashChange({ amountDue: 45_000, amountReceived: 40_000 }),
    ).toEqual({ ok: false, reason: "INSUFFICIENT" });
  });
});

describe("transfer confirmation", () => {
  test("requires confirmed_by_staff and slip", () => {
    expect(validateTransferPayment({ confirmedByStaff: false })).toEqual({
      ok: false,
      reason: "NOT_CONFIRMED",
    });
    expect(
      validateTransferPayment({
        confirmedByStaff: true,
        slipImageKey: null,
      }),
    ).toEqual({
      ok: false,
      reason: "SLIP_REQUIRED",
    });
    expect(
      validateTransferPayment({
        confirmedByStaff: true,
        slipImageKey: "uploads/sales/slips/x.jpg",
      }),
    ).toEqual({ ok: true });
  });
});
