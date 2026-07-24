import { eq } from "drizzle-orm";
import type { DbClient } from "@/server/platform/db/client";
import { category } from "@/server/platform/db/schema";

export async function getCategoryById(id: string, db: DbClient) {
  const rows = await db
    .select()
    .from(category)
    .where(eq(category.id, id))
    .limit(1);
  return rows[0] ?? null;
}
