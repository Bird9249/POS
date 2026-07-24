import { beforeAll, describe, expect, test } from "bun:test";
import { createServer } from "@/server/platform/http/server";
import { syncFromCode } from "@/modules/roles/domain/repo/sync-from-code";
import { db } from "@/server/platform/db/client";
import { seedCatalog } from "@/server/scripts/seed-catalog";
import { authedRequest, signInCookie } from "./test-auth";

const hasDb = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDb)("products API", () => {
  const app = createServer();
  let adminCookie = "";
  let cashierCookie = "";

  beforeAll(async () => {
    await syncFromCode(db);
    await seedCatalog(db);
    adminCookie = await signInCookie("admin@admin.com", "123456");
    cashierCookie = await signInCookie("cashier@pos.com", "123456");
  });

  test("admin CRUD + soft delete", async () => {
    const barcode = `TEST-${Date.now()}`;
    const createRes = await app.handle(
      authedRequest("http://localhost/api/products", adminCookie, {
        method: "POST",
        body: JSON.stringify({
          name: "ສິນຄ້າທົດສອບ",
          barcode,
          costPrice: 1000,
          sellPrice: 2000,
          stockQty: 5,
          minStock: 2,
          categoryId: "cat_drinks",
        }),
      }),
    );
    expect(createRes.status).toBe(201);
    const created = (await createRes.json()) as {
      id: string;
      costPrice?: number;
    };
    expect(created.costPrice).toBe(1000);

    const getRes = await app.handle(
      authedRequest(`http://localhost/api/products/${created.id}`, adminCookie),
    );
    expect(getRes.status).toBe(200);

    const patchRes = await app.handle(
      authedRequest(`http://localhost/api/products/${created.id}`, adminCookie, {
        method: "PATCH",
        body: JSON.stringify({ sellPrice: 2500 }),
      }),
    );
    expect(patchRes.status).toBe(200);
    const patched = (await patchRes.json()) as { sellPrice: number };
    expect(patched.sellPrice).toBe(2500);

    const delRes = await app.handle(
      authedRequest(`http://localhost/api/products/${created.id}`, adminCookie, {
        method: "DELETE",
      }),
    );
    expect(delRes.status).toBe(204);

    const gone = await app.handle(
      authedRequest(`http://localhost/api/products/${created.id}`, adminCookie),
    );
    expect(gone.status).toBe(404);
  });

  test("duplicate barcode returns 409", async () => {
    const barcode = `DUP-${Date.now()}`;
    const first = await app.handle(
      authedRequest("http://localhost/api/products", adminCookie, {
        method: "POST",
        body: JSON.stringify({
          name: "A",
          barcode,
          costPrice: 1,
          sellPrice: 2,
          stockQty: 1,
        }),
      }),
    );
    expect(first.status).toBe(201);

    const second = await app.handle(
      authedRequest("http://localhost/api/products", adminCookie, {
        method: "POST",
        body: JSON.stringify({
          name: "B",
          barcode,
          costPrice: 1,
          sellPrice: 2,
          stockQty: 1,
        }),
      }),
    );
    expect(second.status).toBe(409);
    const body = (await second.json()) as { error: string };
    expect(body.error).toBe("BARCODE_DUPLICATE");
  });

  test("cursor pagination", async () => {
    const page1Res = await app.handle(
      authedRequest("http://localhost/api/products?limit=2", adminCookie),
    );
    expect(page1Res.status).toBe(200);
    const page1 = (await page1Res.json()) as {
      items: { id: string }[];
      nextCursor: string | null;
    };
    expect(page1.items.length).toBe(2);
    expect(page1.nextCursor).toBeTruthy();

    const page2Res = await app.handle(
      authedRequest(
        `http://localhost/api/products?limit=2&cursor=${page1.nextCursor}`,
        adminCookie,
      ),
    );
    const page2 = (await page2Res.json()) as {
      items: { id: string }[];
      nextCursor: string | null;
    };
    const ids1 = new Set(page1.items.map((i) => i.id));
    for (const item of page2.items) {
      expect(ids1.has(item.id)).toBe(false);
    }

    let cursor: string | null = page2.nextCursor;
    let guard = 0;
    while (cursor && guard < 20) {
      const res = await app.handle(
        authedRequest(
          `http://localhost/api/products?limit=50&cursor=${cursor}`,
          adminCookie,
        ),
      );
      const body = (await res.json()) as {
        items: { id: string }[];
        nextCursor: string | null;
      };
      cursor = body.nextCursor;
      guard += 1;
    }
    expect(cursor).toBeNull();
  });

  test("search by name and barcode", async () => {
    const byName = await app.handle(
      authedRequest(
        `http://localhost/api/products?q=${encodeURIComponent("ນ້ຳດື່ມ")}`,
        adminCookie,
      ),
    );
    const nameBody = (await byName.json()) as { items: { name: string }[] };
    expect(nameBody.items.some((i) => i.name.includes("ນ້ຳດື່ມ"))).toBe(true);

    const byBarcode = await app.handle(
      authedRequest("http://localhost/api/products?q=8850123456001", adminCookie),
    );
    const barBody = (await byBarcode.json()) as {
      items: { barcode: string | null }[];
    };
    expect(barBody.items.some((i) => i.barcode === "8850123456001")).toBe(true);
  });

  test("cashier GET hides costPrice", async () => {
    const res = await app.handle(
      authedRequest(
        "http://localhost/api/products?q=8850123456001",
        cashierCookie,
      ),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      items: Array<Record<string, unknown>>;
    };
    expect(body.items.length).toBeGreaterThan(0);
    expect(body.items[0]).not.toHaveProperty("costPrice");
    expect(body.items[0]).toHaveProperty("sellPrice");
  });

  test("cashier POST/PATCH forbidden", async () => {
    const post = await app.handle(
      authedRequest("http://localhost/api/products", cashierCookie, {
        method: "POST",
        body: JSON.stringify({
          name: "X",
          costPrice: 1,
          sellPrice: 2,
          stockQty: 1,
        }),
      }),
    );
    expect(post.status).toBe(403);

    const patch = await app.handle(
      authedRequest(
        "http://localhost/api/products/prod_water_500",
        cashierCookie,
        {
          method: "PATCH",
          body: JSON.stringify({ sellPrice: 999 }),
        },
      ),
    );
    expect(patch.status).toBe(403);
  });
});
