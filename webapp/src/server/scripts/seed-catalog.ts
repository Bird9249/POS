import { eq } from "drizzle-orm";
import type { DbClient } from "@/server/platform/db/client";
import { category, product, stockAdjustment } from "@/server/platform/db/schema";
import { logger } from "@/server/platform/observability/logger";

const CATEGORIES = [
  { id: "cat_drinks", name: "ເຄື່ອງດື່ມ" },
  { id: "cat_snacks", name: "ຂອງກິນເລັ່ນ" },
] as const;

const PRODUCTS = [
  {
    id: "prod_water_500",
    name: "ນ້ຳດື່ມ 500ml",
    barcode: "8850123456001",
    sku: "WTR-500",
    categoryId: "cat_drinks",
    costPrice: 2000,
    sellPrice: 5000,
    stockQty: 48,
    minStock: 12,
  },
  {
    id: "prod_cola_330",
    name: "ໂຄລາ 330ml",
    barcode: "8850123456002",
    sku: "COLA-330",
    categoryId: "cat_drinks",
    costPrice: 4500,
    sellPrice: 8000,
    stockQty: 36,
    minStock: 10,
  },
  {
    id: "prod_energy",
    name: "ເຄື່ອງດື່ມຊູກຳລັງ",
    barcode: "8850123456003",
    sku: "NRG-250",
    categoryId: "cat_drinks",
    costPrice: 6000,
    sellPrice: 10000,
    stockQty: 20,
    minStock: 8,
  },
  {
    id: "prod_chips",
    name: "ມັນຝຣັ່ງຂົ້ວ",
    barcode: "8850123456004",
    sku: "CHIP-50",
    categoryId: "cat_snacks",
    costPrice: 3500,
    sellPrice: 7000,
    stockQty: 25,
    minStock: 10,
  },
  {
    id: "prod_biscuit",
    name: "ບິສກິດ",
    barcode: "8850123456005",
    sku: "BIS-100",
    categoryId: "cat_snacks",
    costPrice: 4000,
    sellPrice: 8000,
    stockQty: 15,
    minStock: 10,
  },
  {
    id: "prod_candy_low",
    name: "ລູກກົມ (ສະຕັອກຕ່ຳ)",
    barcode: "8850123456006",
    sku: "CND-01",
    categoryId: "cat_snacks",
    costPrice: 1000,
    sellPrice: 2000,
    stockQty: 3,
    minStock: 15,
  },
  {
    id: "prod_scan_test",
    name: "ສິນຄ້າທົດສອບສະແກນ",
    barcode: "BARCODE-001",
    sku: "SCAN-001",
    categoryId: "cat_snacks",
    costPrice: 1000,
    sellPrice: 3000,
    stockQty: 99,
    minStock: 5,
  },
] as const;

export async function seedCatalog(db: DbClient) {
  for (const c of CATEGORIES) {
    const existing = await db
      .select({ id: category.id })
      .from(category)
      .where(eq(category.id, c.id))
      .limit(1);
    if (existing[0]) {
      // Don't bump updatedAt when unchanged — avoids full delta re-pull on every seed.
      await db
        .update(category)
        .set({ name: c.name })
        .where(eq(category.id, c.id));
    } else {
      await db.insert(category).values(c);
    }
  }
  logger.info(`Categories seeded: ${CATEGORIES.length}`);

  for (const p of PRODUCTS) {
    const existing = await db
      .select({ id: product.id })
      .from(product)
      .where(eq(product.id, p.id))
      .limit(1);
    if (existing[0]) {
      // Keep updatedAt stable on re-seed so clients don't re-download the whole catalog.
      await db
        .update(product)
        .set({
          name: p.name,
          barcode: p.barcode,
          sku: p.sku,
          categoryId: p.categoryId,
          costPrice: p.costPrice,
          sellPrice: p.sellPrice,
          stockQty: p.stockQty,
          minStock: p.minStock,
          deletedAt: null,
        })
        .where(eq(product.id, p.id));
    } else {
      await db.insert(product).values(p);
    }
  }
  logger.info(`Products seeded: ${PRODUCTS.length}`);

  // Optional sample adjustments for history UI / tests (idempotent by fixed ids)
  const SAMPLE_ADJUSTMENTS = [
    {
      id: "adj_water_restock",
      productId: "prod_water_500",
      type: "restock",
      quantity: 12,
      reason: "seed restock",
      stockBefore: 36,
      stockAfter: 48,
    },
    {
      id: "adj_candy_decrease",
      productId: "prod_candy_low",
      type: "decrease",
      quantity: 2,
      reason: "seed damage",
      stockBefore: 5,
      stockAfter: 3,
    },
  ] as const;

  for (const a of SAMPLE_ADJUSTMENTS) {
    const existing = await db
      .select({ id: stockAdjustment.id })
      .from(stockAdjustment)
      .where(eq(stockAdjustment.id, a.id))
      .limit(1);
    if (existing[0]) continue;
    await db.insert(stockAdjustment).values({
      ...a,
      adjustedBy: null,
      adjustedAt: new Date(),
    });
  }
  logger.info(`Stock adjustments seeded: ${SAMPLE_ADJUSTMENTS.length}`);
}
