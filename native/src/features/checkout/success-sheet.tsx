import { motion } from "motion/react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { resolveFileSrc } from "@/lib/api/file-url";
import { formatKip } from "@/lib/format-kip";
import type { CompletedPayment } from "./pay-sheet";
import { copy } from "./ui-copy";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: CompletedPayment | null;
  onContinue: () => void;
};

export function SuccessSheet({
  open,
  onOpenChange,
  payment,
  onContinue,
}: Props) {
  const slipSrc =
    payment?.method === "transfer"
      ? resolveFileSrc(payment.slipImageKey)
      : null;

  return (
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
                    <p className="text-muted-foreground text-[11px]">{copy.change}</p>
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
                        className="max-h-40 w-full object-contain bg-background"
                      />
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          ) : null}

          <SheetFooter className="px-4 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))]">
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
  );
}
