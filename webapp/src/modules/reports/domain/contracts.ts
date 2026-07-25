import { z } from "zod";

const DateStr = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD");

export const DailySalesQuerySchema = z.object({
  date: DateStr.optional(),
});

export const ProfitLossQuerySchema = z.object({
  from: DateStr,
  to: DateStr,
});

export const TopProductsQuerySchema = z.object({
  from: DateStr,
  to: DateStr,
  limit: z.coerce.number().int().min(1).max(10).default(10),
});

export type DailySalesDTO = {
  date: string;
  totalSalesKip: number;
  cashSalesKip: number;
  transferSalesKip: number;
  billCount: number;
  itemCount: number;
};

export type ProfitLossDTO = {
  from: string;
  to: string;
  revenueKip: number;
  cogsKip: number;
  grossProfitKip: number;
  marginPercent: number | null;
};

export type TopProductRowDTO = {
  rank: number;
  productId: string;
  productName: string;
  quantitySold: number;
  salesKip: number;
  stockQty: number;
};

export type TopProductsDTO = {
  from: string;
  to: string;
  items: TopProductRowDTO[];
};
