import { useMutation } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";
import { copy } from "@/features/products/ui-copy";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { getLocalDb } from "@/lib/db/client";
import { pullCatalog } from "./pull-catalog";

type SyncMode = "full" | "delta";

/** One quiet background pull per app session (survives Strict Mode remounts). */
let autoPullStarted = false;

async function runPull(mode: SyncMode = "delta") {
  const db = await getLocalDb();
  return pullCatalog(db, { full: mode === "full" });
}

/** Manual + silent auto pull catalog into SQLite when online. */
export function useCatalogSync(opts?: { autoOnOnline?: boolean }) {
  const { status } = useOnlineStatus();

  // Quiet background pull — no toast, no toolbar spinner.
  const autoSync = useMutation({
    mutationFn: runPull,
  });

  const manualSync = useMutation({
    mutationFn: runPull,
    onSuccess: (result) => {
      if (result.products === 0 && result.categories === 0) {
        toast.success(copy.toastSyncUpToDate);
        return;
      }
      toast.success(`${copy.toastSyncOk} · ${result.products}`);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : copy.toastSyncError);
    },
  });

  useEffect(() => {
    if (!opts?.autoOnOnline) return;
    if (status !== "online" || autoPullStarted) return;
    autoPullStarted = true;
    autoSync.mutate("delta");
    // Intentionally only once when network becomes online
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts?.autoOnOnline, status]);

  return {
    sync: () => manualSync.mutate("delta"),
    syncFull: () => manualSync.mutate("full"),
    // Toolbar spinner only for user-initiated sync.
    isSyncing: manualSync.isPending,
    status,
  };
}
