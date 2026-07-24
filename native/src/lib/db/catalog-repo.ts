import { META_LAST_PULLED_AT } from "./schema";
import type { LocalProduct, SqlDb } from "./types";

export type SyncCategoryInput = {
  id: string;
  name: string;
  createdAt: string | Date;
  updatedAt: string | Date;
};

export type SyncProductInput = {
  id: string;
  name: string;
  image?: string | null;
  barcode?: string | null;
  sku?: string | null;
  costPrice?: number | null;
  sellPrice: number;
  categoryId?: string | null;
  categoryName?: string | null;
  stockQty: number;
  minStock?: number | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  deletedAt?: string | Date | null;
};

/** Keep under SQLite default bind limit (999). 14 binds/product → ~50/row chunk. */
const PRODUCT_CHUNK = 40;
const CATEGORY_CHUNK = 80;

function iso(v: string | Date | null | undefined): string | null {
  if (v == null) return null;
  if (v instanceof Date) return v.toISOString();
  return String(v);
}

function chunk<T>(items: T[], size: number): T[][] {
  if (items.length === 0) return [];
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

export async function upsertCategories(
  db: SqlDb,
  categories: SyncCategoryInput[],
) {
  if (categories.length === 0) return;

  for (const group of chunk(categories, CATEGORY_CHUNK)) {
    const placeholders = group.map(() => "(?, ?, ?, ?)").join(", ");
    const binds: unknown[] = [];
    for (const c of group) {
      binds.push(c.id, c.name, iso(c.createdAt), iso(c.updatedAt));
    }
    await db.execute(
      `INSERT INTO categories_local (id, name, created_at, updated_at)
       VALUES ${placeholders}
       ON CONFLICT(id) DO UPDATE SET
         name = excluded.name,
         updated_at = excluded.updated_at`,
      binds,
    );
  }
}

export async function upsertProducts(db: SqlDb, products: SyncProductInput[]) {
  if (products.length === 0) return;

  for (const group of chunk(products, PRODUCT_CHUNK)) {
    const placeholders = group
      .map(() => "(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .join(", ");
    const binds: unknown[] = [];
    for (const p of group) {
      binds.push(
        p.id,
        p.name,
        p.image ?? null,
        p.barcode ?? null,
        p.sku ?? null,
        p.costPrice ?? null,
        p.sellPrice,
        p.categoryId ?? null,
        p.categoryName ?? null,
        p.stockQty,
        p.minStock ?? null,
        iso(p.createdAt),
        iso(p.updatedAt),
        iso(p.deletedAt ?? null),
      );
    }
    await db.execute(
      `INSERT INTO products_local (
         id, name, image, barcode, sku, cost_price, sell_price,
         category_id, category_name, stock_qty, min_stock,
         created_at, updated_at, deleted_at
       ) VALUES ${placeholders}
       ON CONFLICT(id) DO UPDATE SET
         name = excluded.name,
         image = excluded.image,
         barcode = excluded.barcode,
         sku = excluded.sku,
         cost_price = excluded.cost_price,
         sell_price = excluded.sell_price,
         category_id = excluded.category_id,
         category_name = excluded.category_name,
         stock_qty = excluded.stock_qty,
         min_stock = excluded.min_stock,
         updated_at = excluded.updated_at,
         deleted_at = excluded.deleted_at`,
      binds,
    );
  }
}

/**
 * Upsert catalog with as few IPC calls as possible.
 *
 * IMPORTANT: do NOT wrap in BEGIN/COMMIT across separate `db.execute` calls.
 * tauri-plugin-sql uses a sqlx Pool — BEGIN on conn A + INSERT on conn B
 * deadlocks on SQLite's write lock and looks like a multi-second hang.
 */
export async function upsertCatalogBatch(
  db: SqlDb,
  input: {
    categories: SyncCategoryInput[];
    products: SyncProductInput[];
  },
) {
  await upsertCategories(db, input.categories);
  await upsertProducts(db, input.products);
}

export async function getMeta(db: SqlDb, key: string) {
  const rows = await db.select<{ value: string }>(
    `SELECT value FROM meta WHERE key = ? LIMIT 1`,
    [key],
  );
  return rows[0]?.value ?? null;
}

export async function setMeta(db: SqlDb, key: string, value: string) {
  await db.execute(
    `INSERT INTO meta (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    [key, value],
  );
}

export async function getLastPulledAt(db: SqlDb) {
  return getMeta(db, META_LAST_PULLED_AT);
}

export async function setLastPulledAt(db: SqlDb, isoTime: string) {
  await setMeta(db, META_LAST_PULLED_AT, isoTime);
}

export async function findProductByBarcode(db: SqlDb, barcode: string) {
  const rows = await db.select<LocalProduct>(
    `SELECT * FROM products_local
     WHERE barcode = ? AND deleted_at IS NULL
     LIMIT 1`,
    [barcode],
  );
  return rows[0] ?? null;
}

export async function countLocalProducts(db: SqlDb) {
  const rows = await db.select<{ n: number }>(
    `SELECT COUNT(*) as n FROM products_local WHERE deleted_at IS NULL`,
  );
  return Number(rows[0]?.n ?? 0);
}

export function isLocalLowStock(p: Pick<LocalProduct, "stock_qty" | "min_stock">) {
  return p.min_stock != null && p.stock_qty < p.min_stock;
}
