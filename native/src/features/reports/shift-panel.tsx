import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";
import { useOnlineStatus } from "@/hooks/use-online-status";
import {
  closeShiftZ,
  fetchXReport,
  listShifts,
  type Shift,
} from "@/lib/api/shifts";
import { formatKip } from "@/lib/format-kip";
import { StatRow } from "./stat-row";
import { shiftCopy as copy } from "./ui-copy";
import {
  markShiftClosedLocally,
  useCurrentShift,
  useOpenShiftMutation,
} from "./use-current-shift";

export const CURRENT_SHIFT_QUERY_KEY = ["shift-current"] as const;

function formatWhen(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("lo-LA");
}

function SummaryBlock({
  summary,
}: {
  summary: NonNullable<Shift["summary"]>;
}) {
  return (
    <div className="divide-y rounded-2xl border px-4">
      <StatRow label={copy.total} value={formatKip(summary.totalSalesKip)} emphasize />
      <StatRow label={copy.cash} value={formatKip(summary.cashSalesKip)} />
      <StatRow label={copy.transfer} value={formatKip(summary.transferSalesKip)} />
      <StatRow
        label={copy.expectedCash}
        value={formatKip(summary.expectedCashKip)}
      />
      <StatRow label={copy.bills} value={String(summary.billCount)} />
    </div>
  );
}

