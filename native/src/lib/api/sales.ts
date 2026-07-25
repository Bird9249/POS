import { apiFetch } from "./fetcher";
import type { SaleApiPayload } from "@/features/checkout/build-sale-payload";

export type SaleDTO = {
  id: string;
  clientSaleId: string;
  soldBy: string;
  soldAt: string;
  paymentMethod: "cash" | "transfer";
  amountDue: number;
  amountReceived: number | null;
  changeAmount: number | null;
  slipImageKey: string | null;
  billDiscountKip: number;
  linesSubtotal: number;
  items?: Array<{
    id: string;
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
};

export function createSale(payload: SaleApiPayload) {
  return apiFetch<{ sale: SaleDTO; created: boolean }>("/api/sales", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function listSales(params?: { limit?: number; cursor?: string | null }) {
  const qs = new URLSearchParams();
  if (params?.limit) qs.set("limit", String(params.limit));
  if (params?.cursor) qs.set("cursor", params.cursor);
  const q = qs.toString();
  return apiFetch<{ items: SaleDTO[]; nextCursor: string | null }>(
    `/api/sales${q ? `?${q}` : ""}`,
  );
}

export function getSale(id: string) {
  return apiFetch<{ sale: SaleDTO }>(`/api/sales/${encodeURIComponent(id)}`);
}
