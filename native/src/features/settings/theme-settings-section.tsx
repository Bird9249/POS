import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { settingsCopy as copy } from "./ui-copy";

const OPTIONS = [
  { value: "light", label: copy.themeLight, icon: Sun },
  { value: "dark", label: copy.themeDark, icon: Moon },
  { value: "system", label: copy.themeSystem, icon: Monitor },
] as const;

export function ThemeSettingsSection() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const current = mounted ? (theme ?? "system") : "system";

  return (
    <div className="space-y-3 rounded-2xl border p-4">
      <p className="text-sm font-semibold">{copy.themeSection}</p>
      <div className="grid grid-cols-3 gap-2">
        {OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const active = current === opt.value;
          return (
            <Button
              key={opt.value}
              type="button"
              variant={active ? "default" : "outline"}
              className={cn(
                "h-auto flex-col gap-1.5 rounded-xl py-3",
                !active && "text-muted-foreground",
              )}
              onClick={() => setTheme(opt.value)}
            >
              <Icon className="size-5" />
              <span className="text-xs font-medium">{opt.label}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
