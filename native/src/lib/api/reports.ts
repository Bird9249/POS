import { apiFetch } from "./fetcher";

export type DailySalesReport = {
  date: string;
  totalSalesKip: number;
  cashSalesKip: number;
  transferSalesKip: number;
  billCount: number;
  itemCount: number;
};

export type ProfitLossReport = {
  from: string;
  to: string;
  revenueKip: number;
  cogsKip: number;
  grossProfitKip: number;
  marginPercent: number | null;
};

export type TopProductRow = {
  rank: number;
  productId: string;
  productName: string;
  quantitySold: number;
  salesKip: number;
  stockQty: number;
};

export type TopProductsReport = {
  from: string;
  to: string;
  items: TopProductRow[];
};

export function fetchDailySales(date?: string) {
  const q = date ? `?date=${encodeURIComponent(date)}` : "";
  return apiFetch<{ report: DailySalesReport }>(
    `/api/reports/daily-sales${q}`,
  );
}

export function fetchProfitLoss(from: string, to: string) {
  const q = new URLSearchParams({ from, to });
  return apiFetch<{ report: ProfitLossReport }>(
    `/api/reports/profit-loss?${q}`,
  );
}

export function fetchTopProducts(from: string, to: string, limit = 10) {
  const q = new URLSearchParams({
    from,
    to,
    limit: String(limit),
  });
  return apiFetch<{ report: TopProductsReport }>(
    `/api/reports/top-products?${q}`,
  );
}
