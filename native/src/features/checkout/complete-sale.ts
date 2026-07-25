import { getLocalDb } from "@/lib/db/client";
import {
  decrementLocalStock,
  enqueueSale,
} from "@/lib/db/sales-outbox-repo";
import { pushSalesOutbox } from "@/lib/sync/push-sales";
import {
  buildSalePayload,
  newClientSaleId,
} from "./build-sale-payload";
import type { BillDiscount } from "./cart-math";
import type { CompletedPayment } from "./pay-sheet";
import type { CartLine } from "./use-cart";

export type CompleteSaleResult = {
  clientSaleId: string;
  pushed: boolean;
  pushError?: string;
};

/** Persist sale locally (outbox + stock), then try push if online. */
export async function completeSale(input: {
  lines: CartLine[];
  billDiscount: BillDiscount;
  payment: CompletedPayment;
  online: boolean;
}): Promise<CompleteSaleResult> {
  const clientSaleId = newClientSaleId();
  const { payload, items } = buildSalePayload({
    clientSaleId,
    lines: input.lines,
    billDiscount: input.billDiscount,
    payment: input.payment,
  });

  const db = await getLocalDb();
  await enqueueSale(db, { payload, items });
  await decrementLocalStock(
    db,
    input.lines.map((l) => ({
      productId: l.productId,
      quantity: l.quantity,
    })),
  );

  if (!input.online) {
    return { clientSaleId, pushed: false };
  }

  try {
    const result = await pushSalesOutbox(db);
    const pushed = result.synced > 0 && result.failed === 0;
    return {
      clientSaleId,
      pushed,
      pushError: result.failed > 0 ? "PUSH_PARTIAL_OR_FAILED" : undefined,
    };
  } catch (err) {
    return {
      clientSaleId,
      pushed: false,
      pushError: err instanceof Error ? err.message : "PUSH_FAILED",
    };
  }
}
