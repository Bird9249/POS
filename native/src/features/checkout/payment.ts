export type CashPaymentInput = {
  amountDue: number;
  amountReceived: number;
};

export type CashPaymentResult =
  | { ok: true; changeAmount: number }
  | { ok: false; reason: "INSUFFICIENT" | "INVALID_AMOUNT" };

/** เงินทอน = เงินที่รับ − ยอดที่ต้องชำระ; รับน้อยกว่ายอด → invalid */
export function computeCashChange(input: CashPaymentInput): CashPaymentResult {
  const due = Math.trunc(input.amountDue);
  const received = Math.trunc(input.amountReceived);
  if (!Number.isFinite(due) || due < 0 || !Number.isFinite(received) || received < 0) {
    return { ok: false, reason: "INVALID_AMOUNT" };
  }
  if (received < due) {
    return { ok: false, reason: "INSUFFICIENT" };
  }
  return { ok: true, changeAmount: received - due };
}

export type TransferPaymentInput = {
  confirmedByStaff: boolean;
  /** Uploaded object key for slip image */
  slipImageKey?: string | null;
};

export type TransferPaymentResult =
  | { ok: true }
  | { ok: false; reason: "NOT_CONFIRMED" | "SLIP_REQUIRED" };

/** โอนต้องมี confirmed_by_staff + สลิปที่อัปโหลดแล้ว */
export function validateTransferPayment(
  input: TransferPaymentInput,
): TransferPaymentResult {
  if (!input.confirmedByStaff) {
    return { ok: false, reason: "NOT_CONFIRMED" };
  }
  if (!input.slipImageKey?.trim()) {
    return { ok: false, reason: "SLIP_REQUIRED" };
  }
  return { ok: true };
}
