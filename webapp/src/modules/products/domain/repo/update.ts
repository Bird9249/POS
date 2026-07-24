import { and, eq, isNull } from "drizzle-orm";
import type { DbClient } from "@/server/platform/db/client";
import { product } from "@/server/platform/db/schema";
import type { UpdateProductDTO } from "../contracts";
import { getProductById } from "./get-by-id";
import { isBarcodeConflict } from "./is-barcode-conflict";

export async function updateProduct(
  id: string,
  input: UpdateProductDTO,
  db: DbClient,
) {
  const patch: Record<string, unknown> = { updatedAt: new Date() };
  if (input.name !== undefined) patch.name = input.name;
  if (input.image !== undefined) patch.image = input.image;
  if (input.barcode !== undefined) patch.barcode = input.barcode;
  if (input.sku !== undefined) patch.sku = input.sku;
  if (input.costPrice !== undefined) patch.costPrice = input.costPrice;
  if (input.sellPrice !== undefined) patch.sellPrice = input.sellPrice;
  if (input.categoryId !== undefined) patch.categoryId = input.categoryId;
  if (input.stockQty !== undefined) patch.stockQty = input.stockQty;
  if (input.minStock !== undefined) patch.minStock = input.minStock;

  try {
    const [row] = await db
      .update(product)
      .set(patch)
      .where(and(eq(product.id, id), isNull(product.deletedAt)))
      .returning({ id: product.id });

    if (!row) return null;
    return getProductById(row.id, db);
  } catch (e) {
    if (isBarcodeConflict(e)) throw new Error("BARCODE_DUPLICATE");
    throw e;
  }
}
