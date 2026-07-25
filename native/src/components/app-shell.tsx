import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { LogOut, Settings, Users } from "lucide-react";
import { toast } from "sonner";

import { AppLogo } from "@/components/app-logo";
import { OnlinePill } from "@/components/online-pill";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  canAccessSettings,
  canAccessUsers,
  filterNavByPermissions,
  POS_NAV_ITEMS,
  SETTINGS_NAV_ITEM,
  USERS_NAV_ITEM,
} from "@/features/auth/nav-access";
import { getSessionPermissions, useSession } from "@/features/auth/use-session";
import { authClient } from "@/lib/api/auth-client";
import { getLocalDb } from "@/lib/db/client";
import { navIcons } from "@/lib/nav";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: ReactNode }) {
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { data } = useSession();
  const permissions = getSessionPermissions(
    data as { permissions?: string[] } | null | undefined,
  );
  const items = useMemo(
    () => filterNavByPermissions(POS_NAV_ITEMS, permissions),
    [permissions],
  );
  const showSettings = canAccessSettings(permissions);
  const showUsers = canAccessUsers(permissions);
  const userName = data?.user?.name || data?.user?.email || "ຜູ້ໃຊ້";
  const initials = userName.slice(0, 2).toUpperCase();

  useEffect(() => {
    void getLocalDb().catch(() => {});
  }, []);

  async function confirmSignOut() {
    setSigningOut(true);
    try {
      await authClient.signOut();
      setSignOutOpen(false);
      toast.success("ອອກຈາກລະບົບສຳເລັດ");
      await navigate({ to: "/login" });
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <div className="bg-background text-foreground flex h-dvh flex-col overflow-hidden pt-[env(safe-area-inset-top)]">
      <header className="bg-background shrink-0 border-b">
        <div className="mx-auto flex h-14 max-w-lg items-center gap-3 px-4">
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <AppLogo size="sm" className="shrink-0" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">POS</p>
              <p className="text-muted-foreground truncate text-xs">{userName}</p>
            </div>
          </div>

          <OnlinePill />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-11 rounded-full"
                aria-label="ບັນຊີ"
              >
                <Avatar size="sm">
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>ບັນຊີ</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {showUsers ? (
                <DropdownMenuItem
                  onSelect={() => {
                    void navigate({ to: USERS_NAV_ITEM.to });
                  }}
                >
                  <Users data-icon="inline-start" />
                  {USERS_NAV_ITEM.label}
                </DropdownMenuItem>
              ) : null}
              {showSettings ? (
                <DropdownMenuItem
                  onSelect={() => {
                    void navigate({ to: SETTINGS_NAV_ITEM.to });
                  }}
                >
                  <Settings data-icon="inline-start" />
                  {SETTINGS_NAV_ITEM.label}
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuItem onSelect={() => setSignOutOpen(true)}>
                <LogOut data-icon="inline-start" />
                ອອກຈາກລະບົບ
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <AlertDialog open={signOutOpen} onOpenChange={setSignOutOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ອອກຈາກລະບົບບໍ?</AlertDialogTitle>
            <AlertDialogDescription>
              ທ່ານຈະຕ້ອງເຂົ້າລະບົບໃໝ່ເພື່ອໃຊ້ງານຕໍ່
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={signingOut}>ຍົກເລີກ</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={signingOut}
              onClick={(e) => {
                e.preventDefault();
                void confirmSignOut();
              }}
            >
              {signingOut ? "ກຳລັງອອກ…" : "ອອກຈາກລະບົບ"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <main className="mx-auto flex w-full max-w-lg min-h-0 flex-1 flex-col overflow-y-auto px-4 py-4 pb-20">
        {children}
      </main>

      <nav
        aria-label="ເມນູດ້ານລຸ່ມ"
        className="bg-background supports-backdrop-filter:bg-background/95 supports-backdrop-filter:backdrop-blur-sm fixed inset-x-0 bottom-0 z-40 border-t pb-[env(safe-area-inset-bottom)]"
      >
        <div className="mx-auto flex h-14 max-w-lg items-stretch">
          {items.map((item) => {
            const Icon = navIcons[item.to];
            const active = pathname === item.to;
            return (
              <Button
                key={item.to}
                variant={active ? "secondary" : "ghost"}
                className={cn(
                  "h-auto flex-1 flex-col gap-1 rounded-none py-2 text-[11px] font-medium",
                  !active && "text-muted-foreground",
                )}
                asChild
              >
                <Link to={item.to}>
                  <Icon
                    className={cn("size-5", active && "text-primary")}
                    strokeWidth={active ? 2.4 : 2}
                  />
                  <span className={cn(active && "font-semibold")}>
                    {item.label}
                  </span>
                </Link>
              </Button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
