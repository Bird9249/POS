import { createSale } from "@/lib/api/sales";
import {
  listPendingOutbox,
  markOutboxFailed,
  markOutboxSynced,
  markOutboxSyncing,
  parseOutboxPayload,
} from "@/lib/db/sales-outbox-repo";
import type { SqlDb } from "@/lib/db/types";
import { pullCatalog } from "./pull-catalog";
import { pullSalesHistory } from "./pull-sales";

export type PushSalesResult = {
  attempted: number;
  synced: number;
  failed: number;
};

/** Push pending/failed outbox sales to server. */
export async function pushSalesOutbox(db: SqlDb): Promise<PushSalesResult> {
  const pending = await listPendingOutbox(db);
  let synced = 0;
  let failed = 0;

  for (const row of pending) {
    await markOutboxSyncing(db, row.client_sale_id);
    try {
      const payload = parseOutboxPayload(row);
      const res = await createSale(payload);
      await markOutboxSynced(db, row.client_sale_id, res.sale.id);
      synced += 1;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "PUSH_FAILED";
      await markOutboxFailed(db, row.client_sale_id, msg);
      failed += 1;
    }
  }

  return { attempted: pending.length, synced, failed };
}

/** Architecture order: push outbox → pull sales history → pull catalog. */
export async function syncSalesThenCatalog(
  db: SqlDb,
  opts?: { fullPull?: boolean },
) {
  const push = await pushSalesOutbox(db);
  let salesPull = { upserted: 0, nextCursor: null as string | null };
  try {
    salesPull = await pullSalesHistory(db);
  } catch {
    // Offline or auth — keep local history as-is
  }
  const pull = await pullCatalog(db, { full: opts?.fullPull });
  return { push, salesPull, pull };
}
