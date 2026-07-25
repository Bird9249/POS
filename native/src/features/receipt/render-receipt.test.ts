import { describe, expect, test } from "bun:test";
import { receiptWidthChars, renderReceipt } from "./render-receipt";

const store = {
  storeName: "Demo Shop",
  address: "Vientiane",
  phone: "02055551234",
  bankName: "BCEL",
  bankAccount: "123-456",
  receiptWidthMm: 80 as const,
  footerThanks: "Thank you",
};

const sale = {
  clientSaleId: "sale_abc123456789",
  soldAt: "2026-07-25T08:00:00.000Z",
  cashierName: "Cashier",
  lines: [
    {
      name: "Water 500ml",
      quantity: 2,
      unitPrice: 5000,
      lineTotal: 10_000,
    },
    {
      name: "Chips",
      quantity: 1,
      unitPrice: 7000,
      lineTotal: 7000,
    },
  ],
  linesSubtotal: 17_000,
  billDiscountKip: 0,
  payment: {
    method: "cash" as const,
    amountDue: 17_000,
    amountReceived: 20_000,
    changeAmount: 3000,
  },
};

describe("renderReceipt", () => {
  test("includes required fields", () => {
    const r = renderReceipt({ store, sale });
    const text = r.text;
    expect(text).toContain("Demo Shop");
    expect(text).toContain("02055551234");
    expect(text).toContain("Water 500ml");
    expect(text).toContain("TOTAL");
    expect(text).toContain("Cash");
    expect(text).toContain("Change");
    expect(text).toContain("Thank you");
    expect(text).toContain("Cashier");
    expect(text).toContain("sale_abc");
  });

  test("58mm and 80mm use different line widths", () => {
    const w58 = renderReceipt({ store, sale, widthMm: 58 });
    const w80 = renderReceipt({ store, sale, widthMm: 80 });
    expect(w58.widthChars).toBe(receiptWidthChars(58));
    expect(w80.widthChars).toBe(receiptWidthChars(80));
    expect(w58.widthChars).toBeLessThan(w80.widthChars);
    for (const line of w58.lines) {
      expect([...line].length).toBeLessThanOrEqual(w58.widthChars);
    }
    for (const line of w80.lines) {
      expect([...line].length).toBeLessThanOrEqual(w80.widthChars);
    }
  });

  test("transfer receipt shows bank info", () => {
    const r = renderReceipt({
      store,
      sale: {
        ...sale,
        payment: { method: "transfer", amountDue: 17_000 },
      },
    });
    expect(r.text).toContain("Transfer");
    expect(r.text).toContain("BCEL");
    expect(r.text).toContain("123-456");
  });
});
