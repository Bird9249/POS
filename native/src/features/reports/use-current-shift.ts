import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { getCurrentShift, openShift, type Shift } from "@/lib/api/shifts";
import { getLocalDb } from "@/lib/db/client";
import {
  cacheOpenShift,
  clearCachedOpenShift,
  getCachedOpenShift,
} from "@/lib/db/shift-repo";
import { CURRENT_SHIFT_QUERY_KEY } from "./shift-panel";
import { shiftCopy as copy } from "./ui-copy";

async function persistShift(shift: Shift | null) {
  const db = await getLocalDb();
  if (!shift || shift.status !== "open") {
    await clearCachedOpenShift(db);
    return;
  }
  await cacheOpenShift(db, {
    id: shift.id,
    openedAt: shift.openedAt,
  });
}

function shiftFromCache(
  cached: Awaited<ReturnType<typeof getCachedOpenShift>>,
): Shift | null {
  if (!cached) return null;
  return {
    id: cached.id,
    openedBy: "",
    openedAt: cached.openedAt,
    closedAt: null,
    status: "open",
    expectedCashKip: null,
    countedCashKip: null,
    cashDiffKip: null,
    totalSalesKip: null,
    cashSalesKip: null,
    transferSalesKip: null,
    billCount: null,
    note: null,
  };
}

/** Current open shift — online API + local cache for offline gate. */
export function useCurrentShift(opts?: { enabled?: boolean }) {
  const { status } = useOnlineStatus();
  const online = status === "online";
  const enabled = opts?.enabled ?? true;

  return useQuery({
    queryKey: CURRENT_SHIFT_QUERY_KEY,
    queryFn: async () => {
      const db = await getLocalDb();
      if (online) {
        try {
          const res = await getCurrentShift();
          await persistShift(res.shift);
          return res.shift;
        } catch {
          return shiftFromCache(await getCachedOpenShift(db));
        }
      }
      return shiftFromCache(await getCachedOpenShift(db));
    },
    enabled,
    refetchInterval: online && enabled ? 60_000 : false,
  });
}

export function useOpenShiftMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: openShift,
    onSuccess: async (res) => {
      await persistShift(res.shift);
      toast.success(copy.openOk);
      await qc.invalidateQueries({ queryKey: CURRENT_SHIFT_QUERY_KEY });
    },
    onError: () => toast.error(copy.openError),
  });
}

export async function markShiftClosedLocally() {
  const db = await getLocalDb();
  await clearCachedOpenShift(db);
}
