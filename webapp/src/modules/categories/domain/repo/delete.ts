import { eq } from "drizzle-orm";
import type { DbClient } from "@/server/platform/db/client";
import { category } from "@/server/platform/db/schema";

export async function deleteCategory(id: string, db: DbClient) {
  const [row] = await db
    .delete(category)
    .where(eq(category.id, id))
    .returning({ id: category.id });
  return row ?? null;
}
