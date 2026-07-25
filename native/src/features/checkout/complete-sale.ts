import { getLocalDb } from "@/lib/db/client";
import {
  decrementLocalStock,
  enqueueSale,
} from "@/lib/db/sales-outbox-repo";
import { getCachedOpenShift } from "@/lib/db/shift-repo";
import { syncSalesThenCatalog } from "@/lib/sync/push-sales";
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

/** Persist sale locally (outbox + stock), then push→pull if online. */
export async function completeSale(input: {
  lines: CartLine[];
  billDiscount: BillDiscount;
  payment: CompletedPayment;
  online: boolean;
}): Promise<CompleteSaleResult> {
  const db = await getLocalDb();
  const openShift = await getCachedOpenShift(db);
  if (!openShift?.id) {
    throw new Error("SHIFT_REQUIRED");
  }

  const clientSaleId = newClientSaleId();
  const { payload, items } = buildSalePayload({
    clientSaleId,
    lines: input.lines,
    billDiscount: input.billDiscount,
    payment: input.payment,
  });

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
    const result = await syncSalesThenCatalog(db);
    const pushed = result.push.synced > 0 && result.push.failed === 0;
    return {
      clientSaleId,
      pushed,
      pushError:
        result.push.failed > 0 ? "PUSH_PARTIAL_OR_FAILED" : undefined,
    };
  } catch (err) {
    return {
      clientSaleId,
      pushed: false,
      pushError: err instanceof Error ? err.message : "PUSH_FAILED",
    };
  }
}
