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

CREATE TABLE IF NOT EXISTS sales_outbox (
  client_sale_id TEXT PRIMARY KEY NOT NULL,
  sold_at TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  error TEXT,
  server_sale_id TEXT,
  amount_due INTEGER NOT NULL,
  payment_method TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sales_outbox_status
  ON sales_outbox (status, created_at);

CREATE TABLE IF NOT EXISTS sale_items_outbox (
  id TEXT PRIMARY KEY NOT NULL,
  client_sale_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price INTEGER NOT NULL,
  discount_type TEXT,
  discount_value INTEGER,
  line_total INTEGER NOT NULL,
  FOREIGN KEY (client_sale_id) REFERENCES sales_outbox(client_sale_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sale_items_outbox_sale
  ON sale_items_outbox (client_sale_id);
`;

/** Migration v2 only (already-applied installs). */
export const SALES_OUTBOX_MIGRATION_SQL = `
CREATE TABLE IF NOT EXISTS sales_outbox (
  client_sale_id TEXT PRIMARY KEY NOT NULL,
  sold_at TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  error TEXT,
  server_sale_id TEXT,
  amount_due INTEGER NOT NULL,
  payment_method TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sales_outbox_status
  ON sales_outbox (status, created_at);

CREATE TABLE IF NOT EXISTS sale_items_outbox (
  id TEXT PRIMARY KEY NOT NULL,
  client_sale_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price INTEGER NOT NULL,
  discount_type TEXT,
  discount_value INTEGER,
  line_total INTEGER NOT NULL,
  FOREIGN KEY (client_sale_id) REFERENCES sales_outbox(client_sale_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sale_items_outbox_sale
  ON sale_items_outbox (client_sale_id);
`;

export const META_LAST_PULLED_AT = "last_pulled_at";
