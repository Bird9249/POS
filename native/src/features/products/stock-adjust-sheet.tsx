import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Minus,
  PackagePlus,
  Plus,
} from "lucide-react";
import { Controller, useForm, useWatch, type Resolver } from "react-hook-form";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api/fetcher";
import {
  adjustStock,
  type Product,
  type StockAdjustType,
} from "@/lib/api/catalog";
import { cn } from "@/lib/utils";
import {
  stockAdjustFormSchema,
  type StockAdjustFormValues,
} from "./product-schema";
import { copy } from "./ui-copy";

type FormValues = StockAdjustFormValues;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
};

const TYPE_OPTIONS: Array<{
  value: StockAdjustType;
  label: string;
  icon: typeof PackagePlus;
  tone: "add" | "sub";
}> = [
  {
    value: "restock",
    label: copy.stockRestock,
    icon: PackagePlus,
    tone: "add",
  },
  {
    value: "increase",
    label: copy.stockIncrease,
    icon: ArrowUpRight,
    tone: "add",
  },
  {
    value: "decrease",
    label: copy.stockDecrease,
    icon: ArrowDownLeft,
    tone: "sub",
  },
];

function previewStock(
  current: number,
  type: StockAdjustType,
  quantity: number,
) {
  if (!Number.isFinite(quantity) || quantity <= 0) return current;
  if (type === "decrease") return Math.max(0, current - quantity);
  return current + quantity;
}

