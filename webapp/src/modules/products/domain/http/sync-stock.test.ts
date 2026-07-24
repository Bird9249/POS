import { beforeAll, describe, expect, test } from "bun:test";
import { createServer } from "@/server/platform/http/server";
import { syncFromCode } from "@/modules/roles/domain/repo/sync-from-code";
import { db } from "@/server/platform/db/client";
import { seedCatalog } from "@/server/scripts/seed-catalog";
import { authedRequest, signInCookie } from "./test-auth";

const hasDb = Boolean(process.env.DATABASE_URL);

type SyncBody = {
  serverTime: string;
  products: Array<{ id: string; stockQty: number; updatedAt: string }>;
  categories: Array<{ id: string; name: string }>;
};

describe.skipIf(!hasDb)("products sync + stock adjust API", () => {
  const app = createServer();
  let adminCookie = "";
  let cashierCookie = "";

  beforeAll(async () => {
    await syncFromCode(db);
    await seedCatalog(db);
    adminCookie = await signInCookie("admin@admin.com", "123456");
    cashierCookie = await signInCookie("cashier@pos.com", "123456");
  });

  test("GET /api/products/sync returns catalog", async () => {
    const res = await app.handle(
      authedRequest("http://localhost/api/products/sync", adminCookie),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as SyncBody;
    expect(body.serverTime).toBeTruthy();
    expect(body.categories.length).toBeGreaterThanOrEqual(2);
    expect(body.products.length).toBeGreaterThanOrEqual(6);
    expect(body.products.some((p) => p.id === "prod_candy_low")).toBe(true);
  });

  test("GET /api/products/sync?since= returns only changes", async () => {
    const full = await app.handle(
      authedRequest("http://localhost/api/products/sync", adminCookie),
    );
    const fullBody = (await full.json()) as SyncBody;

    // Far-future since → empty delta
    const future = encodeURIComponent(new Date(Date.now() + 60_000).toISOString());
    const emptyRes = await app.handle(
      authedRequest(
        `http://localhost/api/products/sync?since=${future}`,
        adminCookie,
      ),
    );
    expect(emptyRes.status).toBe(200);
    const emptyBody = (await emptyRes.json()) as SyncBody;
    expect(emptyBody.products).toEqual([]);
    expect(emptyBody.categories).toEqual([]);

    // Adjust stock to bump updatedAt, then since just before → see that product
    const before = new Date().toISOString();
    await new Promise((r) => setTimeout(r, 20));
    const adj = await app.handle(
      authedRequest(
        "http://localhost/api/products/prod_water_500/stock-adjustments",
        adminCookie,
        {
          method: "POST",
          body: JSON.stringify({
            type: "increase",
            quantity: 1,
            reason: "sync-delta-test",
          }),
        },
      ),
    );
    expect(adj.status).toBe(201);

    const since = encodeURIComponent(before);
    const deltaRes = await app.handle(
      authedRequest(
        `http://localhost/api/products/sync?since=${since}`,
        adminCookie,
      ),
    );
    expect(deltaRes.status).toBe(200);
    const delta = (await deltaRes.json()) as SyncBody;
    expect(delta.products.some((p) => p.id === "prod_water_500")).toBe(true);
    expect(delta.products.length).toBeLessThan(fullBody.products.length);
  });

  test("stock adjust restock / increase / decrease + reject over-decrease", async () => {
    const barcode = `STK-${Date.now()}`;
    const createRes = await app.handle(
      authedRequest("http://localhost/api/products", adminCookie, {
        method: "POST",
        body: JSON.stringify({
          name: "Stock test",
          barcode,
          costPrice: 100,
          sellPrice: 200,
          stockQty: 10,
          minStock: 2,
        }),
      }),
    );
    expect(createRes.status).toBe(201);
    const created = (await createRes.json()) as { id: string; stockQty: number };
    expect(created.stockQty).toBe(10);

    const restock = await app.handle(
      authedRequest(
        `http://localhost/api/products/${created.id}/stock-adjustments`,
        adminCookie,
        {
          method: "POST",
          body: JSON.stringify({
            type: "restock",
            quantity: 5,
            reason: "รับเข้า",
          }),
        },
      ),
    );
    expect(restock.status).toBe(201);
    const restocked = (await restock.json()) as {
      product: { stockQty: number };
      adjustment: { stockBefore: number; stockAfter: number; type: string };
    };
    expect(restocked.product.stockQty).toBe(15);
    expect(restocked.adjustment).toMatchObject({
      type: "restock",
      stockBefore: 10,
      stockAfter: 15,
    });

    const increase = await app.handle(
      authedRequest(
        `http://localhost/api/products/${created.id}/stock-adjustments`,
        adminCookie,
        {
          method: "POST",
          body: JSON.stringify({
            type: "increase",
            quantity: 2,
            reason: "นับเกิน",
          }),
        },
      ),
    );
    expect(increase.status).toBe(201);
    const increased = (await increase.json()) as {
      product: { stockQty: number };
    };
    expect(increased.product.stockQty).toBe(17);

    const decrease = await app.handle(
      authedRequest(
        `http://localhost/api/products/${created.id}/stock-adjustments`,
        adminCookie,
        {
          method: "POST",
          body: JSON.stringify({
            type: "decrease",
            quantity: 7,
            reason: "เสียหาย",
          }),
        },
      ),
    );
    expect(decrease.status).toBe(201);
    const decreased = (await decrease.json()) as {
      product: { stockQty: number };
    };
    expect(decreased.product.stockQty).toBe(10);

    const over = await app.handle(
      authedRequest(
        `http://localhost/api/products/${created.id}/stock-adjustments`,
        adminCookie,
        {
          method: "POST",
          body: JSON.stringify({
            type: "decrease",
            quantity: 99,
            reason: "เกินไป",
          }),
        },
      ),
    );
    expect(over.status).toBe(409);
    const overBody = (await over.json()) as { error: string };
    expect(overBody.error).toBe("INSUFFICIENT_STOCK");

    const hist = await app.handle(
      authedRequest(
        `http://localhost/api/products/${created.id}/stock-adjustments`,
        adminCookie,
      ),
    );
    expect(hist.status).toBe(200);
    const histBody = (await hist.json()) as { items: unknown[] };
    expect(histBody.items.length).toBeGreaterThanOrEqual(3);
  });

  test("cashier cannot adjust stock", async () => {
    const res = await app.handle(
      authedRequest(
        "http://localhost/api/products/prod_water_500/stock-adjustments",
        cashierCookie,
        {
          method: "POST",
          body: JSON.stringify({
            type: "restock",
            quantity: 1,
            reason: "nope",
          }),
        },
      ),
    );
    expect(res.status).toBe(403);
  });
});
