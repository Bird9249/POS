import { getReceiptSettings } from "@/lib/api/settings";
import {
  cacheReceiptSettings,
  getCachedReceiptSettings,
} from "@/lib/db/settings-repo";
import type { SqlDb } from "@/lib/db/types";

/** Pull store/receipt settings and cache in local meta. */
export async function pullReceiptSettings(db: SqlDb) {
  const res = await getReceiptSettings();
  await cacheReceiptSettings(db, res.settings);
  return res.settings;
}

/** Prefer network; fall back to cache (offline print / QR). */
export async function loadReceiptSettings(db: SqlDb) {
  try {
    return await pullReceiptSettings(db);
  } catch {
    return getCachedReceiptSettings(db);
  }
}
