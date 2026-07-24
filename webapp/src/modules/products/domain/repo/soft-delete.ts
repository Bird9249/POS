import { and, eq, isNull } from "drizzle-orm";
import type { DbClient } from "@/server/platform/db/client";
import { product } from "@/server/platform/db/schema";

export async function softDeleteProduct(id: string, db: DbClient) {
  const [row] = await db
    .update(product)
    .set({
      deletedAt: new Date(),
      updatedAt: new Date(),
      image: null,
    })
    .where(and(eq(product.id, id), isNull(product.deletedAt)))
    .returning({ id: product.id, image: product.image });
  return row ?? null;
}
