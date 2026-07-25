import { listSales, type SaleDTO } from "@/lib/api/sales";
import { upsertSyncedSaleFromServer } from "@/lib/db/sales-outbox-repo";
import type { SqlDb } from "@/lib/db/types";
import type { SaleApiPayload } from "@/features/checkout/build-sale-payload";

function toLocalPayload(sale: SaleDTO): SaleApiPayload {
  const soldAt =
    typeof sale.soldAt === "string" ? sale.soldAt : new Date(sale.soldAt).toISOString();

  if (sale.paymentMethod === "transfer") {
    return {
      clientSaleId: sale.clientSaleId,
      soldAt,
      billDiscount: null,
      lines: (sale.items ?? []).map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        discount: null,
      })),
      payment: {
        method: "transfer",
        amountDue: sale.amountDue,
        confirmedByStaff: true,
        slipImageKey: sale.slipImageKey ?? "seed",
      },
    };
  }

  return {
    clientSaleId: sale.clientSaleId,
    soldAt,
    billDiscount: null,
    lines: (sale.items ?? []).map((i) => ({
      productId: i.productId,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      discount: null,
    })),
    payment: {
      method: "cash",
      amountDue: sale.amountDue,
      amountReceived: sale.amountReceived ?? sale.amountDue,
      changeAmount: sale.changeAmount ?? 0,
    },
  };
}

/** Pull recent sales from server into local history (synced rows). */
export async function pullSalesHistory(db: SqlDb, opts?: { limit?: number }) {
  const res = await listSales({ limit: opts?.limit ?? 50 });
  let upserted = 0;
  for (const sale of res.items) {
    const soldAt =
      typeof sale.soldAt === "string"
        ? sale.soldAt
        : new Date(sale.soldAt).toISOString();
    await upsertSyncedSaleFromServer(db, {
      clientSaleId: sale.clientSaleId,
      serverSaleId: sale.id,
      soldAt,
      amountDue: sale.amountDue,
      paymentMethod: sale.paymentMethod,
      payload: toLocalPayload(sale),
    });
    upserted += 1;
  }
  return { upserted, nextCursor: res.nextCursor };
}
