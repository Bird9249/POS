import { cn } from "@/lib/utils";

export function StatRow({
  label,
  value,
  emphasize,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-2">
      <span className="text-muted-foreground text-sm">{label}</span>
      <span
        className={cn(
          "text-right tabular-nums",
          emphasize ? "text-lg font-semibold" : "font-medium",
        )}
      >
        {value}
      </span>
    </div>
  );
}
