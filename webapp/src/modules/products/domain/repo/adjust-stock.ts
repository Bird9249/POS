import { and, desc, eq, isNull } from "drizzle-orm";
import type { DbClient } from "@/server/platform/db/client";
import { product, stockAdjustment } from "@/server/platform/db/schema";
import {
  applyStockAdjustment,
  type StockAdjustType,
} from "../stock/apply-adjustment";
import { getProductById } from "./get-by-id";

export type AdjustStockInput = {
  productId: string;
  type: StockAdjustType;
  quantity: number;
  reason: string;
  adjustedBy: string | null;
};

export async function adjustStock(input: AdjustStockInput, db: DbClient) {
  return db.transaction(async (tx) => {
    const [row] = await tx
      .select({
        id: product.id,
        stockQty: product.stockQty,
        deletedAt: product.deletedAt,
      })
      .from(product)
      .where(and(eq(product.id, input.productId), isNull(product.deletedAt)))
      .limit(1);

    if (!row) {
      return { ok: false as const, error: "NOT_FOUND" as const };
    }

    const math = applyStockAdjustment({
      stockQty: row.stockQty,
      type: input.type,
      quantity: input.quantity,
    });
    if (!math.ok) {
      return { ok: false as const, error: math.error };
    }

    const now = new Date();
    await tx
      .update(product)
      .set({ stockQty: math.stockAfter, updatedAt: now })
      .where(eq(product.id, input.productId));

    const [adjustment] = await tx
      .insert(stockAdjustment)
      .values({
        productId: input.productId,
        type: input.type,
        quantity: input.quantity,
        reason: input.reason,
        adjustedBy: input.adjustedBy,
        stockBefore: math.stockBefore,
        stockAfter: math.stockAfter,
        adjustedAt: now,
      })
      .returning();

    const updated = await getProductById(input.productId, tx);
    if (!updated || !adjustment) {
      return { ok: false as const, error: "NOT_FOUND" as const };
    }

    return {
      ok: true as const,
      product: updated,
      adjustment,
    };
  });
}

export async function listStockAdjustments(
  productId: string,
  db: DbClient,
  limit = 50,
) {
  return db
    .select()
    .from(stockAdjustment)
    .where(eq(stockAdjustment.productId, productId))
    .orderBy(desc(stockAdjustment.adjustedAt))
    .limit(limit);
}
