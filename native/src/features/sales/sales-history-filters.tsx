import { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowLeftRight,
  Banknote,
  CalendarDays,
  CheckCircle2,
  CloudOff,
  ListFilter,
  SlidersHorizontal,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { salesCopy as copy } from "@/features/checkout/ui-copy-sales";
import type {
  SalesListPaymentFilter,
  SalesListStatusFilter,
} from "@/lib/db/sales-outbox-repo";
import { cn } from "@/lib/utils";

export type SalesPeriodFilter = "all" | "today" | "7d";

export type SalesHistoryFilterState = {
  status: SalesListStatusFilter;
  payment: SalesListPaymentFilter;
  period: SalesPeriodFilter;
};

type Props = {
  value: SalesHistoryFilterState;
  onChange: (next: SalesHistoryFilterState) => void;
};

export const DEFAULT_SALES_FILTERS: SalesHistoryFilterState = {
  status: "all",
  payment: "all",
  period: "all",
};

const STATUS_OPTS: Array<{
  id: SalesListStatusFilter;
  label: string;
  icon: typeof CloudOff;
  activeClass: string;
}> = [
  {
    id: "all",
    label: copy.filterAll,
    icon: ListFilter,
    activeClass: "bg-foreground text-background hover:bg-foreground/90",
  },
  {
    id: "needs_sync",
    label: copy.filterNeedsSync,
    icon: CloudOff,
    activeClass:
      "bg-amber-600 text-white hover:bg-amber-600/90 dark:bg-amber-500 dark:hover:bg-amber-500/90",
  },
  {
    id: "synced",
    label: copy.synced,
    icon: CheckCircle2,
    activeClass:
      "bg-emerald-600 text-white hover:bg-emerald-600/90 dark:bg-emerald-500 dark:hover:bg-emerald-500/90",
  },
  {
    id: "failed",
    label: copy.failed,
    icon: AlertCircle,
    activeClass: "bg-destructive text-white hover:bg-destructive/90",
  },
];

const PAYMENT_OPTS: Array<{
  id: SalesListPaymentFilter;
  label: string;
  icon: typeof Banknote;
}> = [
  { id: "all", label: copy.filterAll, icon: ListFilter },
  { id: "cash", label: copy.cash, icon: Banknote },
  { id: "transfer", label: copy.transfer, icon: ArrowLeftRight },
];

function periodLabel(period: SalesPeriodFilter) {
  if (period === "today") return copy.filterToday;
  if (period === "7d") return copy.filter7d;
  return copy.filterAll;
}

function paymentLabel(payment: SalesListPaymentFilter) {
  if (payment === "cash") return copy.cash;
  if (payment === "transfer") return copy.transfer;
  return copy.filterAll;
}

function statusLabel(status: SalesListStatusFilter) {
  return STATUS_OPTS.find((o) => o.id === status)?.label ?? copy.filterAll;
}

function activeFilterCount(v: SalesHistoryFilterState) {
  let n = 0;
  if (v.period !== "all") n += 1;
  if (v.payment !== "all") n += 1;
  if (v.status !== "all") n += 1;
  return n;
}

function FilterPanel({
  value,
  onChange,
}: {
  value: SalesHistoryFilterState;
  onChange: (next: SalesHistoryFilterState) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <p className="text-muted-foreground flex items-center gap-1.5 text-[11px] font-semibold tracking-wide uppercase">
          <CalendarDays className="size-3.5 opacity-80" />
          {copy.filterPeriod}
        </p>
        <Tabs
          value={value.period}
          onValueChange={(period) =>
            onChange({ ...value, period: period as SalesPeriodFilter })
          }
          className="gap-0"
        >
          <TabsList className="h-11 w-full rounded-xl p-1">
            <TabsTrigger
              value="today"
              className="h-9 flex-1 rounded-lg text-sm font-medium"
            >
              {copy.filterToday}
            </TabsTrigger>
            <TabsTrigger
              value="7d"
              className="h-9 flex-1 rounded-lg text-sm font-medium"
            >
              {copy.filter7d}
            </TabsTrigger>
            <TabsTrigger
              value="all"
              className="h-9 flex-1 rounded-lg text-sm font-medium"
            >
              {copy.filterAll}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="space-y-1.5">
        <p className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
          {copy.filterPayment}
        </p>
        <div className="grid grid-cols-3 gap-2">
          {PAYMENT_OPTS.map((opt) => {
            const active = value.payment === opt.id;
            const Icon = opt.icon;
            return (
              <Button
                key={opt.id}
                type="button"
                variant="outline"
                onClick={() => onChange({ ...value, payment: opt.id })}
                className={cn(
                  "h-auto min-h-14 flex-col gap-1 rounded-xl px-2 py-2.5 text-center shadow-none",
                  active
                    ? "border-foreground/20 bg-muted text-foreground ring-1 ring-foreground/10"
                    : "text-muted-foreground",
                )}
              >
                <Icon className="size-4" />
                <span className="text-[11px] leading-tight font-medium whitespace-normal">
                  {opt.label}
                </span>
              </Button>
            );
          })}
        </div>
      </div>

      <div className="space-y-1.5">
        <p className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
          {copy.filterStatus}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {STATUS_OPTS.map((opt) => {
            const active = value.status === opt.id;
            const Icon = opt.icon;
            return (
              <Button
                key={opt.id}
                type="button"
                size="sm"
                variant={active ? "default" : "outline"}
                onClick={() => onChange({ ...value, status: opt.id })}
                className={cn(
                  "h-8 gap-1.5 rounded-full px-2.5 text-xs font-medium shadow-none",
                  active && opt.activeClass,
                )}
              >
                <Icon className="size-3.5" />
                {opt.label}
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function SalesHistoryFilters({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const dirty = !isDefaultSalesFilters(value);
  const count = activeFilterCount(value);

  useEffect(() => {
    if (open) setDraft(value);
  }, [open, value]);

  const summaryBits = [
    value.period !== "all" ? periodLabel(value.period) : null,
    value.payment !== "all" ? paymentLabel(value.payment) : null,
    value.status !== "all" ? statusLabel(value.status) : null,
  ].filter(Boolean) as string[];

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={cn(
          "h-9 shrink-0 gap-1.5 rounded-xl px-3",
          dirty && "border-foreground/20 bg-muted/40",
        )}
        onClick={() => setOpen(true)}
        title={dirty ? summaryBits.join(" · ") : copy.filters}
      >
        <SlidersHorizontal className="size-3.5" />
        {copy.filters}
        {count > 0 ? (
          <Badge
            variant="secondary"
            className="h-5 min-w-5 justify-center px-1.5 text-[10px]"
          >
            {count}
          </Badge>
        ) : null}
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          className="flex max-h-[88vh] flex-col gap-0 overflow-hidden p-0"
        >
          <SheetHeader className="shrink-0 border-b px-4 pt-4 pb-3">
            <SheetTitle className="text-lg">{copy.filters}</SheetTitle>
          </SheetHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
            <FilterPanel value={draft} onChange={setDraft} />
          </div>

          <SheetFooter className="bg-background/95 shrink-0 gap-2 border-t px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur sm:flex-col">
            {!isDefaultSalesFilters(draft) ? (
              <Button
                type="button"
                variant="ghost"
                className="h-11 w-full rounded-xl"
                onClick={() => setDraft(DEFAULT_SALES_FILTERS)}
              >
                {copy.clearFilters}
              </Button>
            ) : null}
            <Button
              type="button"
              className="h-11 w-full rounded-xl text-base"
              onClick={() => {
                onChange(draft);
                setOpen(false);
              }}
            >
              {copy.applyFilters}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}

/** Local calendar day start → ISO for SQLite sold_at compare. */
export function soldFromForPeriod(period: SalesPeriodFilter): string | null {
  if (period === "all") return null;
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  if (period === "7d") {
    d.setDate(d.getDate() - 6);
  }
  return d.toISOString();
}

export function isDefaultSalesFilters(v: SalesHistoryFilterState) {
  return v.status === "all" && v.payment === "all" && v.period === "all";
}
