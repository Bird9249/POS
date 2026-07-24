export type SqlDb = {
  execute(
    query: string,
    bindValues?: unknown[],
  ): Promise<{ rowsAffected: number }>;
  select<T>(query: string, bindValues?: unknown[]): Promise<T[]>;
};

export type LocalCategory = {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
};

export type LocalProduct = {
  id: string;
  name: string;
  image: string | null;
  barcode: string | null;
  sku: string | null;
  cost_price: number | null;
  sell_price: number;
  category_id: string | null;
  category_name: string | null;
  stock_qty: number;
  min_stock: number | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};
