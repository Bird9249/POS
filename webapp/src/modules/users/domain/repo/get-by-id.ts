import { getUserRoleIds } from "@/modules/roles/domain/repo/get-user-role-ids";
import { schema } from "@/server/platform/db/client";
import type { DbTransaction } from "@/shared/types";
import { eq } from "drizzle-orm";

type UserRow = typeof schema.user.$inferSelect;

export async function getUserById(id: string, client: DbTransaction) {
  const [r] = (await client
    .select()
    .from(schema.user)
    .where(eq(schema.user.id, id))) as unknown as UserRow[];
  if (!r) return null;

  const roleIds = await getUserRoleIds(r.id, client);
  return {
    id: r.id,
    email: r.email,
    phoneNumber: r.phoneNumber ?? null,
    name: r.name ?? null,
    image: r.image ?? null,
    banned: r.banned ?? false,
    banReason: r.banReason ?? null,
    banExpires: r.banExpires ?? null,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    roleIds,
  };
}
