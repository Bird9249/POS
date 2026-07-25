import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { getLocalDb } from "@/lib/db/client";
import { countPendingOutbox } from "@/lib/db/sales-outbox-repo";
import { syncSalesThenCatalog } from "./push-sales";

export const PENDING_SALES_QUERY_KEY = ["sales-outbox-pending-count"] as const;

let autoSyncStarted = false;

/** Pending outbox count + push-then-pull when online (Phase 7 stock conflict). */
export function useSalesSync(opts?: { autoOnOnline?: boolean }) {
  const { status } = useOnlineStatus();
  const qc = useQueryClient();
  const syncing = useRef(false);

  const pending = useQuery({
    queryKey: PENDING_SALES_QUERY_KEY,
    queryFn: async () => countPendingOutbox(await getLocalDb()),
    refetchInterval: status === "online" ? 15_000 : false,
  });

  const sync = useMutation({
    mutationFn: async () => {
      const db = await getLocalDb();
      return syncSalesThenCatalog(db);
    },
    onSettled: async () => {
      await qc.invalidateQueries({ queryKey: PENDING_SALES_QUERY_KEY });
      await qc.invalidateQueries({ queryKey: ["products"] });
      await qc.invalidateQueries({ queryKey: ["local-sales"] });
      await qc.invalidateQueries({ queryKey: ["receipt-settings"] });
    },
  });

  useEffect(() => {
    if (!opts?.autoOnOnline) return;
    if (status !== "online") return;
    if (autoSyncStarted && (pending.data ?? 0) === 0) return;

    if (syncing.current) return;
    syncing.current = true;
    autoSyncStarted = true;
    sync.mutate(undefined, {
      onSettled: () => {
        syncing.current = false;
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts?.autoOnOnline, status]);

  return {
    pendingCount: pending.data ?? 0,
    isSyncing: sync.isPending,
    lastError: sync.error,
    sync: () => sync.mutate(),
    /** Alias — always push then pull so server stock wins. */
    push: () => sync.mutate(),
    status,
    refreshPending: () =>
      qc.invalidateQueries({ queryKey: PENDING_SALES_QUERY_KEY }),
  };
}
