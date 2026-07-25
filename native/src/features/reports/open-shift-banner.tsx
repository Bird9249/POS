import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { useCurrentShift, useOpenShiftMutation } from "./use-current-shift";
import { shiftCopy as copy } from "./ui-copy";

/** Block banner + open button when there is no open shift. */
export function OpenShiftBanner() {
  const { status } = useOnlineStatus();
  const online = status === "online";
  const current = useCurrentShift();
  const openMut = useOpenShiftMutation();

  if (current.isLoading) return null;
  if (current.data) return null;

  return (
    <Alert className="rounded-2xl" variant="destructive">
      <AlertDescription className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <span>{copy.noShift}</span>
        {online ? (
          <Button
            type="button"
            size="sm"
            className="h-9 shrink-0 rounded-xl"
            disabled={openMut.isPending}
            onClick={() => openMut.mutate()}
          >
            {openMut.isPending ? copy.opening : copy.open}
          </Button>
        ) : (
          <span className="text-xs opacity-90">{copy.offline}</span>
        )}
      </AlertDescription>
    </Alert>
  );
}
