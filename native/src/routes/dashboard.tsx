import { createFileRoute } from "@tanstack/react-router";
import { LayoutDashboard } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const Route = createFileRoute("/dashboard")({
  component: Page,
});

function Page() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LayoutDashboard className="size-5" />
          ແດຊບອດ
        </CardTitle>
        <CardDescription>ໜ້າຕົວຢ່າງສຳລັບ TanStack Router</CardDescription>
      </CardHeader>
      <CardContent className="text-muted-foreground text-sm">
        ເສັ້ນທາງນີ້ແມ່ນ{" "}
        <code className="bg-muted rounded px-1.5 py-0.5">/dashboard</code>
      </CardContent>
    </Card>
  );
}
