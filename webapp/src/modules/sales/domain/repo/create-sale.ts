import { and, eq, inArray, isNull } from "drizzle-orm";
import { resolveOpenShiftId } from "@/modules/shifts/domain/repo/shifts";
import type { DbClient } from "@/server/platform/db/client";
import { product, sale, saleItem } from "@/server/platform/db/schema";
import {
  billDiscountKip,
  computeCartTotals,
  lineDiscountKip,
  lineTotal,
  type LineDiscount,
} from "../cart-math";
import type { CreateSaleDTO } from "../contracts";

export type CreateSaleResult =
  | { ok: true; sale: typeof sale.$inferSelect; items: (typeof saleItem.$inferSelect)[]; created: boolean }
  | {
      ok: false;
      error:
        | "PRODUCT_NOT_FOUND"
        | "AMOUNT_MISMATCH"
        | "INVALID_PAYMENT"
        | "SHIFT_REQUIRED";
    };

export async function createSale(
  input: CreateSaleDTO,
  soldBy: string,
  db: DbClient,
): Promise<CreateSaleResult> {
  // Idempotent: return existing bill without cutting stock again
  const [existing] = await db
    .select()
    .from(sale)
    .where(eq(sale.clientSaleId, input.clientSaleId))
    .limit(1);

  if (existing) {
    const items = await db
      .select()
      .from(saleItem)
      .where(eq(saleItem.saleId, existing.id));
    return { ok: true, sale: existing, items, created: false };
  }

  const productIds = [...new Set(input.lines.map((l) => l.productId))];
  const productRows = await db
    .select({
      id: product.id,
      name: product.name,
      costPrice: product.costPrice,
      stockQty: product.stockQty,
      deletedAt: product.deletedAt,
    })
    .from(product)
    .where(and(inArray(product.id, productIds), isNull(product.deletedAt)));

  if (productRows.length !== productIds.length) {
    return { ok: false, error: "PRODUCT_NOT_FOUND" };
  }

  const byId = new Map(productRows.map((p) => [p.id, p]));

  const totals = computeCartTotals(
    input.lines.map((l) => ({
      unitPrice: l.unitPrice,
      quantity: l.quantity,
      discount: l.discount ?? null,
    })),
    input.billDiscount ?? null,
  );

  if (input.payment.amountDue !== totals.amountDue) {
    return { ok: false, error: "AMOUNT_MISMATCH" };
  }

  if (input.payment.method === "cash") {
    if (input.payment.amountReceived < input.payment.amountDue) {
      return { ok: false, error: "INVALID_PAYMENT" };
    }
    const expectedChange = input.payment.amountReceived - input.payment.amountDue;
    if (input.payment.changeAmount !== expectedChange) {
      return { ok: false, error: "INVALID_PAYMENT" };
    }
  }

  const soldAt = input.soldAt ?? new Date();
  const billDisc = input.billDiscount ?? null;
  const billKip = billDiscountKip(totals.linesSubtotal, billDisc);
  const shiftId = await resolveOpenShiftId(soldBy, db);
  if (!shiftId) {
    return { ok: false, error: "SHIFT_REQUIRED" };
  }

  return db.transaction(async (tx) => {
    // Race-safe idempotency inside transaction
    const [again] = await tx
      .select()
      .from(sale)
      .where(eq(sale.clientSaleId, input.clientSaleId))
      .limit(1);
    if (again) {
      const items = await tx
        .select()
        .from(saleItem)
        .where(eq(saleItem.saleId, again.id));
      return { ok: true as const, sale: again, items, created: false };
    }

    const [createdSale] = await tx
      .insert(sale)
      .values({
        clientSaleId: input.clientSaleId,
        soldBy,
        shiftId,
        soldAt,
        paymentMethod: input.payment.method,
        amountDue: input.payment.amountDue,
        amountReceived:
          input.payment.method === "cash" ? input.payment.amountReceived : null,
        changeAmount:
          input.payment.method === "cash" ? input.payment.changeAmount : null,
        confirmedByStaff:
          input.payment.method === "transfer" ? true : null,
        slipImageKey:
          input.payment.method === "transfer"
            ? input.payment.slipImageKey
            : null,
        billDiscountType: billDisc?.type ?? null,
        billDiscountValue: billDisc != null ? Math.trunc(billDisc.value) : null,
        billDiscountKip: billKip,
        linesSubtotal: totals.linesSubtotal,
      })
      .returning();

    if (!createdSale) {
      throw new Error("FAILED_TO_CREATE_SALE");
    }

    const itemRows: (typeof saleItem.$inferInsert)[] = input.lines.map((line) => {
      const p = byId.get(line.productId)!;
      const discount = (line.discount ?? null) as LineDiscount | null;
      const discKip = lineDiscountKip(line.unitPrice, line.quantity, discount);
      return {
        saleId: createdSale.id,
        productId: line.productId,
        productName: p.name,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        costPrice: p.costPrice,
        discountType: discount?.type ?? null,
        discountValue: discount != null ? Math.trunc(discount.value) : null,
        discountKip: discKip,
        lineTotal: lineTotal({
          unitPrice: line.unitPrice,
          quantity: line.quantity,
          discount,
        }),
      };
    });

    const insertedItems = await tx.insert(saleItem).values(itemRows).returning();

    // Cut stock (allow going negative so offline sales always sync)
    const now = new Date();
    for (const line of input.lines) {
      const p = byId.get(line.productId)!;
      const stockAfter = p.stockQty - line.quantity;
      await tx
        .update(product)
        .set({ stockQty: stockAfter, updatedAt: now })
        .where(eq(product.id, line.productId));
      // Keep in-memory qty if same product appears twice
      byId.set(line.productId, { ...p, stockQty: stockAfter });
    }

    return {
      ok: true as const,
      sale: createdSale,
      items: insertedItems,
      created: true,
    };
  });
}
