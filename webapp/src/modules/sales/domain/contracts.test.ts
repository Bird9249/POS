import { describe, expect, test } from "bun:test";
import { CreateSaleSchema } from "./contracts";

describe("CreateSaleSchema", () => {
  test("accepts cash sale payload", () => {
    const result = CreateSaleSchema.safeParse({
      clientSaleId: "sale_local_001",
      lines: [
        {
          productId: "prod_water_500",
          quantity: 2,
          unitPrice: 5000,
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
    expect(result.success).toBe(true);
  });

  test("accepts transfer with slip + confirmed_by_staff", () => {
    const result = CreateSaleSchema.safeParse({
      clientSaleId: "sale_local_002",
      lines: [{ productId: "p1", quantity: 1, unitPrice: 3000 }],
      payment: {
        method: "transfer",
        amountDue: 3000,
        confirmedByStaff: true,
        slipImageKey: "uploads/sales/slips/demo.jpg",
      },
    });
    expect(result.success).toBe(true);
  });

  test("rejects transfer without confirmation", () => {
    const result = CreateSaleSchema.safeParse({
      clientSaleId: "sale_local_003",
      lines: [{ productId: "p1", quantity: 1, unitPrice: 3000 }],
      payment: {
        method: "transfer",
        amountDue: 3000,
        confirmedByStaff: false,
        slipImageKey: "uploads/sales/slips/demo.jpg",
      },
    });
    expect(result.success).toBe(false);
  });

  test("rejects transfer without slip image", () => {
    const result = CreateSaleSchema.safeParse({
      clientSaleId: "sale_local_004",
      lines: [{ productId: "p1", quantity: 1, unitPrice: 3000 }],
      payment: {
        method: "transfer",
        amountDue: 3000,
        confirmedByStaff: true,
      },
    });
    expect(result.success).toBe(false);
  });

  test("rejects empty lines", () => {
    const result = CreateSaleSchema.safeParse({
      clientSaleId: "x",
      lines: [],
      payment: {
        method: "cash",
        amountDue: 0,
        amountReceived: 0,
        changeAmount: 0,
      },
    });
    expect(result.success).toBe(false);
  });
});
