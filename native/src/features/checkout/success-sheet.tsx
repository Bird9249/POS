import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { CheckCircle2, Printer } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ReceiptPreviewSheet } from "@/features/receipt/receipt-preview-sheet";
import type { ReceiptSaleInput } from "@/features/receipt/render-receipt";
import { receiptCopy } from "@/features/receipt/ui-copy";
import { resolveFileSrc } from "@/lib/api/file-url";
import { getLocalDb } from "@/lib/db/client";
import { formatKip } from "@/lib/format-kip";
import { loadReceiptSettings } from "@/lib/sync/pull-settings";
import type { CompletedPayment } from "./pay-sheet";
import { copy } from "./ui-copy";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: CompletedPayment | null;
  receiptSale: ReceiptSaleInput | null;
  queuedOffline?: boolean;
  onContinue: () => void;
};

export function SuccessSheet({
  open,
  onOpenChange,
  payment,
  receiptSale,
  queuedOffline = false,
  onContinue,
}: Props) {
  const [receiptOpen, setReceiptOpen] = useState(false);
  const store = useQuery({
    queryKey: ["receipt-settings-success"],
    queryFn: async () => loadReceiptSettings(await getLocalDb()),
    enabled: open,
    staleTime: 30_000,
  });

  const slipSrc =
    payment?.method === "transfer"
      ? resolveFileSrc(payment.slipImageKey)
      : null;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className="flex flex-col gap-0 overflow-hidden p-0"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.22 }}
            className="flex flex-col"
          >
            <SheetHeader className="items-center px-4 pt-8 pb-2 text-center">
              <CheckCircle2 className="mb-2 size-14 text-emerald-600" />
              <SheetTitle className="text-xl">{copy.successTitle}</SheetTitle>
            </SheetHeader>

            {payment ? (
              <div className="space-y-3 px-4 py-4">
                <div className="rounded-2xl bg-muted/40 p-4 text-center ring-1 ring-foreground/8">
                  <p className="text-muted-foreground text-xs uppercase">
                    {copy.amountDue}
                  </p>
                  <p className="font-heading mt-1 text-3xl font-semibold tabular-nums">
                    {formatKip(payment.amountDue)}
                  </p>
                </div>
                {payment.method === "cash" ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-muted/30 p-3 text-center">
                      <p className="text-muted-foreground text-[11px]">
                        {copy.amountReceived}
                      </p>
                      <p className="font-heading mt-1 text-lg font-semibold tabular-nums">
                        {formatKip(payment.amountReceived)}
                      </p>
                    </div>
                    <div className="rounded-xl bg-emerald-500/10 p-3 text-center">
                      <p className="text-muted-foreground text-[11px]">
                        {copy.change}
                      </p>
                      <p className="font-heading mt-1 text-lg font-semibold text-emerald-700 tabular-nums dark:text-emerald-400">
                        {formatKip(payment.changeAmount)}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-muted-foreground text-center text-sm">
                      {copy.transfer} · {copy.slipAttached}
                    </p>
                    {slipSrc ? (
                      <div className="overflow-hidden rounded-xl ring-1 ring-foreground/10">
                        <img
                          src={slipSrc}
                          alt=""
                          className="bg-background max-h-40 w-full object-contain"
                        />
                      </div>
                    ) : null}
                  </div>
                )}
                {queuedOffline ? (
                  <p className="text-amber-800 dark:text-amber-300 text-center text-sm text-pretty">
                    {copy.saleQueuedHint}
                  </p>
                ) : null}
              </div>
            ) : null}

            <SheetFooter className="gap-2 px-4 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))] sm:flex-col">
              <Button
                type="button"
                variant="outline"
                className="h-12 w-full gap-2 rounded-xl text-base"
                disabled={!receiptSale}
                onClick={() => setReceiptOpen(true)}
              >
                <Printer className="size-4" />
                {receiptCopy.viewReceipt}
              </Button>
              <Button
                type="button"
                className="h-12 w-full rounded-xl text-base"
                onClick={onContinue}
              >
                {copy.successContinue}
              </Button>
            </SheetFooter>
          </motion.div>
        </SheetContent>
      </Sheet>

      <ReceiptPreviewSheet
        open={receiptOpen}
        onOpenChange={setReceiptOpen}
        store={store.data ?? null}
        sale={receiptSale}
      />
    </>
  );
}
