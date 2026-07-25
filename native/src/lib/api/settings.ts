import { apiFetch } from "./fetcher";

export type ReceiptWidthMm = 58 | 80;

export type StoreSettings = {
  id: string;
  storeName: string;
  address: string | null;
  phone: string | null;
  logoKey: string | null;
  bankName: string | null;
  bankAccount: string | null;
  qrImageKey: string | null;
  receiptWidthMm: ReceiptWidthMm;
  footerThanks: string | null;
  updatedAt: string;
};

export type UpdateStoreSettingsInput = {
  storeName: string;
  address?: string | null;
  phone?: string | null;
  logoKey?: string | null;
  bankName?: string | null;
  bankAccount?: string | null;
  qrImageKey?: string | null;
  receiptWidthMm: ReceiptWidthMm;
  footerThanks?: string | null;
};

export function getReceiptSettings() {
  return apiFetch<{ settings: StoreSettings }>("/api/settings/receipt");
}

export function updateReceiptSettings(input: UpdateStoreSettingsInput) {
  return apiFetch<{ settings: StoreSettings }>("/api/settings/receipt", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}
