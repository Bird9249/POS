import { beforeAll, describe, expect, test } from "bun:test";
import { syncFromCode } from "@/modules/roles/domain/repo/sync-from-code";
import { db } from "@/server/platform/db/client";
import { createServer } from "@/server/platform/http/server";
import { authedRequest, signInCookie } from "@/modules/products/domain/http/test-auth";
import { updateStoreSettings } from "../repo/store-settings";

const hasDb = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDb)("settings receipt API", () => {
  const app = createServer();
  let adminCookie = "";
  let cashierCookie = "";

  beforeAll(async () => {
    await syncFromCode(db);
    await updateStoreSettings(
      {
        storeName: "Test Shop",
        address: "Vientiane",
        phone: "0200000000",
        bankName: "BCEL",
        bankAccount: "123-456",
        receiptWidthMm: 80,
        footerThanks: "Thank you",
      },
      db,
    );
    adminCookie = await signInCookie("admin@admin.com", "123456");
    cashierCookie = await signInCookie("cashier@pos.com", "123456");
  });

  test("admin GET /api/settings/receipt", async () => {
    const res = await app.handle(
      authedRequest("http://localhost/api/settings/receipt", adminCookie),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      settings: { storeName: string; receiptWidthMm: number };
    };
    expect(body.settings.storeName).toBe("Test Shop");
    expect(body.settings.receiptWidthMm).toBe(80);
  });

  test("cashier GET /api/settings/receipt for print/QR", async () => {
    const res = await app.handle(
      authedRequest("http://localhost/api/settings/receipt", cashierCookie),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { settings: { storeName: string } };
    expect(body.settings.storeName).toBeTruthy();
  });

  test("admin PATCH /api/settings/receipt", async () => {
    const res = await app.handle(
      authedRequest("http://localhost/api/settings/receipt", adminCookie, {
        method: "PATCH",
        body: JSON.stringify({
          storeName: "Updated Shop",
          phone: "0201111111",
          receiptWidthMm: 58,
        }),
      }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      settings: { storeName: string; receiptWidthMm: number; phone: string };
    };
    expect(body.settings.storeName).toBe("Updated Shop");
    expect(body.settings.receiptWidthMm).toBe(58);
    expect(body.settings.phone).toBe("0201111111");
  });

  test("cashier PATCH /api/settings/receipt is 403", async () => {
    const res = await app.handle(
      authedRequest("http://localhost/api/settings/receipt", cashierCookie, {
        method: "PATCH",
        body: JSON.stringify({
          storeName: "Hacker Shop",
          receiptWidthMm: 80,
        }),
      }),
    );
    expect(res.status).toBe(403);
  });
});