export function StockAdjustSheet({ open, onOpenChange, product }: Props) {
  const qc = useQueryClient();
  const form = useForm<FormValues>({
    resolver: zodResolver(stockAdjustFormSchema) as Resolver<FormValues>,
    values: {
      type: "restock",
      quantity: 1,
      reason: "",
    },
  });

  const type = useWatch({ control: form.control, name: "type" });
  const quantity = useWatch({ control: form.control, name: "quantity" });
  const current = product?.stockQty ?? 0;
  const qtyNum = Number(quantity) || 0;
  const after = previewStock(current, type, qtyNum);
  const wouldGoNegative = type === "decrease" && qtyNum > current;
  const delta = after - current;

  const save = useMutation({
    mutationFn: (values: FormValues) => {
      if (!product) throw new Error("NO_PRODUCT");
      return adjustStock(product.id, {
        type: values.type as StockAdjustType,
        quantity: values.quantity,
        reason: values.reason,
      });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["products"] });
      toast.success(copy.toastStockAdjusted);
      onOpenChange(false);
      form.reset();
    },
    onError: (err) => {
      if (err instanceof ApiError && err.message === "INSUFFICIENT_STOCK") {
        toast.error(copy.stockInsufficient);
        return;
      }
      toast.error(err instanceof Error ? err.message : copy.saveError);
    },
  });

  function bumpQty(deltaBy: number) {
    const next = Math.max(1, (Number(form.getValues("quantity")) || 1) + deltaBy);
    form.setValue("quantity", next, { shouldValidate: true, shouldDirty: true });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="flex max-h-[92dvh] flex-col gap-0 overflow-hidden p-0"
      >
        <motion.div
          className="flex min-h-0 flex-1 flex-col"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22 }}
        >
          <SheetHeader className="shrink-0 border-b px-4 pt-4 pb-3">
            <SheetTitle className="text-lg">{copy.stockAdjustTitle}</SheetTitle>
            <SheetDescription className="truncate">
              {product?.name ?? "—"}
              {product?.barcode ? ` · ${product.barcode}` : ""}
            </SheetDescription>
          </SheetHeader>

          <form
            id="stock-adjust-form"
            className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-4"
            onSubmit={form.handleSubmit((v) => save.mutate(v))}
            noValidate
          >
            {/* Stock preview */}
            <div className="from-muted/70 to-background grid grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-2xl bg-gradient-to-b p-4 ring-1 ring-foreground/8">
              <div className="text-center">
                <p className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
                  {copy.stockCurrent}
                </p>
                <p className="font-heading mt-1 text-3xl font-semibold tabular-nums">
                  {current}
                </p>
              </div>

              <div className="flex flex-col items-center gap-1 px-1">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={`${type}-${qtyNum}`}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className={cn(
                      "rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums",
                      delta > 0 && "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
                      delta < 0 && "bg-destructive/10 text-destructive",
                      delta === 0 && "bg-muted text-muted-foreground",
                    )}
                  >
                    {delta > 0 ? `+${delta}` : delta}
                  </motion.span>
                </AnimatePresence>
                <span className="text-muted-foreground text-[10px]">→</span>
              </div>

              <div className="text-center">
                <p className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
                  {copy.stockAfter}
                </p>
                <p
                  className={cn(
                    "font-heading mt-1 text-3xl font-semibold tabular-nums",
                    wouldGoNegative && "text-destructive",
                    !wouldGoNegative && delta > 0 && "text-emerald-700 dark:text-emerald-400",
                  )}
                >
                  {after}
                </p>
              </div>
            </div>

            <FieldGroup className="gap-5">
              <Controller
                name="type"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>{copy.stockType}</FieldLabel>
                    <div className="grid grid-cols-3 gap-2">
                      {TYPE_OPTIONS.map((opt) => {
                        const active = field.value === opt.value;
                        const Icon = opt.icon;
                        return (
                          <Button
                            key={opt.value}
                            type="button"
                            variant="outline"
                            onClick={() => field.onChange(opt.value)}
                            aria-pressed={active}
                            className={cn(
                              "h-auto min-h-20 flex-col gap-1.5 rounded-xl px-2 py-3 shadow-none",
                              active
                                ? opt.tone === "sub"
                                  ? "border-destructive/40 bg-destructive/8 hover:bg-destructive/10"
                                  : "border-emerald-600/35 bg-emerald-500/10 hover:bg-emerald-500/15"
                                : "text-muted-foreground",
                            )}
                          >
                            <Icon
                              className={cn(
                                "size-5",
                                active &&
                                  (opt.tone === "sub"
                                    ? "text-destructive"
                                    : "text-emerald-700 dark:text-emerald-400"),
                              )}
                            />
                            <span className="text-foreground text-xs leading-tight font-medium whitespace-normal">
                              {opt.label}
                            </span>
                          </Button>
                        );
                      })}
                    </div>
                    {fieldState.invalid ? (
                      <FieldError errors={[fieldState.error]} />
                    ) : null}
                  </Field>
                )}
              />

              <Controller
                name="quantity"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="stock-qty">{copy.quantity}</FieldLabel>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="size-12 shrink-0 rounded-xl"
                        onClick={() => bumpQty(-1)}
                        aria-label="−1"
                      >
                        <Minus className="size-5" />
                      </Button>
                      <Input
                        {...field}
                        id="stock-qty"
                        type="number"
                        inputMode="numeric"
                        min={1}
                        className="font-heading h-12 flex-1 rounded-xl text-center text-2xl font-semibold tabular-nums"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="size-12 shrink-0 rounded-xl"
                        onClick={() => bumpQty(1)}
                        aria-label="+1"
                      >
                        <Plus className="size-5" />
                      </Button>
                    </div>
                    <div className="mt-2 flex justify-center gap-2">
                      {[1, 5, 10, 20].map((n) => (
                        <Button
                          key={n}
                          type="button"
                          size="sm"
                          variant="secondary"
                          className="h-8 rounded-full px-3 tabular-nums"
                          onClick={() =>
                            form.setValue("quantity", n, {
                              shouldValidate: true,
                              shouldDirty: true,
                            })
                          }
                        >
                          {n}
                        </Button>
                      ))}
                    </div>
                    {fieldState.invalid ? (
                      <FieldError errors={[fieldState.error]} />
                    ) : null}
                  </Field>
                )}
              />

              <Controller
                name="reason"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="stock-reason">{copy.reason}</FieldLabel>
                    <Textarea
                      {...field}
                      id="stock-reason"
                      rows={3}
                      placeholder={copy.stockReasonPlaceholder}
                      className="min-h-24 rounded-xl text-base"
                    />
                    {fieldState.invalid ? (
                      <FieldError errors={[fieldState.error]} />
                    ) : null}
                  </Field>
                )}
              />
            </FieldGroup>

            {wouldGoNegative ? (
              <Alert variant="destructive">
                <AlertDescription>{copy.stockInsufficient}</AlertDescription>
              </Alert>
            ) : null}

            {save.isError && !wouldGoNegative ? (
              <Alert variant="destructive">
                <AlertDescription>
                  {save.error instanceof Error
                    ? save.error.message
                    : copy.saveError}
                </AlertDescription>
              </Alert>
            ) : null}
          </form>

          <SheetFooter className="bg-background/95 shrink-0 border-t px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur supports-backdrop-filter:bg-background/80">
            <div className="flex w-full gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-12 flex-1 rounded-xl"
                onClick={() => onOpenChange(false)}
              >
                {copy.cancel}
              </Button>
              <Button
                type="submit"
                form="stock-adjust-form"
                className="h-12 flex-[1.4] rounded-xl text-base"
                disabled={
                  save.isPending || !product || wouldGoNegative || qtyNum < 1
                }
              >
                {save.isPending ? copy.saving : copy.confirmAdjust}
              </Button>
            </div>
          </SheetFooter>
        </motion.div>
      </SheetContent>
    </Sheet>
  );
}
