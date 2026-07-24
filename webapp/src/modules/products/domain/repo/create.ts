import type { DbClient } from "@/server/platform/db/client";
import { product } from "@/server/platform/db/schema";
import type { CreateProductDTO } from "../contracts";
import { getProductById } from "./get-by-id";
import { isBarcodeConflict } from "./is-barcode-conflict";

export async function createProduct(input: CreateProductDTO, db: DbClient) {
  try {
    const [row] = await db
      .insert(product)
      .values({
        name: input.name,
        image: input.image ?? null,
        barcode: input.barcode ?? null,
        sku: input.sku ?? null,
        costPrice: input.costPrice,
        sellPrice: input.sellPrice,
        categoryId: input.categoryId ?? null,
        stockQty: input.stockQty ?? 0,
        minStock: input.minStock ?? null,
      })
      .returning({ id: product.id });

    return getProductById(row!.id, db);
  } catch (e) {
    if (isBarcodeConflict(e)) throw new Error("BARCODE_DUPLICATE");
    throw e;
  }
}
