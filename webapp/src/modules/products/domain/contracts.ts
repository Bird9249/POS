import { z } from "zod";

export const ProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  image: z.string().nullable(),
  barcode: z.string().nullable(),
  sku: z.string().nullable(),
  costPrice: z.number().int().optional(),
  sellPrice: z.number().int(),
  categoryId: z.string().nullable(),
  categoryName: z.string().nullable().optional(),
  stockQty: z.number().int(),
  minStock: z.number().int().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  deletedAt: z.coerce.date().nullable().optional(),
});
export type ProductDTO = z.infer<typeof ProductSchema>;

const emptyToNull = (v: unknown) =>
  typeof v === "string" && v.trim() === "" ? null : v;

export const CreateProductSchema = z.object({
  name: z.string().trim().min(1).max(200),
  image: z.preprocess(emptyToNull, z.string().nullable().optional()),
  barcode: z.preprocess(emptyToNull, z.string().trim().max(64).nullable().optional()),
  sku: z.preprocess(emptyToNull, z.string().trim().max(64).nullable().optional()),
  costPrice: z.coerce.number().int().min(0),
  sellPrice: z.coerce.number().int().min(0),
  categoryId: z.preprocess(emptyToNull, z.string().nullable().optional()),
  stockQty: z.coerce.number().int().default(0),
  minStock: z.preprocess(
    emptyToNull,
    z.coerce.number().int().min(0).nullable().optional(),
  ),
});
export type CreateProductDTO = z.infer<typeof CreateProductSchema>;

export const UpdateProductSchema = CreateProductSchema.partial();
export type UpdateProductDTO = z.infer<typeof UpdateProductSchema>;

export const ListProductsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().optional(),
  q: z.string().optional(),
  categoryId: z.string().optional(),
  lowStock: z
    .union([z.literal("1"), z.literal("true"), z.literal("0"), z.literal("false")])
    .optional()
    .transform((v) => v === "1" || v === "true"),
});
export type ListProductsQueryDTO = z.infer<typeof ListProductsQuerySchema>;

export const IdParamSchema = z.object({ id: z.string().min(1) });

export type ProductRow = {
  id: string;
  name: string;
  image: string | null;
  barcode: string | null;
  sku: string | null;
  costPrice: number;
  sellPrice: number;
  categoryId: string | null;
  categoryName?: string | null;
  stockQty: number;
  minStock: number | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

export function toProductDTO(
  row: ProductRow,
  opts: { includeCost: boolean },
): ProductDTO {
  const base: ProductDTO = {
    id: row.id,
    name: row.name,
    image: row.image,
    barcode: row.barcode,
    sku: row.sku,
    sellPrice: row.sellPrice,
    categoryId: row.categoryId,
    categoryName: row.categoryName ?? null,
    stockQty: row.stockQty,
    minStock: row.minStock,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
  };
  if (opts.includeCost) {
    base.costPrice = row.costPrice;
  }
  return base;
}
