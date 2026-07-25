import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronRight, FolderTree, Package, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
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
import { Spinner } from "@/components/ui/spinner";
import {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
  type Category,
} from "@/lib/api/catalog";
import { cn } from "@/lib/utils";
import {
  categoryFormSchema,
  type CategoryFormValues,
} from "./product-schema";
import { copy } from "./ui-copy";

type Props = {
  /** Increment from parent toolbar "add" to open create sheet */
  addSignal?: number;
};

const AVATAR_TONES = [
  "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300",
  "bg-sky-500/15 text-sky-800 dark:text-sky-300",
  "bg-amber-500/15 text-amber-900 dark:text-amber-300",
  "bg-violet-500/15 text-violet-800 dark:text-violet-300",
  "bg-rose-500/15 text-rose-800 dark:text-rose-300",
  "bg-teal-500/15 text-teal-800 dark:text-teal-300",
] as const;

function avatarTone(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h + id.charCodeAt(i) * 17) % 997;
  return AVATAR_TONES[h % AVATAR_TONES.length]!;
}

function initialOf(name: string) {
  const t = name.trim();
  return t ? t.slice(0, 1).toUpperCase() : "?";
}

export function CategoriesPanel({ addSignal = 0 }: Props) {
  const qc = useQueryClient();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const list = useQuery({
    queryKey: ["categories"],
    queryFn: listCategories,
  });

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    values: { name: editing?.name ?? "" },
  });

  const watchedName = useWatch({ control: form.control, name: "name" });

  useEffect(() => {
    if (!addSignal) return;
    setEditing(null);
    setApiError(null);
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
      setDeleteOpen(false);
      setSheetOpen(false);
      setEditing(null);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : copy.saveError);
    },
  });

  const items = list.data?.items ?? [];
  const previewName = watchedName?.trim() || copy.name;
  const previewCount = editing?.productCount ?? 0;

  function openCreate() {
    setEditing(null);
    setApiError(null);
    setSheetOpen(true);
  }

  function openEdit(c: Category) {
    setEditing(c);
    setApiError(null);
    setSheetOpen(true);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      {list.isError ? (
        <Alert variant="destructive" className="shrink-0">
          <AlertDescription>{copy.loadError}</AlertDescription>
        </Alert>
      ) : null}

      <div className="min-h-0 flex-1 overflow-y-auto rounded-2xl border">
        {list.isLoading ? (
          <div className="text-muted-foreground flex h-40 items-center justify-center gap-2 text-sm">
            <Spinner className="size-5" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
            <div className="bg-muted/60 flex size-14 items-center justify-center rounded-2xl ring-1 ring-foreground/8">
              <FolderTree className="text-muted-foreground size-7" />
            </div>
            <div className="space-y-1">
              <p className="font-medium">{copy.emptyCategories}</p>
              <p className="text-muted-foreground text-sm text-pretty">
                {copy.categoryEmptyHint}
              </p>
            </div>
            <Button
              type="button"
              className="mt-1 rounded-xl"
              onClick={openCreate}
            >
              {copy.addCategory}
            </Button>
          </div>
        ) : (
          <ul className="divide-y">
            {items.map((c, index) => {
              const count = c.productCount ?? 0;
              return (
                <motion.li
                  key={c.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.16, delay: Math.min(index, 8) * 0.03 }}
                >
                  <button
                    type="button"
                    className="hover:bg-muted/45 active:bg-muted/60 flex w-full items-center gap-3 px-3.5 py-3 text-left transition-colors"
                    onClick={() => openEdit(c)}
                  >
                    <div
                      className={cn(
                        "flex size-12 shrink-0 items-center justify-center rounded-xl text-lg font-semibold",
                        avatarTone(c.id),
                      )}
                      aria-hidden
                    >
                      {initialOf(c.name)}
                    </div>
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <p className="truncate font-medium">{c.name}</p>
                      <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
                        <Package className="size-3.5 shrink-0 opacity-70" />
                        <span className="tabular-nums">
                          {count} {copy.productCount}
                        </span>
                      </p>
                    </div>
                    {count > 0 ? (
                      <Badge
                        variant="secondary"
                        className="h-6 min-w-6 shrink-0 justify-center px-2 tabular-nums"
                      >
                        {count}
                      </Badge>
                    ) : null}
                    <ChevronRight className="text-muted-foreground size-4 shrink-0 opacity-50" />
                  </button>
                </motion.li>
              );
            })}
          </ul>
        )}
      </div>

      <Sheet
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) {
            setEditing(null);
            setApiError(null);
          }
        }}
      >
        <SheetContent
          side="bottom"
          className="flex max-h-[85dvh] flex-col gap-0 overflow-hidden p-0"
        >
          <motion.div
            className="flex min-h-0 flex-1 flex-col"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22 }}
          >
            <SheetHeader className="shrink-0 border-b px-4 pt-4 pb-3">
              <SheetTitle className="text-lg">
                {editing ? copy.editCategory : copy.addCategory}
              </SheetTitle>
              <SheetDescription>{copy.categoryFormHint}</SheetDescription>
            </SheetHeader>

            <form
              id="category-form"
              className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-4"
              onSubmit={form.handleSubmit((v) => {
                setApiError(null);
                save.mutate(v);
              })}
              noValidate
            >
              {/* Live preview */}
              <div className="from-muted/70 to-background flex items-center gap-3 rounded-2xl bg-linear-to-br p-4 ring-1 ring-foreground/8">
                <div
                  className={cn(
                    "flex size-16 shrink-0 items-center justify-center rounded-2xl text-2xl font-semibold",
                    editing
                      ? avatarTone(editing.id)
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={previewName}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                    >
                      {initialOf(previewName)}
                    </motion.span>
                  </AnimatePresence>
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="font-heading truncate text-lg font-semibold">
                    {previewName}
                  </p>
                  {editing ? (
                    <p className="text-muted-foreground text-xs tabular-nums">
                      {copy.categoryProductsLabel}: {previewCount}
                    </p>
                  ) : (
                    <p className="text-muted-foreground text-xs">
                      {copy.categoryFormHint}
                    </p>
                  )}
                </div>
              </div>

              <section className="space-y-3">
                <h3 className="text-sm font-semibold">{copy.formSectionBasic}</h3>
                <FieldGroup className="gap-3">
                  <Controller
                    name="name"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="c-name">{copy.name}</FieldLabel>
                        <Input
                          {...field}
                          id="c-name"
                          autoFocus
                          className="h-12 rounded-xl text-base"
                          placeholder={copy.categoryNamePlaceholder}
                          aria-invalid={fieldState.invalid}
                        />
                        {fieldState.invalid ? (
                          <FieldError errors={[fieldState.error]} />
                        ) : null}
                      </Field>
                    )}
                  />
                </FieldGroup>
              </section>

              {editing ? (
                <section className="space-y-3">
                  <div className="grid grid-cols-1 gap-3 rounded-2xl bg-muted/40 p-4 ring-1 ring-foreground/8">
                    <div>
                      <p className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
                        {copy.categoryProductsLabel}
                      </p>
                      <p className="font-heading mt-1 text-3xl font-semibold tabular-nums">
                        {previewCount}
                      </p>
                    </div>
                  </div>
                </section>
              ) : null}

              {editing ? (
                <section className="space-y-3">
                  <h3 className="text-sm font-semibold">{copy.formDangerZone}</h3>
                  <Button
                    type="button"
                    variant="outline"
                    className="text-destructive hover:text-destructive h-11 w-full rounded-xl border-destructive/30"
                    disabled={save.isPending || remove.isPending}
                    onClick={() => setDeleteOpen(true)}
                  >
                    <Trash2 data-icon="inline-start" />
                    {copy.delete}
                  </Button>
                </section>
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
                  onClick={() => setSheetOpen(false)}
                >
                  {copy.cancel}
                </Button>
                <Button
                  type="submit"
                  form="category-form"
                  className="h-12 flex-[1.4] rounded-xl text-base"
                  disabled={save.isPending}
                >
                  {save.isPending ? copy.saving : copy.save}
                </Button>
              </div>
            </SheetFooter>
          </motion.div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{copy.confirmDeleteCategory}</AlertDialogTitle>
            <AlertDialogDescription>
              {copy.categoryDeleteHint}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={remove.isPending}>
              {copy.cancel}
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={remove.isPending || !editing}
              onClick={(e) => {
                e.preventDefault();
                if (editing) remove.mutate(editing.id);
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
