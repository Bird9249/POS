import { beforeAll, describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";
import { syncFromCode } from "@/modules/roles/domain/repo/sync-from-code";
import { db } from "@/server/platform/db/client";
import { product } from "@/server/platform/db/schema";
import { seedCatalog } from "@/server/scripts/seed-catalog";
import { createServer } from "@/server/platform/http/server";
import { authedRequest, signInCookie } from "@/modules/products/domain/http/test-auth";

const hasDb = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDb)("sales API", () => {
  const app = createServer();
  let adminCookie = "";
  let cashierCookie = "";

  beforeAll(async () => {
    await syncFromCode(db);
    await seedCatalog(db);
    adminCookie = await signInCookie("admin@admin.com", "123456");
    cashierCookie = await signInCookie("cashier@pos.com", "123456");
  });

  test("POST /api/sales creates bill and cuts stock", async () => {
    const clientSaleId = `sale_test_${Date.now()}_a`;
    const [before] = await db
      .select({ stockQty: product.stockQty })
      .from(product)
      .where(eq(product.id, "prod_water_500"))
      .limit(1);
    expect(before).toBeTruthy();

    const res = await app.handle(
      authedRequest("http://localhost/api/sales", cashierCookie, {
        method: "POST",
        body: JSON.stringify({
          clientSaleId,
          lines: [
            { productId: "prod_water_500", quantity: 2, unitPrice: 5000 },
          ],
          payment: {
            method: "cash",
            amountDue: 10_000,
            amountReceived: 20_000,
            changeAmount: 10_000,
          },
        }),
      }),
    );
    expect(res.status).toBe(201);
    const body = (await res.json()) as {
      created: boolean;
      sale: { clientSaleId: string; amountDue: number };
    };
    expect(body.created).toBe(true);
    expect(body.sale.clientSaleId).toBe(clientSaleId);
    expect(body.sale.amountDue).toBe(10_000);

    const [after] = await db
      .select({ stockQty: product.stockQty })
      .from(product)
      .where(eq(product.id, "prod_water_500"))
      .limit(1);
    expect(after!.stockQty).toBe(before!.stockQty - 2);
  });

  test("POST /api/sales is idempotent by clientSaleId", async () => {
    const clientSaleId = `sale_test_${Date.now()}_idem`;
    const payload = {
      clientSaleId,
      lines: [{ productId: "prod_cola_330", quantity: 1, unitPrice: 8000 }],
      payment: {
        method: "cash",
        amountDue: 8000,
        amountReceived: 8000,
        changeAmount: 0,
      },
    };

    const [before] = await db
      .select({ stockQty: product.stockQty })
      .from(product)
      .where(eq(product.id, "prod_cola_330"))
      .limit(1);

    const first = await app.handle(
      authedRequest("http://localhost/api/sales", cashierCookie, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    );
    expect(first.status).toBe(201);
    const firstBody = (await first.json()) as { sale: { id: string } };

    const second = await app.handle(
      authedRequest("http://localhost/api/sales", cashierCookie, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    );
    expect(second.status).toBe(200);
    const secondBody = (await second.json()) as {
      created: boolean;
      sale: { id: string };
    };
    expect(secondBody.created).toBe(false);
    expect(secondBody.sale.id).toBe(firstBody.sale.id);

    const [after] = await db
      .select({ stockQty: product.stockQty })
      .from(product)
      .where(eq(product.id, "prod_cola_330"))
      .limit(1);
    expect(after!.stockQty).toBe(before!.stockQty - 1);
  });

  test("cashier list sees only own sales; admin sees all", async () => {
    const clientSaleId = `sale_test_${Date.now()}_scope`;
    await app.handle(
      authedRequest("http://localhost/api/sales", cashierCookie, {
        method: "POST",
        body: JSON.stringify({
          clientSaleId,
          lines: [
            { productId: "prod_biscuit", quantity: 1, unitPrice: 8000 },
          ],
          payment: {
            method: "cash",
            amountDue: 8000,
            amountReceived: 8000,
            changeAmount: 0,
          },
        }),
      }),
    );

    const cashierList = await app.handle(
      authedRequest("http://localhost/api/sales?limit=50", cashierCookie),
    );
    expect(cashierList.status).toBe(200);
    const cashierBody = (await cashierList.json()) as {
      items: Array<{ clientSaleId: string }>;
    };
    expect(
      cashierBody.items.some((s) => s.clientSaleId === clientSaleId),
    ).toBe(true);

    const adminList = await app.handle(
      authedRequest("http://localhost/api/sales?limit=50", adminCookie),
    );
    expect(adminList.status).toBe(200);
    const adminBody = (await adminList.json()) as {
      items: Array<{ clientSaleId: string }>;
    };
    expect(adminBody.items.some((s) => s.clientSaleId === clientSaleId)).toBe(
      true,
    );
  });
});
