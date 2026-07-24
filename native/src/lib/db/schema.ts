/** Shared DDL for Tauri migrations and bun:sqlite tests. */
export const CATALOG_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS categories_local (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS products_local (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  image TEXT,
  barcode TEXT,
  sku TEXT,
  cost_price INTEGER,
  sell_price INTEGER NOT NULL,
  category_id TEXT,
  category_name TEXT,
  stock_qty INTEGER NOT NULL DEFAULT 0,
  min_stock INTEGER,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_products_local_barcode
  ON products_local (barcode)
  WHERE barcode IS NOT NULL AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_products_local_updated
  ON products_local (updated_at);

CREATE TABLE IF NOT EXISTS meta (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL
);
`;

export const META_LAST_PULLED_AT = "last_pulled_at";
