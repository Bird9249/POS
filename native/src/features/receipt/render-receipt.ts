import type { ReceiptWidthMm, StoreSettings } from "@/lib/api/settings";
import { formatKip } from "@/lib/format-kip";

export type ReceiptLineItem = {
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type ReceiptPayment =
  | {
      method: "cash";
      amountDue: number;
      amountReceived: number;
      changeAmount: number;
    }
  | {
      method: "transfer";
      amountDue: number;
    };

export type ReceiptSaleInput = {
  clientSaleId: string;
  soldAt: string | Date;
  cashierName?: string | null;
  lines: ReceiptLineItem[];
  linesSubtotal: number;
  billDiscountKip?: number;
  payment: ReceiptPayment;
};

export type RenderedReceipt = {
  widthMm: ReceiptWidthMm;
  widthChars: number;
  lines: string[];
  text: string;
};

const WIDTH_CHARS: Record<ReceiptWidthMm, number> = {
  58: 32,
  80: 48,
};

function padCenter(text: string, width: number) {
  const t = text.slice(0, width);
  const space = width - [...t].length;
  if (space <= 0) return t;
  const left = Math.floor(space / 2);
  return `${" ".repeat(left)}${t}${" ".repeat(space - left)}`;
}

function padRow(left: string, right: string, width: number) {
  const l = left;
  const r = right;
  const gap = width - [...l].length - [...r].length;
  if (gap >= 1) return `${l}${" ".repeat(gap)}${r}`;
  const maxLeft = Math.max(4, width - [...r].length - 1);
  return `${[...l].slice(0, maxLeft).join("")} ${r}`.slice(0, width);
}

function divider(width: number, ch = "-") {
  return ch.repeat(width);
}

function wrapName(name: string, width: number): string[] {
  const chars = [...name];
  if (chars.length <= width) return [name];
  const out: string[] = [];
  for (let i = 0; i < chars.length; i += width) {
    out.push(chars.slice(i, i + width).join(""));
  }
  return out;
}

function formatWhen(soldAt: string | Date) {
  const d = typeof soldAt === "string" ? new Date(soldAt) : soldAt;
  if (Number.isNaN(d.getTime())) return String(soldAt);
  return d.toLocaleString("lo-LA");
}

/** Build monospace receipt text for thermal 58/80mm. */
export function renderReceipt(input: {
  store: Pick<
    StoreSettings,
    | "storeName"
    | "address"
    | "phone"
    | "bankName"
    | "bankAccount"
    | "receiptWidthMm"
    | "footerThanks"
  >;
  sale: ReceiptSaleInput;
  widthMm?: ReceiptWidthMm;
}): RenderedReceipt {
  const widthMm =
    input.widthMm ??
    (input.store.receiptWidthMm === 58 ? 58 : 80);
  const width = WIDTH_CHARS[widthMm];
  const lines: string[] = [];
  const push = (s: string) => lines.push(s);

  const storeName = input.store.storeName?.trim() || "POS";
  push(padCenter(storeName, width));
  if (input.store.address?.trim()) {
    for (const row of wrapName(input.store.address.trim(), width)) {
      push(padCenter(row, width));
    }
  }
  if (input.store.phone?.trim()) {
    push(padCenter(input.store.phone.trim(), width));
  }
  push(divider(width));
  push(padRow("Bill", input.sale.clientSaleId.slice(0, width - 6), width));
  push(padRow("Date", formatWhen(input.sale.soldAt).slice(0, width - 6), width));
  if (input.sale.cashierName?.trim()) {
    push(
      padRow(
        "Cashier",
        input.sale.cashierName.trim().slice(0, width - 9),
        width,
      ),
    );
  }
  push(divider(width));

  for (const item of input.sale.lines) {
    for (const row of wrapName(item.name, width)) push(row);
    push(
      padRow(
        `  ${item.quantity} x ${formatKip(item.unitPrice)}`,
        formatKip(item.lineTotal),
        width,
      ),
    );
  }

  push(divider(width));
  push(padRow("Subtotal", formatKip(input.sale.linesSubtotal), width));
  const disc = input.sale.billDiscountKip ?? 0;
  if (disc > 0) {
    push(padRow("Discount", `-${formatKip(disc)}`, width));
  }
  push(padRow("TOTAL", formatKip(input.sale.payment.amountDue), width));
  push(divider(width));

  if (input.sale.payment.method === "cash") {
    push(padRow("Cash", formatKip(input.sale.payment.amountReceived), width));
    push(padRow("Change", formatKip(input.sale.payment.changeAmount), width));
  } else {
    push(padCenter("Transfer / QR", width));
    if (input.store.bankName?.trim()) {
      push(padCenter(input.store.bankName.trim(), width));
    }
    if (input.store.bankAccount?.trim()) {
      push(padCenter(input.store.bankAccount.trim(), width));
    }
  }

  push(divider(width));
  const thanks =
    input.store.footerThanks?.trim() || "Thank you";
  for (const row of wrapName(thanks, width)) {
    push(padCenter(row, width));
  }

  return {
    widthMm,
    widthChars: width,
    lines,
    text: lines.join("\n"),
  };
}

export function receiptWidthChars(widthMm: ReceiptWidthMm) {
  return WIDTH_CHARS[widthMm];
}
