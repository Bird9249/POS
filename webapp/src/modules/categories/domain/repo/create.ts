import type { DbClient } from "@/server/platform/db/client";
import { category } from "@/server/platform/db/schema";
import type { CreateCategoryDTO } from "../contracts";

export async function createCategory(input: CreateCategoryDTO, db: DbClient) {
  const [row] = await db
    .insert(category)
    .values({ name: input.name })
    .returning();
  return row!;
}
