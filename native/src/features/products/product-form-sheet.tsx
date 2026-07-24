import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";
import { Controller, useForm, type Resolver } from "react-hook-form";
import { useState } from "react";
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
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ApiError } from "@/lib/api/fetcher";
import {
  createProduct,
  deleteProduct,
  listCategories,
  updateProduct,
  uploadProductImage,
  type Category,
  type Product,
} from "@/lib/api/catalog";
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
};

export function ProductFormSheet({
  open,
  onOpenChange,
  product,
  canEditCost,
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

  const save = useMutation({
    mutationFn: async (values: ProductFormValues) => {
      const minStockRaw = values.minStock?.trim() ?? "";
      const minStock =
        minStockRaw === "" ? null : Number.parseInt(minStockRaw, 10);
      if (minStockRaw !== "" && Number.isNaN(minStock)) {
        throw new Error("minStock");
      }
      const body = {
        name: values.name,
        barcode: values.barcode?.trim() || null,
        sku: values.sku?.trim() || null,
        categoryId: values.categoryId?.trim() || null,
        sellPrice: values.sellPrice,
        costPrice: values.costPrice,
        stockQty: values.stockQty,
        minStock,
        image: values.image?.trim() || null,
      };
      if (product) return updateProduct(product.id, body);
      return createProduct(body);
    },
    onSuccess: async (_data, _vars, _ctx) => {
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
      <SheetContent side="bottom" className="max-h-[92dvh] overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <SheetHeader>
            <SheetTitle>
              {product ? copy.editProduct : copy.addProduct}
            </SheetTitle>
          </SheetHeader>
          <form
            className="space-y-3 px-4 pb-4"
            onSubmit={form.handleSubmit((v) => {
              setApiError(null);
              save.mutate(v);
            })}
            noValidate
          >
            <FieldGroup className="gap-3">
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
              <Controller
                name="name"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="p-name">{copy.name}</FieldLabel>
                    <Input
                      {...field}
                      id="p-name"
                      className="h-11"
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
                name="categoryId"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>{copy.category}</FieldLabel>
                    <Select
                      value={field.value || "__none__"}
                      onValueChange={(v) =>
                        field.onChange(v === "__none__" ? "" : v)
                      }
                    >
                      <SelectTrigger className="h-11 w-full">
                        <SelectValue placeholder={copy.noCategory} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">
                          {copy.noCategory}
                        </SelectItem>
                        {(categories.data?.items ?? []).map((c: Category) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              />
              <div className="grid grid-cols-2 gap-3">
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
                        className="h-11"
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
                          className="h-11"
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
              <div className="grid grid-cols-2 gap-3">
                <Controller
                  name="stockQty"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="p-stock">{copy.stock}</FieldLabel>
                      <Input
                        {...field}
                        id="p-stock"
                        type="number"
                        inputMode="numeric"
                        className="h-11"
                        aria-invalid={fieldState.invalid}
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
                      <Input
                        {...field}
                        id="p-min"
                        type="number"
                        inputMode="numeric"
                        className="h-11"
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
            </FieldGroup>
            {apiError ? (
              <Alert variant="destructive">
                <AlertDescription>{apiError}</AlertDescription>
              </Alert>
            ) : null}
            <SheetFooter className="flex-col gap-2 px-0 sm:flex-col">
              <div className="flex w-full gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => onOpenChange(false)}
                >
                  {copy.cancel}
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={save.isPending || uploading}
                >
                  {save.isPending || uploading ? copy.saving : copy.save}
                </Button>
              </div>
              {product ? (
                <Button
                  type="button"
                  variant="destructive"
                  disabled={save.isPending || deleting}
                  onClick={() => setDeleteOpen(true)}
                >
                  {copy.delete}
                </Button>
              ) : null}
            </SheetFooter>
          </form>
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
