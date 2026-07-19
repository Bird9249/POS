import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  Bell,
  Home as HomeIcon,
  LayoutDashboard,
  Menu,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const stats = [
  { label: "ຜູ້ໃຊ້", value: "1,284", hint: "+12% ອາທິດນີ້" },
  { label: "ອໍເດີ", value: "326", hint: "ລໍຖ້າຈັດສົ່ງ 18" },
  { label: "ລາຍໄດ້", value: "₭48.2k", hint: "ເດືອນນີ້" },
];

const activities = [
  {
    title: "ລົງທະບຽນສະມາຊິກໃໝ່",
    detail: "ບຸນມີ ໄຊຍະວົງ",
    time: "2 ນາທີຜ່ານມາ",
  },
  {
    title: "ອໍເດີ #1042",
    detail: "ຊຳລະເງິນແລ້ວ",
    time: "15 ນາທີຜ່ານມາ",
  },
  {
    title: "ອັບເດດໂປຣໄຟລ໌",
    detail: "Admin",
    time: "1 ຊົ່ວໂມງຜ່ານມາ",
  },
];

type NavId = "home" | "dashboard" | "users" | "settings";

const bottomNav: { id: NavId; label: string; icon: LucideIcon }[] = [
  { id: "home", label: "ໜ້າຫຼັກ", icon: HomeIcon },
  { id: "dashboard", label: "ແດຊບອດ", icon: LayoutDashboard },
  { id: "users", label: "ຜູ້ໃຊ້", icon: Users },
  { id: "settings", label: "ຕັ້ງຄ່າ", icon: Settings },
];

export function Home() {
  const [name, setName] = useState("");
  const [greetMsg, setGreetMsg] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeNav, setActiveNav] = useState<NavId>("home");

  async function greet() {
    setGreetMsg(await invoke<string>("greet", { name }));
  }

  function selectNav(id: NavId) {
    setActiveNav(id);
    setMenuOpen(false);
  }

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
                {bottomNav.map((item) => (
                  <Button
                    key={item.id}
                    variant={activeNav === item.id ? "secondary" : "ghost"}
                    className="justify-start"
                    onClick={() => selectNav(item.id)}
                  >
                    <item.icon data-icon="inline-start" />
                    {item.label}
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
              <DropdownMenuItem onClick={() => selectNav("settings")}>
                <Settings data-icon="inline-start" />
                ຕັ້ງຄ່າ
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="mx-auto w-full max-w-lg flex-1 overflow-y-auto px-4 py-4 pb-16">
        <section className="grid grid-cols-3 gap-2">
          {stats.map((stat) => (
            <Card key={stat.label} size="sm" className="gap-2">
              <CardHeader className="px-3">
                <CardDescription>{stat.label}</CardDescription>
                <CardTitle className="text-lg">{stat.value}</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground px-3 text-xs">
                {stat.hint}
              </CardContent>
            </Card>
          ))}
        </section>

        <Tabs defaultValue="overview">
          <TabsList className="w-full">
            <TabsTrigger value="overview" className="flex-1">
              ພາບລວມ
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex-1">
              ກິດຈະກຳ
            </TabsTrigger>
            <TabsTrigger value="tauri" className="flex-1">
              Tauri
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-3 space-y-3">
            <Card>
              <CardHeader>
                <CardTitle>ຍິນດີຕ້ອນຮັບ</CardTitle>
                <CardDescription>ໜ້ານີ້ໃຊ້ component ຈາກ shadcn/ui ເປັນຕົວຢ່າງໃນມືຖື</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Badge>Card</Badge>
                  <Badge variant="secondary">Tabs</Badge>
                  <Badge variant="outline">Sheet</Badge>
                  <Badge variant="destructive">Badge</Badge>
                </div>
                <Separator />
                <p className="text-muted-foreground text-sm">
                  ສາມາດເພີ່ມ component ໄດ້ດ້ວຍ{" "}
                  <code className="bg-muted rounded px-1.5 py-0.5 text-xs">
                    bunx shadcn@latest add …
                  </code>
                </p>
              </CardContent>
              <CardFooter className="gap-2">
                <Button className="flex-1">ເລີ່ມໃຊ້ງານ</Button>
                <Button variant="outline" className="flex-1">
                  ເບິ່ງເອກະສານ
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="mt-3">
            <Card>
              <CardHeader>
                <CardTitle>ກິດຈະກຳຫຼ້າສຸດ</CardTitle>
                <CardDescription>ຕົວຢ່າງລາຍການໃນແອັບ</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {activities.map((item, index) => (
                  <div key={item.title}>
                    {index > 0 ? <Separator className="mb-3" /> : null}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {item.title}
                        </p>
                        <p className="text-muted-foreground truncate text-xs">
                          {item.detail}
                        </p>
                      </div>
                      <span className="text-muted-foreground shrink-0 text-xs">
                        {item.time}
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tauri" className="mt-3">
            <Card>
              <CardHeader>
                <CardTitle>ທົດລອງເອີ້ນ Rust</CardTitle>
                <CardDescription>ໃຊ້ໄດ້ເມື່ອເປີດຜ່ານ Tauri (`android:dev` / `tauri dev`)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="greet-input">ຊື່ຂອງທ່ານ</Label>
                  <Input
                    id="greet-input"
                    value={name}
                    onChange={(e) => setName(e.currentTarget.value)}
                    placeholder="ພິມຊື່..."
                  />
                </div>
                {greetMsg ? (
                  <p className="bg-muted rounded-lg px-3 py-2 text-sm">
                    {greetMsg}
                  </p>
                ) : null}
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  onClick={() => {
                    void greet();
                  }}
                >
                  ທັກທາຍຈາກ Rust
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <nav
        aria-label="ເມນູດ້ານລຸ່ມ"
        className="bg-background supports-backdrop-filter:bg-background/95 supports-backdrop-filter:backdrop-blur-sm fixed inset-x-0 bottom-0 z-40 border-t"
      >
        <div className="mx-auto flex h-14 max-w-lg items-stretch">
          {bottomNav.map((item) => {
            const active = activeNav === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => selectNav(item.id)}
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
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
