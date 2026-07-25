import type { StoreSettings } from "@/lib/api/settings";
import { getMeta, setMeta } from "./catalog-repo";
import type { SqlDb } from "./types";

export const META_RECEIPT_SETTINGS = "receipt_settings";

export async function cacheReceiptSettings(
  db: SqlDb,
  settings: StoreSettings,
) {
  await setMeta(db, META_RECEIPT_SETTINGS, JSON.stringify(settings));
}

export async function getCachedReceiptSettings(
  db: SqlDb,
): Promise<StoreSettings | null> {
  const raw = await getMeta(db, META_RECEIPT_SETTINGS);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoreSettings;
  } catch {
    return null;
  }
}
