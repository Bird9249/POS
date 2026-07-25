import { beforeAll, describe, expect, test } from "bun:test";
import { createSale } from "@/modules/sales/domain/repo/create-sale";
import { syncFromCode } from "@/modules/roles/domain/repo/sync-from-code";
import { openShift } from "@/modules/shifts/domain/repo/shifts";
import { authedRequest, signInCookie } from "@/modules/products/domain/http/test-auth";
import { db } from "@/server/platform/db/client";
import { createServer } from "@/server/platform/http/server";
import { seedCatalog } from "@/server/scripts/seed-catalog";
import { eq } from "drizzle-orm";
import { user } from "@/server/platform/db/schema/auth";

const hasDb = Boolean(process.env.DATABASE_URL);

const REPORT_DAY = "2026-06-15";
const soldAt = new Date(`${REPORT_DAY}T10:00:00+07:00`);

describe.skipIf(!hasDb)("reports API", () => {
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
    await openShift(cashierId, db);

    // Deterministic bills for report day (idempotent clientSaleIds)
    await createSale(
      {
        clientSaleId: "rpt_cash_001",
        soldAt,
        lines: [
          { productId: "prod_water_500", quantity: 3, unitPrice: 5000 },
          { productId: "prod_chips", quantity: 2, unitPrice: 7000 },
        ],
        payment: {
          method: "cash",
          amountDue: 29_000,
          amountReceived: 30_000,
          changeAmount: 1_000,
        },
      },
      cashierId,
      db,
    );
    await createSale(
      {
        clientSaleId: "rpt_transfer_001",
        soldAt: new Date(`${REPORT_DAY}T14:00:00+07:00`),
        lines: [
          { productId: "prod_cola_330", quantity: 2, unitPrice: 8000 },
          { productId: "prod_water_500", quantity: 1, unitPrice: 5000 },
        ],
        payment: {
          method: "transfer",
          amountDue: 21_000,
          confirmedByStaff: true,
          slipImageKey: "seed/rpt-slip.jpg",
        },
      },
      cashierId,
      db,
    );
    await createSale(
      {
        clientSaleId: "rpt_cash_002",
        soldAt: new Date(`${REPORT_DAY}T16:00:00+07:00`),
        lines: [{ productId: "prod_biscuit", quantity: 1, unitPrice: 8000 }],
        payment: {
          method: "cash",
          amountDue: 8000,
          amountReceived: 8000,
          changeAmount: 0,
        },
      },
      cashierId,
      db,
    );
  });

  test("daily sales splits cash vs transfer", async () => {
    const res = await app.handle(
      authedRequest(
        `http://localhost/api/reports/daily-sales?date=${REPORT_DAY}`,
        adminCookie,
      ),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      report: {
        totalSalesKip: number;
        cashSalesKip: number;
        transferSalesKip: number;
        billCount: number;
      };
    };
    // At least our 3 seeded report bills
    expect(body.report.cashSalesKip).toBeGreaterThanOrEqual(37_000);
    expect(body.report.transferSalesKip).toBeGreaterThanOrEqual(21_000);
    expect(body.report.totalSalesKip).toBe(
      body.report.cashSalesKip + body.report.transferSalesKip,
    );
    expect(body.report.billCount).toBeGreaterThanOrEqual(3);
  });

  test("profit-loss matches revenue − cogs", async () => {
    const res = await app.handle(
      authedRequest(
        `http://localhost/api/reports/profit-loss?from=${REPORT_DAY}&to=${REPORT_DAY}`,
        adminCookie,
      ),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      report: {
        revenueKip: number;
        cogsKip: number;
        grossProfitKip: number;
      };
    };
    // Known lines (rpt_*):
    // water 4×5000 cost 2000 → rev 20000 cogs 8000
    // chips 2×7000 cost 3500 → rev 14000 cogs 7000
    // cola 2×8000 cost 4500 → rev 16000 cogs 9000
    // biscuit 1×8000 cost 4000 → rev 8000 cogs 4000
    // totals: rev 58000 cogs 28000 gp 30000
    expect(body.report.revenueKip).toBeGreaterThanOrEqual(58_000);
    expect(body.report.cogsKip).toBeGreaterThanOrEqual(28_000);
    expect(body.report.grossProfitKip).toBe(
      body.report.revenueKip - body.report.cogsKip,
    );
  });

  test("top products ordered by quantity sold", async () => {
    const res = await app.handle(
      authedRequest(
        `http://localhost/api/reports/top-products?from=${REPORT_DAY}&to=${REPORT_DAY}&limit=5`,
        adminCookie,
      ),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      report: {
        items: Array<{
          rank: number;
          productId: string;
          quantitySold: number;
        }>;
      };
    };
    expect(body.report.items.length).toBeGreaterThan(0);
    expect(body.report.items[0]!.rank).toBe(1);
    // water: 3+1=4 should be top among rpt sales
    const water = body.report.items.find((i) => i.productId === "prod_water_500");
    expect(water).toBeTruthy();
    expect(water!.quantitySold).toBeGreaterThanOrEqual(4);
    expect(body.report.items[0]!.productId).toBe("prod_water_500");
    for (let i = 1; i < body.report.items.length; i++) {
      expect(body.report.items[i - 1]!.quantitySold).toBeGreaterThanOrEqual(
        body.report.items[i]!.quantitySold,
      );
    }
  });

  test("cashier is forbidden from aggregate reports", async () => {
    for (const path of [
      `/api/reports/daily-sales?date=${REPORT_DAY}`,
      `/api/reports/profit-loss?from=${REPORT_DAY}&to=${REPORT_DAY}`,
      `/api/reports/top-products?from=${REPORT_DAY}&to=${REPORT_DAY}`,
    ]) {
      const res = await app.handle(
        authedRequest(`http://localhost${path}`, cashierCookie),
      );
      expect(res.status).toBe(403);
    }
  });
});
