import { z } from "zod";

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

export const ListSalesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().optional(),
});

export type ListSalesQueryDTO = z.infer<typeof ListSalesQuerySchema>;

export const SaleItemSchema = z.object({
  id: z.string(),
  productId: z.string(),
  productName: z.string(),
  quantity: z.number().int(),
  unitPrice: z.number().int(),
  costPrice: z.number().int().optional(),
  discountType: z.string().nullable(),
  discountValue: z.number().nullable(),
  discountKip: z.number().int(),
  lineTotal: z.number().int(),
});

export const SaleSchema = z.object({
  id: z.string(),
  clientSaleId: z.string(),
  soldBy: z.string(),
  soldAt: z.coerce.date(),
  paymentMethod: z.enum(["cash", "transfer"]),
  amountDue: z.number().int(),
  amountReceived: z.number().int().nullable(),
  changeAmount: z.number().int().nullable(),
  confirmedByStaff: z.boolean().nullable(),
  slipImageKey: z.string().nullable(),
  billDiscountType: z.string().nullable(),
  billDiscountValue: z.number().nullable(),
  billDiscountKip: z.number().int(),
  linesSubtotal: z.number().int(),
  items: z.array(SaleItemSchema).optional(),
});

export type SaleDTO = z.infer<typeof SaleSchema>;

export function toSaleDTO(
  row: {
    id: string;
    clientSaleId: string;
    soldBy: string;
    soldAt: Date;
    paymentMethod: string;
    amountDue: number;
    amountReceived: number | null;
    changeAmount: number | null;
    confirmedByStaff: boolean | null;
    slipImageKey: string | null;
    billDiscountType: string | null;
    billDiscountValue: number | null;
    billDiscountKip: number;
    linesSubtotal: number;
  },
  items?: Array<{
    id: string;
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    costPrice: number;
    discountType: string | null;
    discountValue: number | null;
    discountKip: number;
    lineTotal: number;
  }>,
  opts?: { includeCost?: boolean },
): SaleDTO {
  return {
    id: row.id,
    clientSaleId: row.clientSaleId,
    soldBy: row.soldBy,
    soldAt: row.soldAt,
    paymentMethod: row.paymentMethod as "cash" | "transfer",
    amountDue: row.amountDue,
    amountReceived: row.amountReceived,
    changeAmount: row.changeAmount,
    confirmedByStaff: row.confirmedByStaff,
    slipImageKey: row.slipImageKey,
    billDiscountType: row.billDiscountType,
    billDiscountValue: row.billDiscountValue,
    billDiscountKip: row.billDiscountKip,
    linesSubtotal: row.linesSubtotal,
    items: items?.map((it) => ({
      id: it.id,
      productId: it.productId,
      productName: it.productName,
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      costPrice: opts?.includeCost ? it.costPrice : undefined,
      discountType: it.discountType,
      discountValue: it.discountValue,
      discountKip: it.discountKip,
      lineTotal: it.lineTotal,
    })),
  };
}
