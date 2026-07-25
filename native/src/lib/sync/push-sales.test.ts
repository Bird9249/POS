import { describe, expect, test } from "bun:test";
import { openBunSqlite } from "@/lib/db/bun-sqlite";
import {
  countPendingOutbox,
  enqueueSale,
  listLocalSales,
  listPendingOutbox,
  markOutboxFailed,
  markOutboxSynced,
  markOutboxSyncing,
} from "@/lib/db/sales-outbox-repo";
import { buildSalePayload } from "@/features/checkout/build-sale-payload";
import { decrementLocalStock } from "@/lib/db/sales-outbox-repo";
import { upsertProducts } from "@/lib/db/catalog-repo";

describe("sales outbox", () => {
  test("enqueue → pending → synced / failed", async () => {
    const db = openBunSqlite();
    const { payload, items } = buildSalePayload({
      clientSaleId: "sale_1",
      lines: [
        {
          productId: "p1",
          name: "Water",
          unitPrice: 5000,
          stockQty: 5,
          quantity: 1,
          discount: null,
        },
      ],
      billDiscount: null,
      payment: {
        method: "cash",
        amountDue: 5000,
        amountReceived: 5000,
        changeAmount: 0,
      },
    });

    await enqueueSale(db, { payload, items });
    expect(await countPendingOutbox(db)).toBe(1);

    const pending = await listPendingOutbox(db);
    expect(pending[0]!.status).toBe("pending");

    await markOutboxSyncing(db, "sale_1");
    await markOutboxSynced(db, "sale_1", "srv_1");
    expect(await countPendingOutbox(db)).toBe(0);

    // Re-enqueue failed path
    const { payload: p2, items: i2 } = buildSalePayload({
      clientSaleId: "sale_2",
      lines: [
        {
          productId: "p1",
          name: "Water",
          unitPrice: 5000,
          stockQty: 5,
          quantity: 1,
          discount: null,
        },
      ],
      billDiscount: null,
      payment: {
        method: "cash",
        amountDue: 5000,
        amountReceived: 5000,
        changeAmount: 0,
      },
    });
    await enqueueSale(db, { payload: p2, items: i2 });
    await markOutboxFailed(db, "sale_2", "network");
    expect(await countPendingOutbox(db)).toBe(1);
    const failed = await listPendingOutbox(db);
    expect(failed[0]!.status).toBe("failed");
    expect(failed[0]!.error).toBe("network");
  });

  test("optimistic local stock decrement", async () => {
    const db = openBunSqlite();
    await upsertProducts(db, [
      {
        id: "p1",
        name: "Water",
        sellPrice: 5000,
        stockQty: 10,
        createdAt: "2026-07-01T00:00:00.000Z",
        updatedAt: "2026-07-01T00:00:00.000Z",
      },
    ]);
    await decrementLocalStock(db, [{ productId: "p1", quantity: 3 }]);
    const rows = await db.select<{ stock_qty: number }>(
      `SELECT stock_qty FROM products_local WHERE id = ?`,
      ["p1"],
    );
    expect(rows[0]!.stock_qty).toBe(7);
  });

  test("listLocalSales filters by status and payment", async () => {
    const db = openBunSqlite();
    const cash = buildSalePayload({
      clientSaleId: "sale_cash",
      soldAt: new Date("2026-07-20T10:00:00.000Z"),
      lines: [
        {
          productId: "p1",
          name: "Water",
          unitPrice: 5000,
          stockQty: 5,
          quantity: 1,
          discount: null,
        },
      ],
      billDiscount: null,
      payment: {
        method: "cash",
        amountDue: 5000,
        amountReceived: 5000,
        changeAmount: 0,
      },
    });
    const transfer = buildSalePayload({
      clientSaleId: "sale_tr",
      soldAt: new Date("2026-07-21T10:00:00.000Z"),
      lines: [
        {
          productId: "p1",
          name: "Water",
          unitPrice: 5000,
          stockQty: 5,
          quantity: 1,
          discount: null,
        },
      ],
      billDiscount: null,
      payment: {
        method: "transfer",
        amountDue: 5000,
        confirmedByStaff: true,
        slipImageKey: "slip/1.jpg",
      },
    });
    await enqueueSale(db, cash);
    await enqueueSale(db, transfer);
    await markOutboxSynced(db, "sale_cash", "srv_cash");

    const syncedCash = await listLocalSales(db, {
      status: "synced",
      payment: "cash",
    });
    expect(syncedCash.map((r) => r.client_sale_id)).toEqual(["sale_cash"]);

    const needsSync = await listLocalSales(db, { status: "needs_sync" });
    expect(needsSync.map((r) => r.client_sale_id)).toEqual(["sale_tr"]);

    const transfers = await listLocalSales(db, { payment: "transfer" });
    expect(transfers.map((r) => r.client_sale_id)).toEqual(["sale_tr"]);

    const fromDay = await listLocalSales(db, {
      soldFrom: "2026-07-21T00:00:00.000Z",
    });
    expect(fromDay.map((r) => r.client_sale_id)).toEqual(["sale_tr"]);
  });
});
