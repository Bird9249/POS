import { z } from "zod";

/**
 * Draft contract for POST /api/sales (Phase 4 implements persistence).
 * Phase 3 only validates the shape clients will send.
 */
export const SaleLineDiscountSchema = z.object({
  type: z.enum(["percent", "amount"]),
  value: z.number().nonnegative(),
});

export const CreateSaleLineSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive(),
  unitPrice: z.number().int().nonnegative(),
  discount: SaleLineDiscountSchema.nullable().optional(),
});

export const CreateSalePaymentSchema = z.discriminatedUnion("method", [
  z.object({
    method: z.literal("cash"),
    amountDue: z.number().int().nonnegative(),
    amountReceived: z.number().int().nonnegative(),
    changeAmount: z.number().int().nonnegative(),
  }),
  z.object({
    method: z.literal("transfer"),
    amountDue: z.number().int().nonnegative(),
    confirmedByStaff: z.literal(true),
    /** Object key from presigned upload (`uploads/sales/slips/...`) */
    slipImageKey: z.string().trim().min(1),
  }),
]);

export const CreateSaleSchema = z.object({
  clientSaleId: z.string().min(1).max(64),
  billDiscount: SaleLineDiscountSchema.nullable().optional(),
  lines: z.array(CreateSaleLineSchema).min(1),
  payment: CreateSalePaymentSchema,
  soldAt: z.coerce.date().optional(),
});

export type CreateSaleDTO = z.infer<typeof CreateSaleSchema>;
