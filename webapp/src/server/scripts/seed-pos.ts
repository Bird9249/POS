#!/usr/bin/env bun

import { eq } from "drizzle-orm";
import { syncFromCode } from "@/modules/roles/domain/repo/sync-from-code";
import { assignRoleToUser } from "@/modules/roles/domain/repo/assign-role-to-user";
import { createUserService } from "@/modules/users/domain/service/create";
import { db } from "@/server/platform/db/client";
import { user } from "@/server/platform/db/schema/auth";
import { logger } from "@/server/platform/observability/logger";
import { seedCatalog } from "./seed-catalog";

const SEED_USERS = [
  {
    email: "admin@admin.com",
    name: "Admin",
    password: "123456",
    roleId: "admin",
  },
  {
    email: "cashier@pos.com",
    name: "Cashier",
    password: "123456",
    roleId: "cashier",
  },
] as const;

async function ensureUser(input: (typeof SEED_USERS)[number]) {
  const existing = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, input.email))
    .limit(1);

  if (existing[0]) {
    await assignRoleToUser(existing[0].id, input.roleId, db);
    logger.info(`User exists, ensured role: ${input.email} → ${input.roleId}`);
    return existing[0].id;
  }

  const { created } = await db.transaction(async (tx) => {
    return createUserService(tx, {
      input: {
        email: input.email,
        name: input.name,
        password: input.password,
        roleId: input.roleId,
      },
    });
  });

  logger.info(`Created user: ${input.email} (${created.id}) role=${input.roleId}`);
  return created.id;
}

async function seedPos() {
  try {
    logger.info("Starting POS seed...");
    await syncFromCode(db);
    logger.info("RBAC roles synced (admin, cashier)");

    for (const u of SEED_USERS) {
      await ensureUser(u);
    }

    await seedCatalog(db);

    logger.info("POS seed completed successfully");
    process.exit(0);
  } catch (error) {
    logger.error("POS seed failed:", error);
    process.exit(1);
  }
}

seedPos();
