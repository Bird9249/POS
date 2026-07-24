import { describe, expect, test } from "bun:test";
import { openBunSqlite } from "./bun-sqlite";
import {
  applyCatalogSync,
} from "../sync/pull-catalog";
import {
  countLocalProducts,
  findProductByBarcode,
  isLocalLowStock,
  upsertProducts,
} from "./catalog-repo";

describe("local catalog SQLite", () => {
  test("upsert sync payload then query by barcode", async () => {
    const db = openBunSqlite();
    const result = await applyCatalogSync(db, {
      serverTime: "2026-07-25T00:00:00.000Z",
      categories: [
        {
          id: "cat_drinks",
          name: "Drinks",
          createdAt: "2026-07-01T00:00:00.000Z",
          updatedAt: "2026-07-01T00:00:00.000Z",
        },
      ],
      products: [
        {
          id: "prod_water_500",
          name: "Water",
          barcode: "8850123456001",
          sellPrice: 5000,
          stockQty: 48,
          minStock: 12,
          categoryId: "cat_drinks",
          categoryName: "Drinks",
          createdAt: "2026-07-01T00:00:00.000Z",
          updatedAt: "2026-07-01T00:00:00.000Z",
        },
        {
          id: "prod_candy_low",
          name: "Candy",
          barcode: "8850123456006",
          sellPrice: 2000,
          stockQty: 3,
          minStock: 15,
          categoryId: "cat_drinks",
          createdAt: "2026-07-01T00:00:00.000Z",
          updatedAt: "2026-07-01T00:00:00.000Z",
        },
      ],
    });

    expect(result.localCount).toBe(2);
    const found = await findProductByBarcode(db, "8850123456001");
    expect(found?.id).toBe("prod_water_500");
    expect(found?.sell_price).toBe(5000);

    const low = await findProductByBarcode(db, "8850123456006");
    expect(low && isLocalLowStock(low)).toBe(true);
  });

  test("pull twice is idempotent (no duplicate rows)", async () => {
    const db = openBunSqlite();
    const payload = {
      serverTime: "2026-07-25T01:00:00.000Z",
      categories: [] as [],
      products: [
        {
          id: "p1",
          name: "A",
          barcode: "BAR-1",
          sellPrice: 100,
          stockQty: 1,
          minStock: null,
          createdAt: "2026-07-01T00:00:00.000Z",
          updatedAt: "2026-07-01T00:00:00.000Z",
        },
      ],
    };

    await applyCatalogSync(db, payload);
    await applyCatalogSync(db, {
      ...payload,
      serverTime: "2026-07-25T02:00:00.000Z",
      products: [
        {
          ...payload.products[0]!,
          stockQty: 9,
          updatedAt: "2026-07-25T02:00:00.000Z",
        },
      ],
    });

    expect(await countLocalProducts(db)).toBe(1);
    const row = await findProductByBarcode(db, "BAR-1");
    expect(row?.stock_qty).toBe(9);
  });

  test("soft-deleted product is marked deleted_at", async () => {
    const db = openBunSqlite();
    await upsertProducts(db, [
      {
        id: "gone",
        name: "Gone",
        barcode: "GONE",
        sellPrice: 1,
        stockQty: 0,
        createdAt: "2026-07-01T00:00:00.000Z",
        updatedAt: "2026-07-02T00:00:00.000Z",
        deletedAt: "2026-07-02T00:00:00.000Z",
      },
    ]);
    expect(await findProductByBarcode(db, "GONE")).toBeNull();
    expect(await countLocalProducts(db)).toBe(0);
  });
});
