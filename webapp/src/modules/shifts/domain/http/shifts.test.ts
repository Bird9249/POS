import { beforeAll, describe, expect, test } from "bun:test";
import { createSale } from "@/modules/sales/domain/repo/create-sale";
import { syncFromCode } from "@/modules/roles/domain/repo/sync-from-code";
import { authedRequest, signInCookie } from "@/modules/products/domain/http/test-auth";
import { db } from "@/server/platform/db/client";
import { createServer } from "@/server/platform/http/server";
import { seedCatalog } from "@/server/scripts/seed-catalog";
import { eq } from "drizzle-orm";
import { user } from "@/server/platform/db/schema/auth";
import { shift } from "@/server/platform/db/schema/shift";

const hasDb = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDb)("shifts API", () => {
  const app = createServer();
  let adminCookie = "";
  let cashierCookie = "";
  let cashierId = "";

  beforeAll(async () => {
    await syncFromCode(db);
    await seedCatalog(db);
    adminCookie = await signInCookie("admin@admin.com", "123456");
    cashierCookie = await signInCookie("cashier@pos.com", "123456");
    const [c] = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.email, "cashier@pos.com"))
      .limit(1);
    cashierId = c!.id;

    // Close any leftover open shift so tests start clean
    await db
      .update(shift)
      .set({
        status: "closed",
        closedAt: new Date(),
        countedCashKip: 0,
        expectedCashKip: 0,
        cashDiffKip: 0,
        totalSalesKip: 0,
        cashSalesKip: 0,
        transferSalesKip: 0,
        billCount: 0,
      })
      .where(eq(shift.openedBy, cashierId));
  });

  test("open shift + X-Report does not close", async () => {
    const openRes = await app.handle(
      authedRequest("http://localhost/api/shifts/open", cashierCookie, {
        method: "POST",
      }),
    );
    expect([200, 201]).toContain(openRes.status);
    const opened = (await openRes.json()) as {
      shift: { id: string; status: string };
    };
    expect(opened.shift.status).toBe("open");

    await createSale(
      {
        clientSaleId: `shift_x_${Date.now()}`,
        lines: [{ productId: "prod_water_500", quantity: 1, unitPrice: 5000 }],
        payment: {
          method: "cash",
          amountDue: 5000,
          amountReceived: 5000,
          changeAmount: 0,
        },
      },
      cashierId,
      db,
    );

    const xRes = await app.handle(
      authedRequest(
        `http://localhost/api/shifts/${opened.shift.id}/x-report`,
        cashierCookie,
      ),
    );
    expect(xRes.status).toBe(200);
    const xBody = (await xRes.json()) as {
      report: string;
      shift: {
        status: string;
        summary: { totalSalesKip: number; billCount: number };
      };
    };
    expect(xBody.report).toBe("x");
    expect(xBody.shift.status).toBe("open");
    expect(xBody.shift.summary.billCount).toBeGreaterThanOrEqual(1);
    expect(xBody.shift.summary.totalSalesKip).toBeGreaterThanOrEqual(5000);

    const stillOpen = await app.handle(
      authedRequest("http://localhost/api/shifts/current", cashierCookie),
    );
    const cur = (await stillOpen.json()) as {
      shift: { id: string; status: string } | null;
    };
    expect(cur.shift?.id).toBe(opened.shift.id);
    expect(cur.shift?.status).toBe("open");
  });

  test("Z-Report closes shift; cannot close again; can reopen", async () => {
    const curRes = await app.handle(
      authedRequest("http://localhost/api/shifts/current", cashierCookie),
    );
    let cur = (await curRes.json()) as {
      shift: { id: string } | null;
    };
    if (!cur.shift) {
      const openRes = await app.handle(
        authedRequest("http://localhost/api/shifts/open", cashierCookie, {
          method: "POST",
        }),
      );
      cur = (await openRes.json()) as { shift: { id: string } };
    }

    const zRes = await app.handle(
      authedRequest(
        `http://localhost/api/shifts/${cur.shift!.id}/z-report`,
        cashierCookie,
        {
          method: "POST",
          body: JSON.stringify({ countedCashKip: 50_000 }),
        },
      ),
    );
    expect(zRes.status).toBe(200);
    const zBody = (await zRes.json()) as {
      report: string;
      shift: {
        status: string;
        countedCashKip: number;
        cashDiffKip: number | null;
        closedAt: string | null;
      };
    };
    expect(zBody.report).toBe("z");
    expect(zBody.shift.status).toBe("closed");
    expect(zBody.shift.countedCashKip).toBe(50_000);
    expect(zBody.shift.closedAt).toBeTruthy();

    const again = await app.handle(
      authedRequest(
        `http://localhost/api/shifts/${cur.shift!.id}/z-report`,
        cashierCookie,
        {
          method: "POST",
          body: JSON.stringify({ countedCashKip: 50_000 }),
        },
      ),
    );
    expect(again.status).toBe(409);

    const reopen = await app.handle(
      authedRequest("http://localhost/api/shifts/open", cashierCookie, {
        method: "POST",
      }),
    );
    expect(reopen.status).toBe(201);
    const reopened = (await reopen.json()) as {
      shift: { id: string; status: string };
      created: boolean;
    };
    expect(reopened.created).toBe(true);
    expect(reopened.shift.id).not.toBe(cur.shift!.id);
    expect(reopened.shift.status).toBe("open");
  });

  test("admin can read another user's X-Report", async () => {
    const cur = await app.handle(
      authedRequest("http://localhost/api/shifts/current", cashierCookie),
    );
    const body = (await cur.json()) as { shift: { id: string } | null };
    expect(body.shift).toBeTruthy();

    const xRes = await app.handle(
      authedRequest(
        `http://localhost/api/shifts/${body.shift!.id}/x-report`,
        adminCookie,
      ),
    );
    expect(xRes.status).toBe(200);
  });
});
