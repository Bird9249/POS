import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";
import { copy } from "@/features/products/ui-copy";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { getLocalDb } from "@/lib/db/client";
import { PENDING_SALES_QUERY_KEY } from "./use-sales-sync";
import { syncSalesThenCatalog } from "./push-sales";

type SyncMode = "full" | "delta";

/** One quiet background sync per app session (survives Strict Mode remounts). */
let autoSyncStarted = false;

async function runSync(mode: SyncMode = "delta") {
  const db = await getLocalDb();
  return syncSalesThenCatalog(db, { fullPull: mode === "full" });
}

/** Push outbox then pull catalog — manual + silent auto when online. */
export function useCatalogSync(opts?: { autoOnOnline?: boolean }) {
  const { status } = useOnlineStatus();
  const qc = useQueryClient();

  const autoSync = useMutation({
    mutationFn: runSync,
    onSettled: async () => {
      await qc.invalidateQueries({ queryKey: PENDING_SALES_QUERY_KEY });
    },
  });

  const manualSync = useMutation({
    mutationFn: runSync,
    onSuccess: (result) => {
      const pulled = result.pull.products;
      const synced = result.push.synced;
      if (pulled === 0 && result.pull.categories === 0 && synced === 0) {
        toast.success(copy.toastSyncUpToDate);
        return;
      }
      toast.success(
        `${copy.toastSyncOk} · ${pulled}${synced ? ` · ↑${synced}` : ""}`,
      );
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : copy.toastSyncError);
    },
    onSettled: async () => {
      await qc.invalidateQueries({ queryKey: PENDING_SALES_QUERY_KEY });
    },
  });

  useEffect(() => {
    if (!opts?.autoOnOnline) return;
    if (status !== "online" || autoSyncStarted) return;
    autoSyncStarted = true;
    autoSync.mutate("delta");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts?.autoOnOnline, status]);

  return {
    sync: () => manualSync.mutate("delta"),
    syncFull: () => manualSync.mutate("full"),
    isSyncing: manualSync.isPending,
    status,
  };
}
