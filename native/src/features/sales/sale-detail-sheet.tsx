import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";
import { salesCopy as copy } from "@/features/checkout/ui-copy-sales";
import { resolveFileSrc } from "@/lib/api/file-url";
import { getLocalDb } from "@/lib/db/client";
import type {
  SaleItemOutboxRow,
  SalesOutboxRow,
} from "@/lib/db/sales-outbox-repo";
import { formatKip } from "@/lib/format-kip";
import { cn } from "@/lib/utils";
import { loadSaleDetail } from "./load-sale-detail";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sale: SalesOutboxRow | null;
  online: boolean;
};

function statusBadge(status: SalesOutboxRow["status"]) {
  switch (status) {
    case "synced":
      return {
        label: copy.synced,
        className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
      };
    case "failed":
      return {
        label: copy.failed,
        className: "bg-destructive/10 text-destructive",
      };
    case "syncing":
      return {
        label: copy.syncing,
        className: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
      };
    default:
      return {
        label: copy.pending,
        className: "bg-amber-500/15 text-amber-800 dark:text-amber-300",
      };
  }
}

export function SaleDetailSheet({ open, onOpenChange, sale, online }: Props) {
  const detail = useQuery({
    queryKey: ["sale-detail", sale?.client_sale_id, online],
    queryFn: async () => {
      if (!sale) throw new Error("NO_SALE");
      const db = await getLocalDb();
      return loadSaleDetail(db, sale, { online });
    },
    enabled: open && !!sale,
  });

  const badge = sale ? statusBadge(sale.status) : null;
  const payload = detail.data?.payload;
  const items: SaleItemOutboxRow[] = detail.data?.items ?? [];
  const when = sale ? new Date(sale.sold_at) : null;
  const slipSrc =
    payload?.payment.method === "transfer"
      ? resolveFileSrc(payload.payment.slipImageKey)
      : null;

  const linesSubtotal =
    items.length > 0
      ? items.reduce((s: number, i) => s + i.line_total, 0)
      : (payload?.lines.reduce(
          (s: number, l: { unitPrice: number; quantity: number }) =>
            s + l.unitPrice * l.quantity,
          0,
        ) ?? sale?.amount_due ?? 0);
  const billDiscountKip = sale
    ? Math.max(0, linesSubtotal - sale.amount_due)
    : 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="flex max-h-[88vh] flex-col gap-0 overflow-hidden p-0"
      >
        <SheetHeader className="shrink-0 border-b px-4 pt-4 pb-3">
          <div className="flex items-center gap-2">
            <SheetTitle className="text-lg">{copy.detailTitle}</SheetTitle>
            {badge ? (
              <Badge
                variant="secondary"
                className={cn("h-5 px-1.5 text-[10px] leading-none", badge.className)}
              >
                {badge.label}
              </Badge>
            ) : null}
          </div>
          {when && !Number.isNaN(when.getTime()) ? (
            <p className="text-muted-foreground text-xs">
              {copy.soldAt} · {when.toLocaleString("lo-LA")}
            </p>
          ) : null}
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          {detail.isLoading ? (
            <div className="flex h-40 items-center justify-center">
              <Spinner className="size-5" />
            </div>
          ) : detail.isError || !sale ? (
            <p className="text-destructive py-10 text-center text-sm">
              {copy.loadError}
            </p>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              <div className="rounded-2xl bg-muted/40 p-4 text-center ring-1 ring-foreground/8">
                <p className="text-muted-foreground text-xs">{copy.amountDue}</p>
                <p className="font-heading mt-1 text-3xl font-semibold tabular-nums">
                  {formatKip(sale.amount_due)}
                </p>
              </div>

              {sale.error ? (
                <p className="text-destructive rounded-xl bg-destructive/10 px-3 py-2 text-sm">
                  {sale.error}
                </p>
              ) : null}

              {payload?.payment.method === "cash" ? (
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-muted/30 p-3 text-center">
                    <p className="text-muted-foreground text-[11px]">
                      {copy.amountReceived}
                    </p>
                    <p className="font-heading mt-1 text-lg font-semibold tabular-nums">
                      {formatKip(payload.payment.amountReceived)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-emerald-500/10 p-3 text-center">
                    <p className="text-muted-foreground text-[11px]">
                      {copy.change}
                    </p>
                    <p className="font-heading mt-1 text-lg font-semibold text-emerald-700 tabular-nums dark:text-emerald-400">
                      {formatKip(payload.payment.changeAmount)}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm font-medium">{copy.transfer}</p>
                  {slipSrc ? (
                    <div className="overflow-hidden rounded-xl ring-1 ring-foreground/10">
                      <img
                        src={slipSrc}
                        alt={copy.slip}
                        className="bg-background max-h-48 w-full object-contain"
                      />
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-xs">{copy.slip}</p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <p className="text-sm font-medium">
                  {copy.items}
                  {items.length ? ` · ${items.length}` : ""}
                </p>
                {items.length === 0 ? (
                  <p className="text-muted-foreground py-6 text-center text-sm">
                    {copy.noItems}
                  </p>
                ) : (
                  <ul className="divide-y rounded-2xl border">
                    {items.map((item) => (
                      <li
                        key={item.id}
                        className="flex items-start justify-between gap-3 px-3.5 py-3"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {item.product_name}
                          </p>
                          <p className="text-muted-foreground mt-0.5 text-xs tabular-nums">
                            {copy.qty} {item.quantity} · {copy.unitPrice}{" "}
                            {formatKip(item.unit_price)}
                          </p>
                        </div>
                        <p className="font-heading shrink-0 text-sm font-semibold tabular-nums">
                          {formatKip(item.line_total)}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="space-y-1.5 text-sm">
                <div className="text-muted-foreground flex justify-between gap-3">
                  <span>{copy.subtotal}</span>
                  <span className="tabular-nums">{formatKip(linesSubtotal)}</span>
                </div>
                {billDiscountKip > 0 ? (
                  <div className="text-muted-foreground flex justify-between gap-3">
                    <span>{copy.billDiscount}</span>
                    <span className="tabular-nums">
                      −{formatKip(billDiscountKip)}
                    </span>
                  </div>
                ) : null}
                <div className="flex justify-between gap-3 font-medium">
                  <span>{copy.lineTotal}</span>
                  <span className="font-heading tabular-nums">
                    {formatKip(sale.amount_due)}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        <SheetFooter className="bg-background/95 shrink-0 border-t px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur">
          <Button
            type="button"
            variant="outline"
            className="h-11 w-full rounded-xl"
            onClick={() => onOpenChange(false)}
          >
            {copy.close}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
