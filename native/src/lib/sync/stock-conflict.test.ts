import { describe, expect, test } from "bun:test";
import { openBunSqlite } from "@/lib/db/bun-sqlite";
import { upsertProducts } from "@/lib/db/catalog-repo";
import { decrementLocalStock } from "@/lib/db/sales-outbox-repo";
import { applyCatalogSync } from "./pull-catalog";

describe("stock conflict — server wins after pull", () => {
  test("optimistic local stock is overwritten by server pull", async () => {
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

    // Local optimistic cut (offline sale)
    await decrementLocalStock(db, [{ productId: "p1", quantity: 3 }]);
    let rows = await db.select<{ stock_qty: number }>(
      `SELECT stock_qty FROM products_local WHERE id = ?`,
      ["p1"],
    );
    expect(rows[0]!.stock_qty).toBe(7);

    // Server truth differs (another device sold / adjustment) → pull wins
    await applyCatalogSync(db, {
      serverTime: "2026-07-25T12:00:00.000Z",
      categories: [],
      products: [
        {
          id: "p1",
          name: "Water",
          sellPrice: 5000,
          stockQty: 4,
          createdAt: "2026-07-01T00:00:00.000Z",
          updatedAt: "2026-07-25T12:00:00.000Z",
        },
      ],
    });

    rows = await db.select<{ stock_qty: number }>(
      `SELECT stock_qty FROM products_local WHERE id = ?`,
      ["p1"],
    );
    expect(rows[0]!.stock_qty).toBe(4);
  });
});
