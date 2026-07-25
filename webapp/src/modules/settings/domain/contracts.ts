import { z } from "zod";

export const ReceiptWidthSchema = z.union([z.literal(58), z.literal(80)]);

export const StoreSettingsSchema = z.object({
  id: z.string(),
  storeName: z.string(),
  address: z.string().nullable(),
  phone: z.string().nullable(),
  logoKey: z.string().nullable(),
  bankName: z.string().nullable(),
  bankAccount: z.string().nullable(),
  qrImageKey: z.string().nullable(),
  receiptWidthMm: ReceiptWidthSchema,
  footerThanks: z.string().nullable(),
  updatedAt: z.coerce.date(),
});

export type StoreSettingsDTO = z.infer<typeof StoreSettingsSchema>;

export const UpdateStoreSettingsSchema = z.object({
  storeName: z.string().trim().min(1).max(120),
  address: z.string().trim().max(500).nullable().optional(),
  phone: z.string().trim().max(40).nullable().optional(),
  logoKey: z.string().trim().max(500).nullable().optional(),
  bankName: z.string().trim().max(120).nullable().optional(),
  bankAccount: z.string().trim().max(80).nullable().optional(),
  qrImageKey: z.string().trim().max(500).nullable().optional(),
  receiptWidthMm: ReceiptWidthSchema,
  footerThanks: z.string().trim().max(200).nullable().optional(),
});

export type UpdateStoreSettingsDTO = z.infer<typeof UpdateStoreSettingsSchema>;

export function toStoreSettingsDTO(row: {
  id: string;
  storeName: string;
  address: string | null;
  phone: string | null;
  logoKey: string | null;
  bankName: string | null;
  bankAccount: string | null;
  qrImageKey: string | null;
  receiptWidthMm: number;
  footerThanks: string | null;
  updatedAt: Date;
}): StoreSettingsDTO {
  const width = row.receiptWidthMm === 58 ? 58 : 80;
  return {
    id: row.id,
    storeName: row.storeName,
    address: row.address,
    phone: row.phone,
    logoKey: row.logoKey,
    bankName: row.bankName,
    bankAccount: row.bankAccount,
    qrImageKey: row.qrImageKey,
    receiptWidthMm: width,
    footerThanks: row.footerThanks,
    updatedAt: row.updatedAt,
  };
}
