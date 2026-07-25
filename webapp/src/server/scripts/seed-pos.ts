#!/usr/bin/env bun

import { eq } from "drizzle-orm";
import { createSale } from "@/modules/sales/domain/repo/create-sale";
import { updateStoreSettings } from "@/modules/settings/domain/repo/store-settings";
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

async function seedSampleSales(cashierId: string) {
  const samples = [
    {
      clientSaleId: "seed_sale_cash_001",
      soldAt: new Date(Date.now() - 60 * 60 * 1000),
      lines: [
        { productId: "prod_water_500", quantity: 2, unitPrice: 5000 },
        { productId: "prod_chips", quantity: 1, unitPrice: 7000 },
      ],
      payment: {
        method: "cash" as const,
        amountDue: 17000,
        amountReceived: 20000,
        changeAmount: 3000,
      },
    },
    {
      clientSaleId: "seed_sale_transfer_001",
      soldAt: new Date(Date.now() - 30 * 60 * 1000),
      lines: [{ productId: "prod_cola_330", quantity: 1, unitPrice: 8000 }],
      payment: {
        method: "transfer" as const,
        amountDue: 8000,
        confirmedByStaff: true as const,
        slipImageKey: "seed/slip-transfer-001.jpg",
      },
    },
  ];

  let created = 0;
  for (const sample of samples) {
    const result = await createSale(sample, cashierId, db);
    if (!result.ok) {
      logger.warn(`Sample sale skipped (${sample.clientSaleId}): ${result.error}`);
      continue;
    }
    if (result.created) created += 1;
  }
  logger.info(`Sample sales ensured: ${samples.length} (new: ${created})`);
}

async function seedPos() {
  try {
    logger.info("Starting POS seed...");
    await syncFromCode(db);
    logger.info("RBAC roles synced (admin, cashier)");

    let cashierId: string | null = null;
    for (const u of SEED_USERS) {
      const id = await ensureUser(u);
      if (u.roleId === "cashier") cashierId = id;
    }

    await seedCatalog(db);

    await updateStoreSettings(
      {
        storeName: "POS Demo Shop",
        address: "Vientiane Capital",
        phone: "020 5555 1234",
        bankName: "BCEL One",
        bankAccount: "010-12-00-1234567-89",
        logoKey: null,
        qrImageKey: null,
        receiptWidthMm: 80,
        footerThanks: "Thank you",
      },
      db,
    );
    logger.info("Receipt / store settings seeded");

    if (cashierId) {
      await seedSampleSales(cashierId);
    }

    logger.info("POS seed completed successfully");
    process.exit(0);
  } catch (error) {
    logger.error("POS seed failed:", error);
    process.exit(1);
  }
}

seedPos();
