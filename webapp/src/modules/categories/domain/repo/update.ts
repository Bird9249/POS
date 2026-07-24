import { eq } from "drizzle-orm";
import type { DbClient } from "@/server/platform/db/client";
import { category } from "@/server/platform/db/schema";
import type { UpdateCategoryDTO } from "../contracts";

export async function updateCategory(
  id: string,
  input: UpdateCategoryDTO,
  db: DbClient,
) {
  const [row] = await db
    .update(category)
    .set({ name: input.name, updatedAt: new Date() })
    .where(eq(category.id, id))
    .returning();
  return row ?? null;
}
