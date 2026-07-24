import * as z from "zod";
import { zNonNegativeInt, zPositiveInt } from "@/lib/zod/lao-locale";

export const productFormSchema = z.object({
  name: z.string().trim().min(1, "ກະລຸນາໃສ່ຊື່ສິນຄ້າ"),
  barcode: z.string().optional().default(""),
  sku: z.string().optional().default(""),
  categoryId: z.string().optional().default(""),
  sellPrice: zNonNegativeInt("ລາຄາຂາຍ"),
  costPrice: zNonNegativeInt("ລາຄາທຶນ"),
  stockQty: zNonNegativeInt("ສະຕັອກ"),
  minStock: z
    .string()
    .optional()
    .default("")
    .refine(
      (v) => {
        const t = v.trim();
        if (t === "") return true;
        if (!/^\d+$/.test(t)) return false;
        return Number.parseInt(t, 10) >= 0;
      },
      { message: "ສະຕັອກຕ່ຳສຸດຕ້ອງເປັນຈຳນວນເຕັມ ≥ 0" },
    ),
  image: z.string().optional().default(""),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;

export const categoryFormSchema = z.object({
  name: z.string().trim().min(1, "ກະລຸນາໃສ່ຊື່ຫມວດຫມູ່"),
});

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;

export const stockAdjustFormSchema = z.object({
  type: z.enum(["restock", "increase", "decrease"]),
  quantity: zPositiveInt("ຈຳນວນ"),
  reason: z.string().trim().min(1, "ກະລຸນາໃສ່ເຫດຜົນ"),
});

export type StockAdjustFormValues = z.infer<typeof stockAdjustFormSchema>;
