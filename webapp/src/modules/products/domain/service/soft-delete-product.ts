import { deleteStoredImage } from "@/server/utils/delete-stored-image";
import type { DbClient } from "@/server/platform/db/client";
import { getProductById } from "../repo/get-by-id";
import { softDeleteProduct as softDeleteProductRepo } from "../repo/soft-delete";

/**
 * Soft-delete product and remove its object-store image (best-effort).
 * Image key is cleared so a restore path would not point at a deleted object.
 */
export async function softDeleteProductService(id: string, db: DbClient) {
  const existing = await getProductById(id, db);
  if (!existing) return null;

  const deleted = await softDeleteProductRepo(id, db);
  if (!deleted) return null;

  if (existing.image) {
    try {
      await deleteStoredImage(existing.image);
    } catch {
      // ignore
    }
  }

  return deleted;
}
