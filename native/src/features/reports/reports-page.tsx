import { AnimatePresence, motion } from "motion/react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  type LucideIcon,
  TrendingUp,
  Trophy,
} from "lucide-react";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Perm, hasPermission } from "@/features/auth/permissions";
import {
  getSessionPermissions,
  useSession,
} from "@/features/auth/use-session";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { cn } from "@/lib/utils";
import { DailySalesView } from "./daily-sales-view";
import { ProfitLossView } from "./profit-loss-view";
import { ShiftPanel } from "./shift-panel";
import { TopProductsView } from "./top-products-view";
import { reportsCopy as copy } from "./ui-copy";

type Panel = "menu" | "daily" | "profit" | "top" | "shift";

const MENU: Array<{
  id: Exclude<Panel, "menu">;
  label: string;
  icon: LucideIcon;
}> = [
  { id: "daily", label: copy.daily, icon: CalendarDays },
  { id: "profit", label: copy.profit, icon: TrendingUp },
  { id: "top", label: copy.top, icon: Trophy },
  { id: "shift", label: copy.shift, icon: Clock3 },
];

export function ReportsPage() {
  const { data: session } = useSession();
  const permissions = getSessionPermissions(
    session as { permissions?: string[] } | null | undefined,
  );
  const canReports = hasPermission(permissions, Perm.reportsRead);
  const { status } = useOnlineStatus();
  const online = status === "online";
  const [panel, setPanel] = useState<Panel>("menu");

  if (!canReports) {
    return (
      <div className="p-4">
        <Alert>
          <AlertDescription>{copy.noPermission}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const title =
    panel === "menu"
      ? copy.title
      : MENU.find((m) => m.id === panel)?.label ?? copy.title;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex shrink-0 items-center gap-2 border-b px-1 py-3">
        {panel !== "menu" ? (
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="size-9 rounded-xl"
            onClick={() => setPanel("menu")}
            aria-label={copy.back}
          >
            <ChevronLeft className="size-5" />
          </Button>
        ) : null}
        <h1 className="font-heading text-lg font-semibold">{title}</h1>
      </header>

      {!online ? (
        <div className="p-1 pt-3">
          <Alert>
            <AlertDescription>{copy.offline}</AlertDescription>
          </Alert>
        </div>
      ) : (
        <div
          className={cn(
            "min-h-0 flex-1 pt-3",
            panel === "shift" ? "flex flex-col overflow-hidden" : "overflow-y-auto",
          )}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={panel}
              initial={{ opacity: 0, x: panel === "menu" ? -12 : 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: panel === "menu" ? 12 : -12 }}
              transition={{ duration: 0.18 }}
              className={cn(
                panel === "shift" &&
                  "flex h-full min-h-0 w-full flex-1 flex-col",
              )}
            >
              {panel === "menu" ? (
                <ul className="divide-y rounded-2xl border">
                  {MENU.map((item) => {
                    const Icon = item.icon;
                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          className="flex w-full items-center gap-3 px-4 py-4 text-left text-base font-medium"
                          onClick={() => setPanel(item.id)}
                        >
                          <span className="bg-muted text-foreground flex size-10 shrink-0 items-center justify-center rounded-xl">
                            <Icon className="size-5" aria-hidden />
                          </span>
                          <span className="min-w-0 flex-1">{item.label}</span>
                          <ChevronRight className="text-muted-foreground size-4 shrink-0" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
              {panel === "daily" ? <DailySalesView /> : null}
              {panel === "profit" ? <ProfitLossView /> : null}
              {panel === "top" ? <TopProductsView /> : null}
              {panel === "shift" ? <ShiftPanel /> : null}
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
