import { useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Bell, Menu, Settings } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { navItems } from "@/lib/nav";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="bg-background text-foreground flex h-dvh flex-col overflow-hidden">
      <header className="bg-background shrink-0 border-b">
        <div className="mx-auto flex h-14 max-w-lg items-center gap-3 px-4">
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="ເປີດເມນູ">
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72">
              <SheetHeader>
                <SheetTitle>Starter Admin</SheetTitle>
                <SheetDescription>ເມນູຕົວຢ່າງໃນມືຖື</SheetDescription>
              </SheetHeader>
              <nav className="mt-4 flex flex-col gap-1 px-2">
                {navItems.map((item) => (
                  <Button
                    key={item.to}
                    variant={pathname === item.to ? "secondary" : "ghost"}
                    className="justify-start"
                    asChild
                  >
                    <Link to={item.to} onClick={() => setMenuOpen(false)}>
                      <item.icon data-icon="inline-start" />
                      {item.label}
                    </Link>
                  </Button>
                ))}
              </nav>
            </SheetContent>
          </Sheet>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">Starter Admin</p>
            <p className="text-muted-foreground truncate text-xs">
              ໜ້າຫຼັກຕົວຢ່າງ (shadcn)
            </p>
          </div>

          <Badge variant="secondary">ຕົວຢ່າງ</Badge>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar size="sm">
                  <AvatarFallback>SA</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>ບັນຊີຂອງຂ້ອຍ</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Bell data-icon="inline-start" />
                ການແຈ້ງເຕືອນ
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/settings">
                  <Settings data-icon="inline-start" />
                  ຕັ້ງຄ່າ
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="mx-auto w-full max-w-lg flex-1 overflow-y-auto px-4 py-4 pb-16">
        {children}
      </main>

      <nav
        aria-label="ເມນູດ້ານລຸ່ມ"
        className="bg-background supports-backdrop-filter:bg-background/95 supports-backdrop-filter:backdrop-blur-sm fixed inset-x-0 bottom-0 z-40 border-t"
      >
        <div className="mx-auto flex h-14 max-w-lg items-stretch">
          {navItems.map((item) => {
            const active = pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "text-muted-foreground hover:text-foreground flex flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors",
                  active && "text-foreground",
                )}
              >
                <item.icon
                  className={cn("size-5", active && "text-primary")}
                  strokeWidth={active ? 2.4 : 2}
                />
                <span className={cn(active && "font-semibold")}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
