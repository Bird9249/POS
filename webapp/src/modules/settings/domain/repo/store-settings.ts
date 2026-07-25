import { eq } from "drizzle-orm";
import type { DbClient } from "@/server/platform/db/client";
import { storeSettings } from "@/server/platform/db/schema";
import type { UpdateStoreSettingsDTO } from "../contracts";

export const DEFAULT_STORE_SETTINGS_ID = "default";

export async function getStoreSettings(db: DbClient) {
  const [row] = await db
    .select()
    .from(storeSettings)
    .where(eq(storeSettings.id, DEFAULT_STORE_SETTINGS_ID))
    .limit(1);
  return row ?? null;
}

export async function ensureStoreSettings(db: DbClient) {
  const existing = await getStoreSettings(db);
  if (existing) return existing;

  const [created] = await db
    .insert(storeSettings)
    .values({
      id: DEFAULT_STORE_SETTINGS_ID,
      storeName: "",
      receiptWidthMm: 80,
    })
    .returning();
  return created!;
}

export async function updateStoreSettings(
  input: UpdateStoreSettingsDTO,
  db: DbClient,
) {
  await ensureStoreSettings(db);
  const [updated] = await db
    .update(storeSettings)
    .set({
      storeName: input.storeName,
      address: input.address ?? null,
      phone: input.phone ?? null,
      logoKey: input.logoKey ?? null,
      bankName: input.bankName ?? null,
      bankAccount: input.bankAccount ?? null,
      qrImageKey: input.qrImageKey ?? null,
      receiptWidthMm: input.receiptWidthMm,
      footerThanks: input.footerThanks ?? null,
      updatedAt: new Date(),
    })
    .where(eq(storeSettings.id, DEFAULT_STORE_SETTINGS_ID))
    .returning();
  return updated!;
}
