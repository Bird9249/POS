import {
  Navigate,
  Outlet,
  createRootRoute,
  useRouterState,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import {
  Card,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import {
  clearSessionCache,
  isOfflineGraceValid,
  readSessionCache,
} from "@/features/auth/session-cache";
import {
  usePersistSessionCache,
  useSession,
} from "@/features/auth/use-session";
import { useOnlineStatus } from "@/hooks/use-online-status";

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { data, isPending, refetch, error } = useSession();
  const { status: network } = useOnlineStatus();
  const isLogin = pathname === "/login";
  const liveSession = Boolean(data?.session);

  usePersistSessionCache(
    data as {
      session?: unknown;
      user?: { id?: string; name?: string | null; email?: string | null };
      permissions?: string[];
    } | null,
  );

  const [offlineAllowed, setOfflineAllowed] = useState(() =>
    isOfflineGraceValid(readSessionCache()),
  );

  // Re-check grace when network flips; force session refresh when back online.
  useEffect(() => {
    if (network === "offline") {
      setOfflineAllowed(isOfflineGraceValid(readSessionCache()));
      return;
    }
    if (network !== "online") return;

    void (async () => {
      try {
        const res = await refetch();
        const session = (res as { data?: { session?: unknown } } | void)?.data
          ?.session;
        if (!session) {
          clearSessionCache();
          setOfflineAllowed(false);
        }
      } catch {
        clearSessionCache();
        setOfflineAllowed(false);
      }
    })();
  }, [network, refetch]);

  useEffect(() => {
    if (error && network === "online" && !liveSession) {
      clearSessionCache();
      setOfflineAllowed(false);
    }
  }, [error, network, liveSession]);

  const hasAccess =
    liveSession || (network === "offline" && offlineAllowed);

  if (isPending && !isLogin && !offlineAllowed) {
    return (
      <div className="bg-background flex h-dvh items-center justify-center px-4">
        <Card size="sm" className="w-full max-w-xs text-center">
          <CardContent className="pt-(--card-spacing)">
            <CardDescription>ກຳລັງໂຫຼດ…</CardDescription>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isLogin && !hasAccess) {
    return <Navigate to="/login" />;
  }

  if (isLogin && liveSession) {
    return <Navigate to="/checkout" />;
  }

  if (isLogin) {
    return <Outlet />;
  }

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
