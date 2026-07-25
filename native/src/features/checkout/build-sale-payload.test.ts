import { describe, expect, test } from "bun:test";
import { buildSalePayload, newClientSaleId } from "./build-sale-payload";

describe("buildSalePayload", () => {
  test("maps cart + cash payment to API payload", () => {
    const { payload, items } = buildSalePayload({
      clientSaleId: "sale_abc",
      soldAt: new Date("2026-07-25T00:00:00.000Z"),
      lines: [
        {
          productId: "p1",
          name: "Water",
          unitPrice: 5000,
          stockQty: 10,
          quantity: 2,
          discount: { type: "percent", value: 10 },
        },
      ],
      billDiscount: { type: "amount", value: 500 },
      payment: {
        method: "cash",
        amountDue: 8500,
        amountReceived: 10000,
        changeAmount: 1500,
      },
    });

    expect(payload.clientSaleId).toBe("sale_abc");
    expect(payload.lines).toHaveLength(1);
    expect(payload.lines[0]!.discount).toEqual({ type: "percent", value: 10 });
    expect(payload.billDiscount).toEqual({ type: "amount", value: 500 });
    expect(payload.payment).toEqual({
      method: "cash",
      amountDue: 8500,
      amountReceived: 10000,
      changeAmount: 1500,
    });
    expect(items[0]!.lineTotal).toBe(9000);
    expect(items[0]!.productName).toBe("Water");
  });

  test("maps transfer with slip key", () => {
    const { payload } = buildSalePayload({
      clientSaleId: "sale_t",
      lines: [
        {
          productId: "p1",
          name: "A",
          unitPrice: 3000,
          stockQty: 1,
          quantity: 1,
          discount: null,
        },
      ],
      billDiscount: null,
      payment: {
        method: "transfer",
        amountDue: 3000,
        confirmedByStaff: true,
        slipImageKey: "uploads/sales/slips/x.jpg",
      },
    });
    expect(payload.payment).toEqual({
      method: "transfer",
      amountDue: 3000,
      confirmedByStaff: true,
      slipImageKey: "uploads/sales/slips/x.jpg",
    });
  });

  test("newClientSaleId is non-empty", () => {
    expect(newClientSaleId().length).toBeGreaterThan(8);
  });
});
