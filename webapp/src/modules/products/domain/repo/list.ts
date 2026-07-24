import {
  and,
  asc,
  eq,
  gt,
  ilike,
  isNull,
  lt,
  or,
  sql,
  type SQL,
} from "drizzle-orm";
import type { DbClient } from "@/server/platform/db/client";
import { category, product } from "@/server/platform/db/schema";
import type { ListProductsQueryDTO } from "../contracts";

export async function listProducts(query: ListProductsQueryDTO, db: DbClient) {
  const limit = query.limit;
  const conditions: SQL[] = [isNull(product.deletedAt)];

  if (query.cursor) {
    conditions.push(gt(product.id, query.cursor));
  }

  if (query.categoryId) {
    conditions.push(eq(product.categoryId, query.categoryId));
  }

  if (query.q?.trim()) {
    const term = `%${query.q.trim()}%`;
    conditions.push(
      or(
        ilike(product.name, term),
        ilike(product.barcode, term),
        ilike(product.sku, term),
      )!,
    );
  }

  if (query.lowStock) {
    conditions.push(
      and(
        sql`${product.minStock} is not null`,
        lt(product.stockQty, product.minStock),
      )!,
    );
  }

  const rows = await db
    .select({
      id: product.id,
      name: product.name,
      image: product.image,
      barcode: product.barcode,
      sku: product.sku,
      costPrice: product.costPrice,
      sellPrice: product.sellPrice,
      categoryId: product.categoryId,
      categoryName: category.name,
      stockQty: product.stockQty,
      minStock: product.minStock,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      deletedAt: product.deletedAt,
    })
    .from(product)
    .leftJoin(category, eq(product.categoryId, category.id))
    .where(and(...conditions))
    .orderBy(asc(product.id))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore ? (page[page.length - 1]?.id ?? null) : null;

  return { items: page, nextCursor };
}
