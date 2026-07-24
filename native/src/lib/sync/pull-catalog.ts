import { apiFetch } from "@/lib/api/fetcher";
import {
  getLastPulledAt,
  setLastPulledAt,
  upsertCatalogBatch,
  type SyncCategoryInput,
  type SyncProductInput,
} from "@/lib/db/catalog-repo";
import type { SqlDb } from "@/lib/db/types";

export type CatalogSyncPayload = {
  serverTime: string;
  products: SyncProductInput[];
  categories: SyncCategoryInput[];
};

export async function fetchCatalogSync(since?: string | null) {
  const qs = since ? `?since=${encodeURIComponent(since)}` : "";
  return apiFetch<CatalogSyncPayload>(`/api/products/sync${qs}`);
}

/** Apply a sync payload into local SQLite (idempotent upserts). */
export async function applyCatalogSync(
  db: SqlDb,
  payload: CatalogSyncPayload,
) {
  await upsertCatalogBatch(db, {
    categories: payload.categories,
    products: payload.products,
  });
  const serverTime =
    typeof payload.serverTime === "string"
      ? payload.serverTime
      : new Date(payload.serverTime).toISOString();
  await setLastPulledAt(db, serverTime);
  // Skip COUNT(*) — extra IPC; toast can use pulled row counts.
  const activePulled = payload.products.filter((p) => !p.deletedAt).length;
  return {
    products: payload.products.length,
    categories: payload.categories.length,
    localCount: activePulled,
    serverTime,
  };
}

/** Pull delta (or full) catalog from server into local DB. */
export async function pullCatalog(db: SqlDb, opts?: { full?: boolean }) {
  const since = opts?.full ? null : await getLastPulledAt(db);
  const payload = await fetchCatalogSync(since);
  return applyCatalogSync(db, payload);
}
