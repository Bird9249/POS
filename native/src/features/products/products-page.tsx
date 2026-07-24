import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { motion } from "motion/react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
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
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Perm, hasPermission } from "@/features/auth/permissions";
import {
  getSessionPermissions,
  useSession,
} from "@/features/auth/use-session";
import {
  deleteProduct,
  listCategories,
  listProducts,
  type Product,
} from "@/lib/api/catalog";
import { flattenCursorPages } from "@/lib/list/infinite-virtual";
import { CategoriesPanel } from "./categories-panel";
import { ProductFormSheet } from "./product-form-sheet";
import { ProductVirtualList } from "./product-virtual-list";
import { ProductsToolbar } from "./products-toolbar";
import { copy } from "./ui-copy";

const PAGE_SIZE = 20;

export function ProductsPage() {
  const { data: session } = useSession();
  const permissions = getSessionPermissions(
    session as { permissions?: string[] } | null | undefined,
  );
  const canManage = hasPermission(permissions, Perm.productsManage);
  const canSeeCost = hasPermission(permissions, Perm.productsCostRead);

  const [tab, setTab] = useState("products");
  const [q, setQ] = useState("");
  const debouncedQ = useDebouncedValue(q.trim(), 300);
  const [lowStock, setLowStock] = useState(false);
  const [categoryId, setCategoryId] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [categoryAddSignal, setCategoryAddSignal] = useState(0);
  const qc = useQueryClient();

  const categories = useQuery({
    queryKey: ["categories"],
    queryFn: listCategories,
  });

  const infinite = useInfiniteQuery({
    queryKey: ["products", debouncedQ, lowStock, categoryId],
    queryFn: ({ pageParam }) =>
      listProducts({
        limit: PAGE_SIZE,
        cursor: pageParam,
        q: debouncedQ || undefined,
        lowStock: lowStock || undefined,
        categoryId: categoryId || undefined,
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
  });

  const items = flattenCursorPages(infinite.data?.pages);

  const loadMore = useCallback(() => {
    void infinite.fetchNextPage();
  }, [infinite.fetchNextPage]);

  const remove = useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["products"] });
      await qc.invalidateQueries({ queryKey: ["categories"] });
      toast.success(copy.toastProductDeleted);
      setDeleteId(null);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : copy.saveError);
    },
  });

  if (!canManage) {
    return (
      <Alert>
        <AlertDescription>{copy.noManage}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <Tabs value={tab} onValueChange={setTab}>
        <ProductsToolbar
          tab={tab}
          q={q}
          onQChange={setQ}
          lowStock={lowStock}
          onLowStockChange={setLowStock}
          categoryId={categoryId}
          onCategoryIdChange={setCategoryId}
          categories={categories.data?.items ?? []}
          onAdd={() => {
            if (tab === "products") {
              setEditing(null);
              setFormOpen(true);
              return;
            }
            setCategoryAddSignal((n) => n + 1);
          }}
        />

        <TabsContent value="products" className="mt-3 space-y-3">
          <motion.div
            key={`panel-${debouncedQ}-${lowStock}-${categoryId}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
            className="space-y-3"
          >
            {infinite.isError ? (
              <Alert variant="destructive">
                <AlertDescription>{copy.loadError}</AlertDescription>
              </Alert>
            ) : null}

            {!infinite.isLoading && items.length === 0 ? (
              <p className="text-muted-foreground py-10 text-center text-sm">
                {copy.emptyProducts}
              </p>
            ) : null}

            {items.length > 0 ? (
              <ProductVirtualList
                key={`products-${debouncedQ}-${lowStock}-${categoryId}`}
                items={items}
                canSeeCost={canSeeCost}
                hasNextPage={Boolean(infinite.hasNextPage)}
                isFetchingNextPage={infinite.isFetchingNextPage}
                onLoadMore={loadMore}
                onOpen={(p) => {
                  setEditing(p);
                  setFormOpen(true);
                }}
                onRequestDelete={setDeleteId}
              />
            ) : null}
          </motion.div>
        </TabsContent>

        <TabsContent value="categories" className="mt-3">
          <CategoriesPanel addSignal={categoryAddSignal} />
        </TabsContent>
      </Tabs>

      <ProductFormSheet
        open={formOpen}
        onOpenChange={setFormOpen}
        product={editing}
        canEditCost={canSeeCost}
      />

      <AlertDialog
        open={Boolean(deleteId)}
        onOpenChange={(o) => !o && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{copy.confirmDeleteProduct}</AlertDialogTitle>
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
