import { describe, expect, test } from "bun:test";
import { openBunSqlite } from "@/lib/db/bun-sqlite";
import type { StoreSettings } from "@/lib/api/settings";
import {
  cacheReceiptSettings,
  getCachedReceiptSettings,
} from "./settings-repo";

describe("receipt settings local cache", () => {
  test("cache then read without API", async () => {
    const db = openBunSqlite();
    const settings: StoreSettings = {
      id: "default",
      storeName: "Cached Shop",
      address: "Addr",
      phone: "020",
      logoKey: null,
      bankName: "BCEL",
      bankAccount: "111",
      qrImageKey: null,
      receiptWidthMm: 58,
      footerThanks: "Thanks",
      updatedAt: "2026-07-25T00:00:00.000Z",
    };
    await cacheReceiptSettings(db, settings);
    const loaded = await getCachedReceiptSettings(db);
    expect(loaded?.storeName).toBe("Cached Shop");
    expect(loaded?.receiptWidthMm).toBe(58);
    expect(loaded?.bankAccount).toBe("111");
  });
});
