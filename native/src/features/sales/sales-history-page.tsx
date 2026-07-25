import { useInfiniteQuery } from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";
import { motion } from "motion/react";
import { ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Perm, hasPermission } from "@/features/auth/permissions";
import {
  getSessionPermissions,
  useSession,
} from "@/features/auth/use-session";
import { salesCopy as copy } from "@/features/checkout/ui-copy-sales";
import { getLocalDb } from "@/lib/db/client";
import { listLocalSales, type SalesOutboxRow } from "@/lib/db/sales-outbox-repo";
import { formatKip } from "@/lib/format-kip";
import { pullSalesHistory } from "@/lib/sync/pull-sales";
import { useSalesSync } from "@/lib/sync/use-sales-sync";
import { cn } from "@/lib/utils";
import { SaleDetailSheet } from "./sale-detail-sheet";
import {
  DEFAULT_SALES_FILTERS,
  isDefaultSalesFilters,
  SalesHistoryFilters,
  soldFromForPeriod,
  type SalesHistoryFilterState,
} from "./sales-history-filters";

const ROW_H = 88;
const PAGE = 20;

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

export function SalesHistoryPage() {
  const { data: session } = useSession();
  const permissions = getSessionPermissions(
    session as { permissions?: string[] } | null | undefined,
  );
  const canRead = hasPermission(permissions, Perm.salesRead);
  const salesSync = useSalesSync();
  const [selected, setSelected] = useState<SalesOutboxRow | null>(null);
  const [filters, setFilters] =
    useState<SalesHistoryFilterState>(DEFAULT_SALES_FILTERS);

  const soldFrom = soldFromForPeriod(filters.period);

  const infinite = useInfiniteQuery({
    queryKey: [
      "local-sales",
      salesSync.status,
      filters.status,
      filters.payment,
      filters.period,
    ],
    queryFn: async ({ pageParam }) => {
      const db = await getLocalDb();
      // First page: refresh from server when online, then apply filters locally
      if (!pageParam && salesSync.status === "online") {
        try {
          await pullSalesHistory(db);
        } catch {
          // keep local-only list when pull fails
        }
      }
      const items = await listLocalSales(db, {
        limit: PAGE,
        cursor: pageParam,
        status: filters.status,
        payment: filters.payment,
        soldFrom,
      });
      const nextCursor =
        items.length === PAGE ? items[items.length - 1]!.sold_at : null;
      return { items, nextCursor };
    },
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
    enabled: canRead,
  });

  const items = infinite.data?.pages.flatMap((p) => p.items) ?? [];
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_H,
    overscan: 6,
  });

  useEffect(() => {
    parentRef.current?.scrollTo({ top: 0 });
  }, [filters.status, filters.payment, filters.period]);

  useEffect(() => {
    const rows = virtualizer.getVirtualItems();
    const last = rows[rows.length - 1];
    if (
      last &&
      last.index >= items.length - 4 &&
      infinite.hasNextPage &&
      !infinite.isFetchingNextPage
    ) {
      void infinite.fetchNextPage();
    }
  }, [virtualizer.getVirtualItems(), items.length, infinite]);

  if (!canRead) {
    return (
      <Alert>
        <AlertDescription>{copy.noPermission}</AlertDescription>
      </Alert>
    );
  }

  const emptyLabel = isDefaultSalesFilters(filters)
    ? copy.empty
    : copy.emptyFiltered;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h1 className="min-w-0 truncate text-lg font-semibold">
          {copy.title}
        </h1>
        <div className="flex shrink-0 items-center gap-2">
          <SalesHistoryFilters value={filters} onChange={setFilters} />
          {salesSync.pendingCount > 0 ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-9 rounded-xl"
              disabled={salesSync.isSyncing || salesSync.status !== "online"}
              onClick={() => salesSync.push()}
            >
              {salesSync.isSyncing ? <Spinner className="size-4" /> : null}
              {copy.retry}
              {salesSync.pendingCount ? ` · ${salesSync.pendingCount}` : ""}
            </Button>
          ) : null}
        </div>
      </div>

      {infinite.isError ? (
        <Alert variant="destructive">
          <AlertDescription>{copy.loadError}</AlertDescription>
        </Alert>
      ) : null}

      {infinite.isLoading ? (
        <div className="text-muted-foreground flex h-40 items-center justify-center gap-2 text-sm">
          <Spinner className="size-5" />
        </div>
      ) : items.length === 0 ? (
        <p className="text-muted-foreground py-16 text-center text-sm">
          {emptyLabel}
        </p>
      ) : (
        <div
          ref={parentRef}
          className="min-h-0 flex-1 overflow-y-auto rounded-2xl border"
        >
          <div
            className="relative w-full"
            style={{ height: virtualizer.getTotalSize() }}
          >
            {virtualizer.getVirtualItems().map((vRow) => {
              const sale = items[vRow.index];
              if (!sale) return null;
              const badge = statusBadge(sale.status);
              const when = new Date(sale.sold_at);
              return (
                <div
                  key={sale.client_sale_id}
                  className="absolute inset-x-0 border-b"
                  style={{
                    height: vRow.size,
                    transform: `translateY(${vRow.start}px)`,
                  }}
                >
                  <motion.button
                    type="button"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-muted/40 flex h-full w-full items-center gap-3 px-3.5 text-left transition-colors"
                    onClick={() => setSelected(sale)}
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex min-w-0 items-center gap-2">
                        <p className="font-heading shrink-0 text-base font-semibold leading-tight tabular-nums">
                          {formatKip(sale.amount_due)}
                        </p>
                        <Badge
                          variant="secondary"
                          className={cn(
                            "h-5 shrink-0 px-1.5 text-[10px] leading-none",
                            badge.className,
                          )}
                        >
                          {badge.label}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground truncate text-xs leading-snug">
                        {sale.payment_method === "cash"
                          ? copy.cash
                          : copy.transfer}
                        {" · "}
                        {Number.isNaN(when.getTime())
                          ? sale.sold_at
                          : when.toLocaleString("lo-LA")}
                      </p>
                      {sale.error ? (
                        <p className="text-destructive truncate text-[11px] leading-snug">
                          {sale.error}
                        </p>
                      ) : null}
                    </div>
                    <ChevronRight className="text-muted-foreground size-4 shrink-0" />
                  </motion.button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <SaleDetailSheet
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
        sale={selected}
        online={salesSync.status === "online"}
      />
    </div>
  );
}
