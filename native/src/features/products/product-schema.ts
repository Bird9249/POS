import * as z from "zod";

export const productFormSchema = z.object({
  name: z.string().trim().min(1, 'ກະລຸນາໃສ່ຊື່ສິນຄ້າ'),
  barcode: z.string().optional().default(""),
  sku: z.string().optional().default(""),
  categoryId: z.string().optional().default(""),
  sellPrice: z.coerce.number().int().min(0, 'ລາຄາຂາຍຕ້ອງ ≥ 0'),
  costPrice: z.coerce.number().int().min(0, 'ລາຄາທຶນຕ້ອງ ≥ 0'),
  stockQty: z.coerce.number().int().min(0, 'ສະຕັອກຕ້ອງ ≥ 0'),
  minStock: z.string().optional().default(""),
  image: z.string().optional().default(""),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;

export const categoryFormSchema = z.object({
  name: z.string().trim().min(1, 'ກະລຸນາໃສ່ຊື່ຫມວດຫມູ່'),
});

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;
