import { z } from "zod";

export const CloseShiftSchema = z.object({
  countedCashKip: z.number().int().nonnegative(),
  note: z.string().trim().max(500).optional(),
});

export type CloseShiftDTO = z.infer<typeof CloseShiftSchema>;

export const ListShiftsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().optional(),
});

export type ShiftSummaryDTO = {
  totalSalesKip: number;
  cashSalesKip: number;
  transferSalesKip: number;
  /** Cash expected in drawer: Σ (amountReceived − change) for cash bills. */
  expectedCashKip: number;
  billCount: number;
  itemCount: number;
};

export type ShiftDTO = {
  id: string;
  openedBy: string;
  openedAt: Date;
  closedAt: Date | null;
  status: "open" | "closed";
  expectedCashKip: number | null;
  countedCashKip: number | null;
  cashDiffKip: number | null;
  totalSalesKip: number | null;
  cashSalesKip: number | null;
  transferSalesKip: number | null;
  billCount: number | null;
  note: string | null;
  summary?: ShiftSummaryDTO;
};

export function toShiftDTO(
  row: {
    id: string;
    openedBy: string;
    openedAt: Date;
    closedAt: Date | null;
    status: string;
    expectedCashKip: number | null;
    countedCashKip: number | null;
    cashDiffKip: number | null;
    totalSalesKip: number | null;
    cashSalesKip: number | null;
    transferSalesKip: number | null;
    billCount: number | null;
    note: string | null;
  },
  summary?: ShiftSummaryDTO,
): ShiftDTO {
  return {
    id: row.id,
    openedBy: row.openedBy,
    openedAt: row.openedAt,
    closedAt: row.closedAt,
    status: row.status === "closed" ? "closed" : "open",
    expectedCashKip: row.expectedCashKip,
    countedCashKip: row.countedCashKip,
    cashDiffKip: row.cashDiffKip,
    totalSalesKip: row.totalSalesKip,
    cashSalesKip: row.cashSalesKip,
    transferSalesKip: row.transferSalesKip,
    billCount: row.billCount,
    note: row.note,
    summary,
  };
}
