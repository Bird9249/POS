import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useOnlineStatus } from "@/hooks/use-online-status";

const labels = {
  online: "ອອນລາຍ",
  offline: "ອອຟລາຍ",
  checking: "ກຳລັງກວດ",
} as const;

export function OnlinePill() {
  const { status } = useOnlineStatus();
  return (
    <Badge
      variant="outline"
      className={cn(
        status === "online" &&
          "border-emerald-500/30 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
        status === "offline" &&
          "border-amber-500/30 bg-amber-500/15 text-amber-800 dark:text-amber-300",
        status === "checking" && "text-muted-foreground",
      )}
    >
      {labels[status]}
    </Badge>
  );
}
