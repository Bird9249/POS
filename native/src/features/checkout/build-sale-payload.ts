import { lineTotal, type BillDiscount, type LineDiscount } from "./cart-math";
import type { CartLine } from "./use-cart";
import type { CompletedPayment } from "./pay-sheet";

export type SaleApiPayload = {
  clientSaleId: string;
  soldAt: string;
  billDiscount: BillDiscount;
  lines: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
    discount: LineDiscount | null;
  }>;
  payment:
    | {
        method: "cash";
        amountDue: number;
        amountReceived: number;
        changeAmount: number;
      }
    | {
        method: "transfer";
        amountDue: number;
        confirmedByStaff: true;
        slipImageKey: string;
      };
};

export type OutboxItemRow = {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discountType: string | null;
  discountValue: number | null;
  lineTotal: number;
};

export function buildSalePayload(input: {
  clientSaleId: string;
  soldAt?: Date;
  lines: CartLine[];
  billDiscount: BillDiscount;
  payment: CompletedPayment;
}): { payload: SaleApiPayload; items: OutboxItemRow[] } {
  const soldAt = (input.soldAt ?? new Date()).toISOString();
  const lines = input.lines.map((l) => ({
    productId: l.productId,
    quantity: l.quantity,
    unitPrice: l.unitPrice,
    discount: l.discount,
  }));

  const items: OutboxItemRow[] = input.lines.map((l) => ({
    id: `${input.clientSaleId}_${l.productId}`,
    productId: l.productId,
    productName: l.name,
    quantity: l.quantity,
    unitPrice: l.unitPrice,
    discountType: l.discount?.type ?? null,
    discountValue: l.discount != null ? Math.trunc(l.discount.value) : null,
    lineTotal: lineTotal({
      unitPrice: l.unitPrice,
      quantity: l.quantity,
      discount: l.discount,
    }),
  }));

  const payment =
    input.payment.method === "cash"
      ? {
          method: "cash" as const,
          amountDue: input.payment.amountDue,
          amountReceived: input.payment.amountReceived,
          changeAmount: input.payment.changeAmount,
        }
      : {
          method: "transfer" as const,
          amountDue: input.payment.amountDue,
          confirmedByStaff: true as const,
          slipImageKey: input.payment.slipImageKey,
        };

  return {
    payload: {
      clientSaleId: input.clientSaleId,
      soldAt,
      billDiscount: input.billDiscount,
      lines,
      payment,
    },
    items,
  };
}

export function newClientSaleId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `sale_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}
