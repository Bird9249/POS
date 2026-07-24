import { deleteStoredImage } from "@/server/utils/delete-stored-image";
import type { DbClient } from "@/server/platform/db/client";
import type { UpdateProductDTO } from "../contracts";
import { getProductById } from "../repo/get-by-id";
import { updateProduct as updateProductRepo } from "../repo/update";

function normalizeImage(
  image: string | null | undefined,
): string | null | undefined {
  if (image === undefined) return undefined;
  if (image === null) return null;
  const trimmed = image.trim();
  return trimmed === "" ? null : trimmed;
}

/** Update product and remove previous object-store image when replaced/cleared. */
export async function updateProductService(
  id: string,
  input: UpdateProductDTO,
  db: DbClient,
) {
  const existing = await getProductById(id, db);
  if (!existing) return null;

  const nextImage = normalizeImage(input.image);
  const patch: UpdateProductDTO = { ...input };
  if (input.image !== undefined) {
    patch.image = nextImage ?? null;
  }

  const imageChanging = input.image !== undefined;
  const oldKey =
    imageChanging &&
    existing.image &&
    existing.image !== (nextImage ?? null)
      ? existing.image
      : null;

  const updated = await updateProductRepo(id, patch, db);
  if (!updated) return null;

  if (oldKey) {
    // Best-effort — DB already updated; don't fail the request if S3 is down
    try {
      await deleteStoredImage(oldKey);
    } catch {
      // ignore
    }
  }

  return updated;
}