export function ShiftPanel() {
  const { status } = useOnlineStatus();
  const online = status === "online";
  const qc = useQueryClient();
  const [xOpen, setXOpen] = useState(false);
  const [zOpen, setZOpen] = useState(false);
  const [xShift, setXShift] = useState<Shift | null>(null);
  const [counted, setCounted] = useState("");
  const [detailsOpen, setDetailsOpen] = useState(false);

  const current = useCurrentShift({ enabled: true });
  const openMut = useOpenShiftMutation();

  const history = useInfiniteQuery({
    queryKey: ["shifts-history"],
    queryFn: async ({ pageParam }) => {
      const res = await listShifts({ limit: 20, cursor: pageParam });
      return res;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    enabled: online,
  });

  const rows = history.data?.pages.flatMap((p) => p.items) ?? [];
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 72,
    overscan: 6,
  });

  useEffect(() => {
    const items = virtualizer.getVirtualItems();
    const last = items[items.length - 1];
    if (
      last &&
      last.index >= rows.length - 4 &&
      history.hasNextPage &&
      !history.isFetchingNextPage
    ) {
      void history.fetchNextPage();
    }
  }, [virtualizer.getVirtualItems(), rows.length, history]);

  const closeMut = useMutation({
    mutationFn: async () => {
      const id = current.data?.id;
      if (!id) throw new Error("NO_SHIFT");
      const countedCashKip = Math.trunc(Number(counted));
      if (!Number.isFinite(countedCashKip) || countedCashKip < 0) {
        throw new Error("INVALID_COUNT");
      }
      return closeShiftZ(id, { countedCashKip });
    },
    onSuccess: async () => {
      toast.success(copy.closeOk);
      setZOpen(false);
      setCounted("");
      await markShiftClosedLocally();
      await qc.invalidateQueries({ queryKey: CURRENT_SHIFT_QUERY_KEY });
      await qc.invalidateQueries({ queryKey: ["shifts-history"] });
    },
    onError: () => toast.error(copy.closeError),
  });

  if (current.isLoading) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  const open = current.data;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="shrink-0 space-y-3">
        {!online ? (
          <Alert>
            <AlertDescription>{copy.offline}</AlertDescription>
          </Alert>
        ) : null}
        {!open ? (
          <div className="space-y-3 rounded-2xl border p-4">
            <p className="text-sm">{copy.noShift}</p>
            <Button
              type="button"
              className="h-11 w-full rounded-xl"
              disabled={!online || openMut.isPending}
              onClick={() =>
                openMut.mutate(undefined, {
                  onSuccess: () => {
                    void qc.invalidateQueries({ queryKey: ["shifts-history"] });
                  },
                })
              }
            >
              {openMut.isPending ? copy.opening : copy.open}
            </Button>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border">
            <button
              type="button"
              className="hover:bg-muted/40 flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors"
              aria-expanded={detailsOpen}
              aria-label={
                detailsOpen ? copy.collapseDetails : copy.expandDetails
              }
              onClick={() => setDetailsOpen((v) => !v)}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold">{copy.currentOpen}</p>
                  <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                    {copy.statusOpen}
                  </Badge>
                </div>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  {formatWhen(open.openedAt)}
                  {open.summary
                    ? ` · ${formatKip(open.summary.totalSalesKip)}`
                    : ""}
                </p>
              </div>
              <ChevronDown
                className={cn(
                  "text-muted-foreground size-5 shrink-0 transition-transform duration-200",
                  detailsOpen && "rotate-180",
                )}
              />
            </button>

            <AnimatePresence initial={false}>
              {detailsOpen ? (
                <motion.div
                  key="shift-details"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-3 border-t px-4 pt-3 pb-4">
                    {open.summary ? (
                      <SummaryBlock summary={open.summary} />
                    ) : null}
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="h-11 rounded-xl"
                        onClick={async () => {
                          try {
                            const res = await fetchXReport(open.id);
                            setXShift(res.shift);
                            setXOpen(true);
                          } catch {
                            toast.error(copy.loadError);
                          }
                        }}
                      >
                        {copy.xReport}
                      </Button>
                      <Button
                        type="button"
                        className="h-11 rounded-xl"
                        onClick={() => {
                          setCounted(
                            String(open.summary?.expectedCashKip ?? 0),
                          );
                          setZOpen(true);
                        }}
                      >
                        {copy.zReport}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <p className="mb-2 shrink-0 text-sm font-semibold">{copy.history}</p>
        <div
          ref={parentRef}
          className="min-h-0 flex-1 overflow-y-auto rounded-2xl border"
        >
          {history.isLoading ? (
            <div className="flex justify-center py-10">
              <Spinner />
            </div>
          ) : rows.length === 0 ? (
            <p className="text-muted-foreground px-3 py-8 text-center text-sm">
              {copy.emptyHistory}
            </p>
          ) : (
            <div
              className="relative w-full"
              style={{ height: virtualizer.getTotalSize() }}
            >
              {virtualizer.getVirtualItems().map((v) => {
                const row = rows[v.index]!;
                return (
                  <motion.div
                    key={row.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute top-0 left-0 w-full border-b px-3 py-3"
                    style={{
                      height: v.size,
                      transform: `translateY(${v.start}px)`,
                    }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {formatWhen(row.openedAt)}
                        </p>
                        <p className="text-muted-foreground text-xs tabular-nums">
                          {formatKip(row.totalSalesKip ?? 0)} ·{" "}
                          {row.billCount ?? 0} {copy.bills}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          row.status === "open"
                            ? "border-emerald-500/40 text-emerald-700"
                            : undefined
                        }
                      >
                        {row.status === "open"
                          ? copy.statusOpen
                          : copy.statusClosed}
                      </Badge>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Sheet open={xOpen} onOpenChange={setXOpen}>
        <SheetContent side="bottom" className="flex max-h-[90vh] flex-col gap-0 p-0">
          <SheetHeader className="border-b px-4 pt-4 pb-3">
            <SheetTitle>{copy.xReport}</SheetTitle>
          </SheetHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
            {xShift?.summary ? <SummaryBlock summary={xShift.summary} /> : null}
          </div>
          <SheetFooter className="border-t px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full rounded-xl"
              onClick={() => setXOpen(false)}
            >
              {copy.close}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Sheet open={zOpen} onOpenChange={setZOpen}>
        <SheetContent side="bottom" className="flex max-h-[90vh] flex-col gap-0 p-0">
          <SheetHeader className="border-b px-4 pt-4 pb-3">
            <SheetTitle>{copy.zReport}</SheetTitle>
          </SheetHeader>
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
            {open?.summary ? <SummaryBlock summary={open.summary} /> : null}
            <label className="block space-y-1.5">
              <span className="text-muted-foreground text-xs font-medium">
                {copy.countedCash}
              </span>
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                value={counted}
                onChange={(e) => setCounted(e.target.value)}
                className="h-11 rounded-xl tabular-nums"
              />
            </label>
            {open?.summary && counted !== "" && Number.isFinite(Number(counted)) ? (
              <StatRow
                label={copy.diff}
                value={formatKip(
                  Math.trunc(Number(counted)) - open.summary.expectedCashKip,
                )}
                emphasize
              />
            ) : null}
          </div>
          <SheetFooter className="gap-2 border-t px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] sm:flex-col">
            <Button
              type="button"
              className="h-11 w-full rounded-xl"
              disabled={closeMut.isPending}
              onClick={() => closeMut.mutate()}
            >
              {closeMut.isPending ? copy.closing : copy.confirmClose}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full rounded-xl"
              onClick={() => setZOpen(false)}
            >
              {copy.close}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
