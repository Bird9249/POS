import { eq, gt, isNull } from "drizzle-orm";
import type { DbClient } from "@/server/platform/db/client";
import { category, product } from "@/server/platform/db/schema";

export type SyncCatalogQuery = {
  since?: Date;
};

export async function syncCatalog(query: SyncCatalogQuery, db: DbClient) {
  const since = query.since;

  const productRows = await db
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
    .where(since ? gt(product.updatedAt, since) : isNull(product.deletedAt));

  const categoryQuery = db
    .select({
      id: category.id,
      name: category.name,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    })
    .from(category);

  const categoryRows = since
    ? await categoryQuery.where(gt(category.updatedAt, since))
    : await categoryQuery;

  return {
    products: productRows,
    categories: categoryRows,
  };
}
