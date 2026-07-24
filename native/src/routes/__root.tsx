import {
  Navigate,
  Outlet,
  createRootRoute,
  useRouterState,
} from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import {
  Card,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { useSession } from "@/features/auth/use-session";

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { data, isPending } = useSession();
  const isLogin = pathname === "/login";
  const hasSession = Boolean(data?.session);

  if (isPending && !isLogin) {
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

  if (!isLogin && !hasSession) {
    return <Navigate to="/login" />;
  }

  if (isLogin && hasSession) {
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
