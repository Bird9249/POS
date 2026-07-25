import * as z from "zod";

export const receiptSettingsSchema = z.object({
  storeName: z.string().trim().min(1, "ກະລຸນາໃສ່ຊື່ຮ້ານ"),
  address: z.string().optional().default(""),
  phone: z.string().optional().default(""),
  bankName: z.string().optional().default(""),
  bankAccount: z.string().optional().default(""),
  logoKey: z.string().optional().default(""),
  qrImageKey: z.string().optional().default(""),
  receiptWidthMm: z.union([z.literal(58), z.literal(80)]),
  footerThanks: z.string().optional().default(""),
});

export type ReceiptSettingsFormValues = z.infer<typeof receiptSettingsSchema>;
