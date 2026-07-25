import type { SqlDb } from "./types";
import type { OutboxItemRow, SaleApiPayload } from "@/features/checkout/build-sale-payload";

export type OutboxStatus = "pending" | "syncing" | "synced" | "failed";

export type SalesOutboxRow = {
  client_sale_id: string;
  sold_at: string;
  payload_json: string;
  status: OutboxStatus;
  error: string | null;
  server_sale_id: string | null;
  amount_due: number;
  payment_method: string;
  created_at: string;
  updated_at: string;
};

export type SaleItemOutboxRow = {
  id: string;
  client_sale_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  discount_type: string | null;
  discount_value: number | null;
  line_total: number;
};

export async function enqueueSale(
  db: SqlDb,
  input: {
    payload: SaleApiPayload;
    items: OutboxItemRow[];
  },
) {
  const now = new Date().toISOString();
  const { payload, items } = input;

  await db.execute(
    `INSERT INTO sales_outbox (
       client_sale_id, sold_at, payload_json, status, error, server_sale_id,
       amount_due, payment_method, created_at, updated_at
     ) VALUES (?, ?, ?, 'pending', NULL, NULL, ?, ?, ?, ?)`,
    [
      payload.clientSaleId,
      payload.soldAt,
      JSON.stringify(payload),
      payload.payment.amountDue,
      payload.payment.method,
      now,
      now,
    ],
  );

  for (const item of items) {
    await db.execute(
      `INSERT INTO sale_items_outbox (
         id, client_sale_id, product_id, product_name, quantity,
         unit_price, discount_type, discount_value, line_total
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        item.id,
        payload.clientSaleId,
        item.productId,
        item.productName,
        item.quantity,
        item.unitPrice,
        item.discountType,
        item.discountValue,
        item.lineTotal,
      ],
    );
  }
}

/** Optimistic local stock cut after sale. */
export async function decrementLocalStock(
  db: SqlDb,
  lines: Array<{ productId: string; quantity: number }>,
) {
  const now = new Date().toISOString();
  for (const line of lines) {
    await db.execute(
      `UPDATE products_local
       SET stock_qty = stock_qty - ?, updated_at = ?
       WHERE id = ? AND deleted_at IS NULL`,
      [line.quantity, now, line.productId],
    );
  }
}

export async function listPendingOutbox(db: SqlDb, limit = 50) {
  return db.select<SalesOutboxRow>(
    `SELECT * FROM sales_outbox
     WHERE status IN ('pending', 'failed')
     ORDER BY created_at ASC
     LIMIT ?`,
    [limit],
  );
}

export async function countPendingOutbox(db: SqlDb) {
  const rows = await db.select<{ n: number }>(
    `SELECT COUNT(*) as n FROM sales_outbox WHERE status IN ('pending', 'failed')`,
  );
  return Number(rows[0]?.n ?? 0);
}

export async function markOutboxSyncing(db: SqlDb, clientSaleId: string) {
  const now = new Date().toISOString();
  await db.execute(
    `UPDATE sales_outbox SET status = 'syncing', updated_at = ? WHERE client_sale_id = ?`,
    [now, clientSaleId],
  );
}

export async function markOutboxSynced(
  db: SqlDb,
  clientSaleId: string,
  serverSaleId: string,
) {
  const now = new Date().toISOString();
  await db.execute(
    `UPDATE sales_outbox
     SET status = 'synced', server_sale_id = ?, error = NULL, updated_at = ?
     WHERE client_sale_id = ?`,
    [serverSaleId, now, clientSaleId],
  );
}

export async function markOutboxFailed(
  db: SqlDb,
  clientSaleId: string,
  error: string,
) {
  const now = new Date().toISOString();
  await db.execute(
    `UPDATE sales_outbox
     SET status = 'failed', error = ?, updated_at = ?
     WHERE client_sale_id = ?`,
    [error, now, clientSaleId],
  );
}

export type SalesListStatusFilter =
  | "all"
  | "pending"
  | "failed"
  | "synced"
  | "needs_sync";

export type SalesListPaymentFilter = "all" | "cash" | "transfer";

export type SalesListFilters = {
  status?: SalesListStatusFilter;
  payment?: SalesListPaymentFilter;
  /** Inclusive lower bound on sold_at (ISO string) */
  soldFrom?: string | null;
};

function buildSalesListWhere(opts?: SalesListFilters & { cursor?: string | null }) {
  const where: string[] = [];
  const params: Array<string | number> = [];

  const status = opts?.status ?? "all";
  if (status === "pending") {
    where.push(`status IN ('pending', 'syncing')`);
  } else if (status === "needs_sync") {
    where.push(`status IN ('pending', 'syncing', 'failed')`);
  } else if (status === "failed" || status === "synced") {
    where.push(`status = ?`);
    params.push(status);
  }

  const payment = opts?.payment ?? "all";
  if (payment === "cash" || payment === "transfer") {
    where.push(`payment_method = ?`);
    params.push(payment);
  }

  if (opts?.soldFrom) {
    where.push(`sold_at >= ?`);
    params.push(opts.soldFrom);
  }

  if (opts?.cursor) {
    where.push(`sold_at < ?`);
    params.push(opts.cursor);
  }

  return {
    clause: where.length ? `WHERE ${where.join(" AND ")}` : "",
    params,
  };
}

export async function listLocalSales(
  db: SqlDb,
  opts?: SalesListFilters & { limit?: number; cursor?: string | null },
) {
  const limit = opts?.limit ?? 20;
  const { clause, params } = buildSalesListWhere(opts);
  return db.select<SalesOutboxRow>(
    `SELECT * FROM sales_outbox
     ${clause}
     ORDER BY sold_at DESC
     LIMIT ?`,
    [...params, limit],
  );
}

/** Cache a server sale into local history without touching stock or pending outbox. */
export async function upsertSyncedSaleFromServer(
  db: SqlDb,
  input: {
    clientSaleId: string;
    serverSaleId: string;
    soldAt: string;
    amountDue: number;
    paymentMethod: string;
    payload: SaleApiPayload;
  },
) {
  const now = new Date().toISOString();
  await db.execute(
    `INSERT INTO sales_outbox (
       client_sale_id, sold_at, payload_json, status, error, server_sale_id,
       amount_due, payment_method, created_at, updated_at
     ) VALUES (?, ?, ?, 'synced', NULL, ?, ?, ?, ?, ?)
     ON CONFLICT(client_sale_id) DO UPDATE SET
       server_sale_id = COALESCE(sales_outbox.server_sale_id, excluded.server_sale_id),
       status = CASE
         WHEN sales_outbox.status IN ('pending', 'syncing', 'failed') THEN 'synced'
         ELSE sales_outbox.status
       END,
       error = CASE
         WHEN sales_outbox.status IN ('pending', 'syncing', 'failed') THEN NULL
         ELSE sales_outbox.error
       END,
       updated_at = excluded.updated_at`,
    [
      input.clientSaleId,
      input.soldAt,
      JSON.stringify(input.payload),
      input.serverSaleId,
      input.amountDue,
      input.paymentMethod,
      now,
      now,
    ],
  );
}

export async function listItemsForSale(db: SqlDb, clientSaleId: string) {
  return db.select<SaleItemOutboxRow>(
    `SELECT * FROM sale_items_outbox WHERE client_sale_id = ?`,
    [clientSaleId],
  );
}

/** Replace cached line items for a sale (used after server detail pull). */
export async function replaceSaleItems(
  db: SqlDb,
  clientSaleId: string,
  items: OutboxItemRow[],
) {
  await db.execute(`DELETE FROM sale_items_outbox WHERE client_sale_id = ?`, [
    clientSaleId,
  ]);
  for (const item of items) {
    await db.execute(
      `INSERT INTO sale_items_outbox (
         id, client_sale_id, product_id, product_name, quantity,
         unit_price, discount_type, discount_value, line_total
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        item.id,
        clientSaleId,
        item.productId,
        item.productName,
        item.quantity,
        item.unitPrice,
        item.discountType,
        item.discountValue,
        item.lineTotal,
      ],
    );
  }
}

export function parseOutboxPayload(row: SalesOutboxRow): SaleApiPayload {
  return JSON.parse(row.payload_json) as SaleApiPayload;
}
