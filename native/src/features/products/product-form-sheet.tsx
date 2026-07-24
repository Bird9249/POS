import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import {
  AlertTriangle,
  Minus,
  Package,
  Plus,
  Trash2,
} from "lucide-react";
import { Controller, useForm, useWatch, type Resolver } from "react-hook-form";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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
import { ApiError } from "@/lib/api/fetcher";
import { formatKip } from "@/lib/format-kip";
import {
  createProduct,
  deleteProduct,
  listCategories,
  updateProduct,
  uploadProductImage,
  type Category,
  type Product,
} from "@/lib/api/catalog";
import { resolveFileSrc } from "@/lib/api/file-url";
import { cn } from "@/lib/utils";
import { BarcodeField } from "./barcode-field";
import { ProductImageField } from "./product-image-field";
import {
  productFormSchema,
  type ProductFormValues,
} from "./product-schema";
import { copy } from "./ui-copy";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
  canEditCost: boolean;
  onAdjustStock?: (product: Product) => void;
};

function FormSection({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        {hint ? (
          <p className="text-muted-foreground mt-0.5 text-xs">{hint}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function bumpInt(
  current: number,
  delta: number,
  min = 0,
) {
  return Math.max(min, (Number.isFinite(current) ? current : 0) + delta);
}

export function ProductFormSheet({
  open,
  onOpenChange,
  product,
  canEditCost,
  onAdjustStock,
}: Props) {
  const qc = useQueryClient();
  const [apiError, setApiError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const categories = useQuery({
    queryKey: ["categories"],
    queryFn: listCategories,
    enabled: open,
  });

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(
      productFormSchema,
    ) as Resolver<ProductFormValues>,
    values: {
      name: product?.name ?? "",
      barcode: product?.barcode ?? "",
      sku: product?.sku ?? "",
      categoryId: product?.categoryId ?? "",
      sellPrice: product?.sellPrice ?? 0,
      costPrice: product?.costPrice ?? 0,
      stockQty: product?.stockQty ?? 0,
      minStock: product?.minStock != null ? String(product.minStock) : "",
      image: product?.image ?? "",
    },
  });

  const watchedName = useWatch({ control: form.control, name: "name" });
  const watchedSell = useWatch({ control: form.control, name: "sellPrice" });
  const watchedStock = useWatch({ control: form.control, name: "stockQty" });
  const watchedMin = useWatch({ control: form.control, name: "minStock" });
  const watchedImage = useWatch({ control: form.control, name: "image" });
  const watchedCategoryId = useWatch({
    control: form.control,
    name: "categoryId",
  });

  const categoryItems = categories.data?.items ?? [];
  const categoryName =
    categoryItems.find((c: Category) => c.id === watchedCategoryId)?.name ??
    product?.categoryName ??
    null;

  const minStockNum = (() => {
    const t = (watchedMin ?? "").trim();
    if (t === "") return null;
    const n = Number.parseInt(t, 10);
    return Number.isNaN(n) ? null : n;
  })();

  const stockDisplay = product ? product.stockQty : Number(watchedStock) || 0;
  const isLow =
    minStockNum != null && stockDisplay < minStockNum;

  const previewSrc = resolveFileSrc(watchedImage ?? "", null);
  const sellPreview = Number(watchedSell);
  const sellLabel = Number.isFinite(sellPreview)
    ? formatKip(sellPreview)
    : formatKip(0);

  const save = useMutation({
    mutationFn: async (values: ProductFormValues) => {
      const minStockRaw = values.minStock?.trim() ?? "";
      const minStock =
        minStockRaw === "" ? null : Number.parseInt(minStockRaw, 10);
      const body = {
        name: values.name,
        barcode: values.barcode?.trim() || null,
        sku: values.sku?.trim() || null,
        categoryId: values.categoryId?.trim() || null,
        sellPrice: values.sellPrice,
        costPrice: values.costPrice,
        stockQty: product ? product.stockQty : values.stockQty,
        minStock,
        image: values.image?.trim() || null,
      };
      if (product) return updateProduct(product.id, body);
      return createProduct(body);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["products"] });
      await qc.invalidateQueries({ queryKey: ["categories"] });
      toast.success(product ? copy.toastProductUpdated : copy.toastProductCreated);
      onOpenChange(false);
      form.reset();
      setApiError(null);
    },
    onError: (err) => {
      if (err instanceof ApiError && err.message === "BARCODE_DUPLICATE") {
        setApiError(copy.barcodeDup);
        toast.error(copy.barcodeDup);
        return;
      }
      const msg = err instanceof Error ? err.message : copy.saveError;
      setApiError(msg);
      toast.error(msg);
    },
  });

  async function onPickImage(file: File) {
    setUploading(true);
    setApiError(null);
    try {
      const key = await uploadProductImage(file);
      if (!key) {
        setApiError(copy.saveError);
        form.setValue("image", "", { shouldDirty: true });
        return;
      }
      form.setValue("image", key, { shouldDirty: true });
    } finally {
      setUploading(false);
    }
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
            <SheetTitle className="text-lg">
              {product ? copy.editProduct : copy.addProduct}
            </SheetTitle>
            <SheetDescription className="truncate">
              {product
                ? [product.barcode, product.sku].filter(Boolean).join(" · ") ||
                  copy.formStockEditHint
                : copy.formNewHint}
            </SheetDescription>
          </SheetHeader>

          <form
            id="product-form"
            className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-4"
            onSubmit={form.handleSubmit((v) => {
              setApiError(null);
              save.mutate(v);
            })}
            noValidate
          >
            {/* Live preview */}
            <div className="from-muted/70 to-background flex gap-3 rounded-2xl bg-gradient-to-br p-4 ring-1 ring-foreground/8">
              <div
                className={cn(
                  "bg-muted/50 relative size-20 shrink-0 overflow-hidden rounded-xl ring-1 ring-foreground/10",
                  !previewSrc && "flex items-center justify-center",
                )}
              >
                {previewSrc ? (
                  <img
                    src={previewSrc}
                    alt=""
                    className="size-full object-cover"
                  />
                ) : (
                  <Package className="text-muted-foreground size-8" />
                )}
              </div>
              <div className="min-w-0 flex-1 space-y-1.5">
                <p className="font-heading line-clamp-2 text-lg leading-snug font-semibold">
                  {watchedName?.trim() || copy.name}
                </p>
                <p className="text-primary text-base font-semibold tabular-nums">
                  {sellLabel}
                </p>
                <div className="flex flex-wrap items-center gap-1.5">
                  {categoryName ? (
                    <Badge variant="secondary" className="max-w-full truncate">
                      {categoryName}
                    </Badge>
                  ) : null}
                  {isLow ? (
                    <Badge className="gap-1 bg-amber-600/90 hover:bg-amber-600/90">
                      <AlertTriangle className="size-3" />
                      {copy.lowStockBadge}
                    </Badge>
                  ) : null}
                  <span className="text-muted-foreground text-xs tabular-nums">
                    {copy.stock} {stockDisplay}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-muted/25 p-4 ring-1 ring-foreground/6">
              <ProductImageField
                value={form.watch("image") ?? ""}
                uploading={uploading}
                disabled={save.isPending}
                onError={setApiError}
                onPick={(file) => void onPickImage(file)}
                onClear={() =>
                  form.setValue("image", "", { shouldDirty: true })
                }
              />
            </div>

            <FormSection title={copy.formSectionBasic}>
              <FieldGroup className="gap-3">
                <Controller
                  name="name"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="p-name">{copy.name}</FieldLabel>
                      <Input
                        {...field}
                        id="p-name"
                        className="h-12 rounded-xl text-base"
                        placeholder={copy.name}
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.invalid ? (
                        <FieldError errors={[fieldState.error]} />
                      ) : null}
                    </Field>
                  )}
                />
                <Controller
                  name="barcode"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="p-barcode">{copy.barcode}</FieldLabel>
                      <BarcodeField
                        id="p-barcode"
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.invalid ? (
                        <FieldError errors={[fieldState.error]} />
                      ) : null}
                    </Field>
                  )}
                />
                <Controller
                  name="sku"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="p-sku">{copy.sku}</FieldLabel>
                      <Input
                        {...field}
                        id="p-sku"
                        className="h-11 rounded-xl"
                        autoComplete="off"
                        aria-invalid={fieldState.invalid}
                      />
                    </Field>
                  )}
                />
                <Controller
                  name="categoryId"
                  control={form.control}
                  render={({ field }) => (
                    <Field>
                      <FieldLabel>{copy.category}</FieldLabel>
                      <div className="flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        <CategoryChip
                          active={!field.value}
                          onClick={() => field.onChange("")}
                        >
                          {copy.noCategory}
                        </CategoryChip>
                        {categoryItems.map((c: Category) => (
                          <CategoryChip
                            key={c.id}
                            active={field.value === c.id}
                            onClick={() => field.onChange(c.id)}
                          >
                            {c.name}
                          </CategoryChip>
                        ))}
                      </div>
                    </Field>
                  )}
                />
              </FieldGroup>
            </FormSection>

            <FormSection title={copy.formSectionPrice} hint={copy.formPriceHint}>
              <div
                className={cn(
                  "grid gap-3",
                  canEditCost ? "grid-cols-2" : "grid-cols-1",
                )}
              >
                <Controller
                  name="sellPrice"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="p-sell">{copy.sellPrice}</FieldLabel>
                      <Input
                        {...field}
                        id="p-sell"
                        type="number"
                        inputMode="numeric"
                        className="font-heading h-12 rounded-xl text-center text-xl font-semibold tabular-nums"
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.invalid ? (
                        <FieldError errors={[fieldState.error]} />
                      ) : null}
                    </Field>
                  )}
                />
                {canEditCost ? (
                  <Controller
                    name="costPrice"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="p-cost">
                          {copy.costPrice}
                        </FieldLabel>
                        <Input
                          {...field}
                          id="p-cost"
                          type="number"
                          inputMode="numeric"
                          className="font-heading h-12 rounded-xl text-center text-xl font-semibold tabular-nums"
                          aria-invalid={fieldState.invalid}
                        />
                        {fieldState.invalid ? (
                          <FieldError errors={[fieldState.error]} />
                        ) : null}
                      </Field>
                    )}
                  />
                ) : null}
              </div>
            </FormSection>

            <FormSection
              title={copy.formSectionStock}
              hint={product ? copy.formStockEditHint : undefined}
            >
              {product ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 rounded-2xl bg-muted/40 p-4 ring-1 ring-foreground/8">
                    <div>
                      <p className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
                        {copy.stock}
                      </p>
                      <p className="font-heading mt-1 text-3xl font-semibold tabular-nums">
                        {product.stockQty}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
                        {copy.minStock}
                      </p>
                      <p className="font-heading mt-1 text-3xl font-semibold tabular-nums">
                        {minStockNum ?? "—"}
                      </p>
                    </div>
                  </div>
                  {onAdjustStock ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="h-11 w-full rounded-xl"
                      disabled={save.isPending}
                      onClick={() => onAdjustStock(product)}
                    >
                      {copy.adjustStock}
                    </Button>
                  ) : null}
                  <Controller
                    name="minStock"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="p-min">{copy.minStock}</FieldLabel>
                        <Input
                          {...field}
                          id="p-min"
                          type="number"
                          inputMode="numeric"
                          className="font-heading h-11 rounded-xl tabular-nums"
                          value={field.value ?? ""}
                          aria-invalid={fieldState.invalid}
                        />
                        {fieldState.invalid ? (
                          <FieldError errors={[fieldState.error]} />
                        ) : null}
                      </Field>
                    )}
                  />
                </div>
              ) : (
                <FieldGroup className="gap-4">
                  <Controller
                    name="stockQty"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="p-stock">{copy.stock}</FieldLabel>
                        <QtyStepper
                          id="p-stock"
                          value={Number(field.value) || 0}
                          onChange={(n) => field.onChange(n)}
                          min={0}
                        />
                        {fieldState.invalid ? (
                          <FieldError errors={[fieldState.error]} />
                        ) : null}
                      </Field>
                    )}
                  />
                  <Controller
                    name="minStock"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="p-min">{copy.minStock}</FieldLabel>
                        <QtyStepper
                          id="p-min"
                          value={
                            field.value?.trim() === ""
                              ? 0
                              : Number.parseInt(field.value ?? "0", 10) || 0
                          }
                          onChange={(n) =>
                            field.onChange(n === 0 ? "" : String(n))
                          }
                          min={0}
                          allowEmptyZero
                          emptyLabel="—"
                        />
                        {fieldState.invalid ? (
                          <FieldError errors={[fieldState.error]} />
                        ) : null}
                      </Field>
                    )}
                  />
                </FieldGroup>
              )}
            </FormSection>

            {product ? (
              <FormSection title={copy.formDangerZone}>
                <Button
                  type="button"
                  variant="outline"
                  className="text-destructive hover:text-destructive h-11 w-full rounded-xl border-destructive/30"
                  disabled={save.isPending || deleting}
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 data-icon="inline-start" />
                  {copy.delete}
                </Button>
              </FormSection>
            ) : null}

            {apiError ? (
              <Alert variant="destructive">
                <AlertDescription>{apiError}</AlertDescription>
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
                form="product-form"
                className="h-12 flex-[1.4] rounded-xl text-base"
                disabled={save.isPending || uploading}
              >
                {save.isPending || uploading ? copy.saving : copy.save}
              </Button>
            </div>
          </SheetFooter>
        </motion.div>
      </SheetContent>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{copy.confirmDeleteProduct}</AlertDialogTitle>
            <AlertDialogDescription>{copy.deleteHint}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>{copy.cancel}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleting || !product}
              onClick={(e) => {
                e.preventDefault();
                if (!product) return;
                void (async () => {
                  setDeleting(true);
                  try {
                    await deleteProduct(product.id);
                    await qc.invalidateQueries({ queryKey: ["products"] });
                    await qc.invalidateQueries({ queryKey: ["categories"] });
                    toast.success(copy.toastProductDeleted);
                    setDeleteOpen(false);
                    onOpenChange(false);
                  } catch (err) {
                    const msg =
                      err instanceof Error ? err.message : copy.saveError;
                    setApiError(msg);
                    toast.error(msg);
                    setDeleteOpen(false);
                  } finally {
                    setDeleting(false);
                  }
                })();
              }}
            >
              {deleting ? copy.deleting : copy.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sheet>
  );
}

function CategoryChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Button
      type="button"
      size="sm"
      variant={active ? "default" : "outline"}
      onClick={onClick}
      className="h-9 shrink-0 rounded-full px-3.5 text-xs font-medium"
    >
      {children}
    </Button>
  );
}

function QtyStepper({
  id,
  value,
  onChange,
  min = 0,
  allowEmptyZero,
  emptyLabel,
}: {
  id: string;
  value: number;
  onChange: (n: number) => void;
  min?: number;
  allowEmptyZero?: boolean;
  emptyLabel?: string;
}) {
  const display =
    allowEmptyZero && value === 0 && emptyLabel ? emptyLabel : value;

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="size-12 shrink-0 rounded-xl"
        onClick={() => onChange(bumpInt(value, -1, min))}
        aria-label="-1"
      >
        <Minus className="size-5" />
      </Button>
      <div
        className="font-heading bg-muted/30 flex h-12 flex-1 items-center justify-center rounded-xl text-2xl font-semibold tabular-nums ring-1 ring-foreground/8"
        aria-hidden
      >
        <AnimatePresence mode="wait">
          <motion.span
            key={String(display)}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
          >
            {display}
          </motion.span>
        </AnimatePresence>
      </div>
      <Input
        id={id}
        type="number"
        inputMode="numeric"
        className="sr-only"
        value={value}
        min={min}
        onChange={(e) => {
          const n = Number.parseInt(e.target.value, 10);
          onChange(Number.isNaN(n) ? min : Math.max(min, n));
        }}
      />
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="size-12 shrink-0 rounded-xl"
        onClick={() => onChange(bumpInt(value, 1, min))}
        aria-label="+1"
      >
        <Plus className="size-5" />
      </Button>
    </div>
  );
}
