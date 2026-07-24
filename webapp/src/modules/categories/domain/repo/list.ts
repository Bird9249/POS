import { and, asc, eq, isNull, sql } from "drizzle-orm";
import type { DbClient } from "@/server/platform/db/client";
import { category, product } from "@/server/platform/db/schema";

export async function listCategories(db: DbClient) {
  return db
    .select({
      id: category.id,
      name: category.name,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
      productCount: sql<number>`cast(count(${product.id}) as int)`,
    })
    .from(category)
    .leftJoin(
      product,
      and(eq(product.categoryId, category.id), isNull(product.deletedAt)),
    )
    .groupBy(category.id)
    .orderBy(asc(category.name));
}
