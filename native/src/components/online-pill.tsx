import { Badge } from "@/components/ui/badge";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { useSalesSync } from "@/lib/sync/use-sales-sync";
import { cn } from "@/lib/utils";

const labels = {
  online: 'ອອນລາຍ',
  offline: 'ອອຟລາຍ',
  checking: 'ກຳລັງກວດ',
  syncing: "sync…",
  syncError: "ຊິງຄ໌ບໍ່ສຳເລັດ",
} as const;

export function OnlinePill() {
  const { status } = useOnlineStatus();
  const { pendingCount, isSyncing, sync, lastError } = useSalesSync({
    autoOnOnline: true,
  });

  const hasError = Boolean(lastError);
  const label = isSyncing
    ? labels.syncing
    : hasError
      ? labels.syncError
      : labels[status];

  return (
    <button
      type="button"
      className="inline-flex items-center gap-1.5"
      onClick={() => {
        if (status === "online") sync();
      }}
      title={
        hasError
          ? labels.syncError
          : pendingCount > 0
            ? `${pendingCount} pending sync`
            : labels[status]
      }
    >
      <Badge
        variant="outline"
        className={cn(
          status === "online" &&
            !hasError &&
            "border-emerald-500/30 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
          status === "offline" &&
            "border-amber-500/30 bg-amber-500/15 text-amber-800 dark:text-amber-300",
          status === "checking" && "text-muted-foreground",
          hasError &&
            "border-destructive/40 bg-destructive/10 text-destructive",
          isSyncing && "animate-pulse",
        )}
      >
        {label}
        {pendingCount > 0 ? ` · ${pendingCount}` : ""}
      </Badge>
    </button>
  );
}
