import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2 } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
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
import { Card, CardContent } from "@/components/ui/card";
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
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
  type Category,
} from "@/lib/api/catalog";
import {
  categoryFormSchema,
  type CategoryFormValues,
} from "./product-schema";
import { copy } from "./ui-copy";

type Props = {
  /** Increment from parent toolbar "add" to open create sheet */
  addSignal?: number;
};

export function CategoriesPanel({ addSignal = 0 }: Props) {
  const qc = useQueryClient();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const list = useQuery({
    queryKey: ["categories"],
    queryFn: listCategories,
  });

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    values: { name: editing?.name ?? "" },
  });

  useEffect(() => {
    if (!addSignal) return;
    setEditing(null);
    setSheetOpen(true);
  }, [addSignal]);

  const save = useMutation({
    mutationFn: async (values: CategoryFormValues) => {
      if (editing) return updateCategory(editing.id, values);
      return createCategory(values);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["categories"] });
      toast.success(
        editing ? copy.toastCategoryUpdated : copy.toastCategoryCreated,
      );
      setSheetOpen(false);
      setEditing(null);
      setApiError(null);
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message : copy.saveError;
      setApiError(msg);
      toast.error(msg);
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["categories"] });
      toast.success(copy.toastCategoryDeleted);
      setDeleteId(null);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : copy.saveError);
    },
  });

  return (
    <div className="space-y-3">
      {list.isError ? (
        <Alert variant="destructive">
          <AlertDescription>{copy.loadError}</AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-2">
        {(list.data?.items ?? []).map((c) => (
          <Card key={c.id} size="sm">
            <CardContent className="flex items-center gap-2 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{c.name}</p>
                <p className="text-muted-foreground text-xs">
                  {copy.productCount}: {c.productCount ?? 0}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={copy.editCategory}
                onClick={() => {
                  setEditing(c);
                  setSheetOpen(true);
                }}
              >
                <Pencil />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={copy.delete}
                onClick={() => setDeleteId(c.id)}
              >
                <Trash2 />
              </Button>
            </CardContent>
          </Card>
        ))}
        {!list.isLoading && (list.data?.items.length ?? 0) === 0 ? (
          <p className="text-muted-foreground text-center text-sm">
            {copy.emptyCategories}
          </p>
        ) : null}
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="max-h-[70dvh]">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <SheetHeader>
              <SheetTitle>
                {editing ? copy.editCategory : copy.addCategory}
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
              <FieldGroup>
                <Controller
                  name="name"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="c-name">{copy.name}</FieldLabel>
                      <Input
                        {...field}
                        id="c-name"
                        className="h-11"
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.invalid ? (
                        <FieldError errors={[fieldState.error]} />
                      ) : null}
                    </Field>
                  )}
                />
              </FieldGroup>
              {apiError ? (
                <Alert variant="destructive">
                  <AlertDescription>{apiError}</AlertDescription>
                </Alert>
              ) : null}
              <SheetFooter className="px-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSheetOpen(false)}
                >
                  {copy.cancel}
                </Button>
                <Button type="submit" disabled={save.isPending}>
                  {save.isPending ? copy.saving : copy.save}
                </Button>
              </SheetFooter>
            </form>
          </motion.div>
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={Boolean(deleteId)}
        onOpenChange={(o) => !o && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{copy.confirmDeleteCategory}</AlertDialogTitle>
            <AlertDialogDescription>
              {copy.deleteHint}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{copy.cancel}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={remove.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (deleteId) remove.mutate(deleteId);
              }}
            >
              {remove.isPending ? copy.deleting : copy.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
