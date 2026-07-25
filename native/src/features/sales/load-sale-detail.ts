import { getSale } from "@/lib/api/sales";
import {
  listItemsForSale,
  parseOutboxPayload,
  replaceSaleItems,
  type SaleItemOutboxRow,
  type SalesOutboxRow,
} from "@/lib/db/sales-outbox-repo";
import type { SqlDb } from "@/lib/db/types";
import type { OutboxItemRow, SaleApiPayload } from "@/features/checkout/build-sale-payload";

export type SaleDetail = {
  sale: SalesOutboxRow;
  payload: SaleApiPayload;
  items: SaleItemOutboxRow[];
};

function itemsFromServer(
  saleItems: NonNullable<Awaited<ReturnType<typeof getSale>>["sale"]["items"]>,
): OutboxItemRow[] {
  return saleItems.map((i) => ({
    id: i.id,
    productId: i.productId,
    productName: i.productName,
    quantity: i.quantity,
    unitPrice: i.unitPrice,
    discountType: null,
    discountValue: null,
    lineTotal: i.lineTotal,
  }));
}

/** Local items first; if empty and online, fetch server detail and cache. */
export async function loadSaleDetail(
  db: SqlDb,
  sale: SalesOutboxRow,
  opts?: { online?: boolean },
): Promise<SaleDetail> {
  const payload = parseOutboxPayload(sale);
  let items = await listItemsForSale(db, sale.client_sale_id);

  if (
    items.length === 0 &&
    opts?.online &&
    sale.server_sale_id
  ) {
    try {
      const res = await getSale(sale.server_sale_id);
      const serverItems = res.sale.items ?? [];
      if (serverItems.length > 0) {
        const mapped = itemsFromServer(serverItems);
        await replaceSaleItems(db, sale.client_sale_id, mapped);
        items = await listItemsForSale(db, sale.client_sale_id);
      }
    } catch {
      // keep empty / payload-only fallback
    }
  }

  return { sale, payload, items };
}
