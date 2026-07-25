import { apiFetch } from "./fetcher";

export type ShiftSummary = {
  totalSalesKip: number;
  cashSalesKip: number;
  transferSalesKip: number;
  expectedCashKip: number;
  billCount: number;
  itemCount: number;
};

export type Shift = {
  id: string;
  openedBy: string;
  openedAt: string;
  closedAt: string | null;
  status: "open" | "closed";
  expectedCashKip: number | null;
  countedCashKip: number | null;
  cashDiffKip: number | null;
  totalSalesKip: number | null;
  cashSalesKip: number | null;
  transferSalesKip: number | null;
  billCount: number | null;
  note: string | null;
  summary?: ShiftSummary;
};

export function getCurrentShift() {
  return apiFetch<{ shift: Shift | null }>("/api/shifts/current");
}

export function openShift() {
  return apiFetch<{ shift: Shift; created: boolean }>("/api/shifts/open", {
    method: "POST",
  });
}

export function fetchXReport(shiftId: string) {
  return apiFetch<{ report: "x"; shift: Shift }>(
    `/api/shifts/${encodeURIComponent(shiftId)}/x-report`,
  );
}

export function closeShiftZ(
  shiftId: string,
  input: { countedCashKip: number; note?: string },
) {
  return apiFetch<{ report: "z"; shift: Shift }>(
    `/api/shifts/${encodeURIComponent(shiftId)}/z-report`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );
}

export function listShifts(opts?: { limit?: number; cursor?: string }) {
  const q = new URLSearchParams();
  if (opts?.limit) q.set("limit", String(opts.limit));
  if (opts?.cursor) q.set("cursor", opts.cursor);
  const qs = q.toString();
  return apiFetch<{ items: Shift[]; nextCursor: string | null }>(
    `/api/shifts${qs ? `?${qs}` : ""}`,
  );
}
