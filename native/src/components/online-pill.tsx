import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { useSalesSync } from "@/lib/sync/use-sales-sync";

const labels = {
  online: "ອອນລາຍ",
  offline: "ອອຟລາຍ",
  checking: "ກຳລັງກວດ",
} as const;

export function OnlinePill() {
  const { status } = useOnlineStatus();
  const { pendingCount, isSyncing, push } = useSalesSync({
    autoOnOnline: true,
  });

  return (
    <button
      type="button"
      className="inline-flex items-center gap-1.5"
      onClick={() => {
        if (pendingCount > 0 && status === "online") push();
      }}
      title={
        pendingCount > 0 ? `${pendingCount} pending sync` : labels[status]
      }
    >
      <Badge
        variant="outline"
        className={cn(
          status === "online" &&
            "border-emerald-500/30 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
          status === "offline" &&
            "border-amber-500/30 bg-amber-500/15 text-amber-800 dark:text-amber-300",
          status === "checking" && "text-muted-foreground",
          isSyncing && "animate-pulse",
        )}
      >
        {isSyncing ? "sync…" : labels[status]}
        {pendingCount > 0 ? ` · ${pendingCount}` : ""}
      </Badge>
    </button>
  );
}
