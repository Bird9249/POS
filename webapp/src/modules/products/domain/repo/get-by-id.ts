import { and, eq, isNull } from "drizzle-orm";
import type { DbClient } from "@/server/platform/db/client";
import { category, product } from "@/server/platform/db/schema";

export async function getProductById(
  id: string,
  db: DbClient,
  opts?: { includeDeleted?: boolean },
) {
  const where = opts?.includeDeleted
    ? eq(product.id, id)
    : and(eq(product.id, id), isNull(product.deletedAt));

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
    .where(where)
    .limit(1);

  return rows[0] ?? null;
}
