import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatKip } from "@/lib/format-kip";
import { cn } from "@/lib/utils";
import { lineTotal, type DiscountType, type LineDiscount } from "./cart-math";
import { copy } from "./ui-copy";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  unitPrice: number;
  quantity: number;
  initial?: LineDiscount | null;
  onApply: (discount: LineDiscount | null) => void;
};

export function DiscountSheet({
  open,
  onOpenChange,
  title,
  description,
  unitPrice,
  quantity,
  initial,
  onApply,
}: Props) {
  const [type, setType] = useState<DiscountType>("percent");
  const [value, setValue] = useState("0");

  useEffect(() => {
    if (!open) return;
    setType(initial?.type ?? "percent");
    setValue(initial ? String(initial.value) : "0");
  }, [open, initial]);

  const num = Number(value) || 0;
  const discount: LineDiscount = { type, value: num };
  const after = lineTotal({ unitPrice, quantity, discount });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="flex max-h-[85dvh] flex-col gap-0 overflow-hidden p-0"
      >
        <motion.div
          className="flex min-h-0 flex-1 flex-col"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <SheetHeader className="shrink-0 border-b px-4 pt-4 pb-3">
            <SheetTitle className="text-lg">{title}</SheetTitle>
            {description ? (
              <SheetDescription className="truncate">{description}</SheetDescription>
            ) : null}
          </SheetHeader>

          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-4">
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  { id: "percent" as const, label: copy.discountPercent },
                  { id: "amount" as const, label: copy.discountAmount },
                ] as const
              ).map((opt) => (
                <Button
                  key={opt.id}
                  type="button"
                  variant="outline"
                  className={cn(
                    "h-12 rounded-xl text-base",
                    type === opt.id &&
                      "border-primary/40 bg-primary/10 hover:bg-primary/15",
                  )}
                  onClick={() => setType(opt.id)}
                >
                  {opt.label}
                </Button>
              ))}
            </div>

            <div className="space-y-2">
              <Input
                type="number"
                inputMode="decimal"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="font-heading h-14 rounded-xl text-center text-3xl font-semibold tabular-nums"
              />
              <div className="flex flex-wrap justify-center gap-2">
                {(type === "percent" ? [5, 10, 15, 20] : [1000, 2000, 5000, 10000]).map(
                  (n) => (
                    <Button
                      key={n}
                      type="button"
                      size="sm"
                      variant="secondary"
                      className="h-8 rounded-full px-3 tabular-nums"
                      onClick={() => setValue(String(n))}
                    >
                      {type === "percent" ? `${n}%` : formatKip(n)}
                    </Button>
                  ),
                )}
              </div>
            </div>

            <div className="from-muted/70 to-background rounded-2xl bg-linear-to-br p-4 text-center ring-1 ring-foreground/8">
              <p className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
                {copy.discountPreview}
              </p>
              <AnimatePresence mode="wait">
                <motion.p
                  key={after}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="font-heading mt-1 text-3xl font-semibold tabular-nums"
                >
                  {formatKip(after)}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>

          <SheetFooter className="bg-background/95 shrink-0 border-t px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur">
            <div className="flex w-full flex-col gap-2">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 flex-1 rounded-xl"
                  onClick={() => onOpenChange(false)}
                >
                  {copy.cancel}
                </Button>
                <Button
                  type="button"
                  className="h-12 flex-[1.4] rounded-xl"
                  onClick={() => {
                    onApply(num <= 0 ? null : discount);
                    onOpenChange(false);
                  }}
                >
                  {copy.apply}
                </Button>
              </div>
              {initial ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="h-10 rounded-xl"
                  onClick={() => {
                    onApply(null);
                    onOpenChange(false);
                  }}
                >
                  {copy.clearDiscount}
                </Button>
              ) : null}
            </div>
          </SheetFooter>
        </motion.div>
      </SheetContent>
    </Sheet>
  );
}
