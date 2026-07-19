import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { invoke } from "@tauri-apps/api/core";

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/")({
  component: HomePage,
});

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

function HomePage() {
  const [name, setName] = useState("");
  const [greetMsg, setGreetMsg] = useState("");

  async function greet() {
    setGreetMsg(await invoke<string>("greet", { name }));
  }

  return (
    <>
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

        <Tabs defaultValue="overview" className="mt-4">
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
    </>
  );
}
