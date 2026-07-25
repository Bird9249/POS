import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { getLocalDb } from "@/lib/db/client";
import { countPendingOutbox } from "@/lib/db/sales-outbox-repo";
import { syncSalesThenCatalog, pushSalesOutbox } from "./push-sales";

export const PENDING_SALES_QUERY_KEY = ["sales-outbox-pending-count"] as const;

let autoPushStarted = false;

/** Pending outbox count + push-then-pull when online. */
export function useSalesSync(opts?: { autoOnOnline?: boolean }) {
  const { status } = useOnlineStatus();
  const qc = useQueryClient();
  const pushing = useRef(false);

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
    },
  });

  const pushOnly = useMutation({
    mutationFn: async () => {
      const db = await getLocalDb();
      return pushSalesOutbox(db);
    },
    onSettled: async () => {
      await qc.invalidateQueries({ queryKey: PENDING_SALES_QUERY_KEY });
    },
  });

  useEffect(() => {
    if (!opts?.autoOnOnline) return;
    if (status !== "online") return;
    if (autoPushStarted && (pending.data ?? 0) === 0) return;

    if (pushing.current) return;
    pushing.current = true;
    autoPushStarted = true;
    pushOnly.mutate(undefined, {
      onSettled: () => {
        pushing.current = false;
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts?.autoOnOnline, status]);

  return {
    pendingCount: pending.data ?? 0,
    isSyncing: sync.isPending || pushOnly.isPending,
    sync: () => sync.mutate(),
    push: () => pushOnly.mutate(),
    status,
    refreshPending: () =>
      qc.invalidateQueries({ queryKey: PENDING_SALES_QUERY_KEY }),
  };
}
