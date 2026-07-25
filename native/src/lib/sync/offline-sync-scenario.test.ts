import { describe, expect, test } from "bun:test";
import { buildSalePayload } from "@/features/checkout/build-sale-payload";
import { openBunSqlite } from "@/lib/db/bun-sqlite";
import { upsertProducts } from "@/lib/db/catalog-repo";
import {
  countPendingOutbox,
  decrementLocalStock,
  enqueueSale,
  listLocalSales,
  markOutboxSynced,
} from "@/lib/db/sales-outbox-repo";
import { applyCatalogSync } from "./pull-catalog";

function makeSale(clientSaleId: string, qty: number) {
  return buildSalePayload({
    clientSaleId,
    lines: [
      {
        productId: "p1",
        name: "Water",
        unitPrice: 5000,
        stockQty: 20,
        quantity: qty,
        discount: null,
      },
    ],
    billDiscount: null,
    payment: {
      method: "cash",
      amountDue: 5000 * qty,
      amountReceived: 5000 * qty,
      changeAmount: 0,
    },
  });
}

describe("offline sync scenario — multi bill", () => {
  test("enqueue many bills, sync marks unique, pull sets final stock", async () => {
    const db = openBunSqlite();
    await upsertProducts(db, [
      {
        id: "p1",
        name: "Water",
        sellPrice: 5000,
        stockQty: 20,
        createdAt: "2026-07-01T00:00:00.000Z",
        updatedAt: "2026-07-01T00:00:00.000Z",
      },
    ]);

    const a = makeSale("sale_offline_a", 2);
    const b = makeSale("sale_offline_b", 3);
    await enqueueSale(db, a);
    await decrementLocalStock(db, [{ productId: "p1", quantity: 2 }]);
    await enqueueSale(db, b);
    await decrementLocalStock(db, [{ productId: "p1", quantity: 3 }]);

    expect(await countPendingOutbox(db)).toBe(2);
    let stock = await db.select<{ stock_qty: number }>(
      `SELECT stock_qty FROM products_local WHERE id = ?`,
      ["p1"],
    );
    expect(stock[0]!.stock_qty).toBe(15);

    // Simulate successful push (server assigns distinct sale ids; idempotent keys)
    await markOutboxSynced(db, "sale_offline_a", "srv_a");
    await markOutboxSynced(db, "sale_offline_b", "srv_b");
    expect(await countPendingOutbox(db)).toBe(0);

    const local = await listLocalSales(db, { status: "synced" });
    const ids = local.map((r) => r.client_sale_id).sort();
    expect(ids).toEqual(["sale_offline_a", "sale_offline_b"]);

    // Server final stock after both sales applied once
    await applyCatalogSync(db, {
      serverTime: "2026-07-25T13:00:00.000Z",
      categories: [],
      products: [
        {
          id: "p1",
          name: "Water",
          sellPrice: 5000,
          stockQty: 15,
          createdAt: "2026-07-01T00:00:00.000Z",
          updatedAt: "2026-07-25T13:00:00.000Z",
        },
      ],
    });
    stock = await db.select<{ stock_qty: number }>(
      `SELECT stock_qty FROM products_local WHERE id = ?`,
      ["p1"],
    );
    expect(stock[0]!.stock_qty).toBe(15);
  });
});
