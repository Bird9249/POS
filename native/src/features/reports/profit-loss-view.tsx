import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { fetchProfitLoss } from "@/lib/api/reports";
import { formatKip } from "@/lib/format-kip";
import { cn } from "@/lib/utils";
import {
  rangeForPreset,
  type RangePreset,
  todayYmd,
} from "./date-utils";
import { StatRow } from "./stat-row";
import { reportsCopy as copy } from "./ui-copy";

const chartConfig = {
  revenue: { label: copy.revenue, color: "var(--chart-1)" },
  cogs: { label: copy.cogs, color: "var(--chart-3)" },
  profit: { label: copy.grossProfit, color: "var(--chart-2)" },
} satisfies ChartConfig;

export function ProfitLossView() {
  const [preset, setPreset] = useState<RangePreset>("7d");
  const initial = rangeForPreset("7d");
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);

  const applyPreset = (p: RangePreset) => {
    setPreset(p);
    if (p !== "custom") {
      const r = rangeForPreset(p);
      setFrom(r.from);
      setTo(r.to);
    }
  };

  const q = useQuery({
    queryKey: ["reports-profit", from, to],
    queryFn: async () => (await fetchProfitLoss(from, to)).report,
    enabled: Boolean(from && to && from <= to),
  });

  const chartData = q.data
    ? [
        { key: copy.revenue, value: q.data.revenueKip, fill: "var(--color-revenue)" },
        { key: copy.cogs, value: q.data.cogsKip, fill: "var(--color-cogs)" },
        {
          key: copy.grossProfit,
          value: q.data.grossProfitKip,
          fill: "var(--color-profit)",
        },
      ]
    : [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["today", copy.today],
            ["7d", copy.d7],
            ["30d", copy.d30],
            ["custom", copy.custom],
          ] as const
        ).map(([key, label]) => (
          <Button
            key={key}
            type="button"
            size="sm"
            variant={preset === key ? "default" : "outline"}
            className="rounded-xl"
            onClick={() => applyPreset(key)}
          >
            {label}
          </Button>
        ))}
      </div>

      {preset === "custom" ? (
        <div className="grid grid-cols-2 gap-2">
          <label className="space-y-1">
            <span className="text-muted-foreground text-xs">{copy.from}</span>
            <Input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value || todayYmd())}
              className="h-11 rounded-xl"
            />
          </label>
          <label className="space-y-1">
            <span className="text-muted-foreground text-xs">{copy.to}</span>
            <Input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value || todayYmd())}
              className="h-11 rounded-xl"
            />
          </label>
        </div>
      ) : null}

      {q.isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : q.isError || !q.data ? (
        <p className="text-destructive py-8 text-center text-sm">
          {copy.loadError}
        </p>
      ) : (
        <>
          <div className="divide-y rounded-2xl border px-4">
            <StatRow
              label={copy.revenue}
              value={formatKip(q.data.revenueKip)}
            />
            <StatRow label={copy.cogs} value={formatKip(q.data.cogsKip)} />
            <StatRow
              label={copy.grossProfit}
              value={formatKip(q.data.grossProfitKip)}
              emphasize
            />
            <StatRow
              label={copy.margin}
              value={
                q.data.marginPercent == null
                  ? "—"
                  : `${q.data.marginPercent}%`
              }
            />
          </div>

          <div className="rounded-2xl border p-3">
            <ChartContainer config={chartConfig} className="h-[220px] w-full">
              <BarChart data={chartData} margin={{ top: 8, left: 8, right: 8 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="key" tickLine={false} axisLine={false} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={48}
                  tickFormatter={(v) =>
                    new Intl.NumberFormat("lo-LA", {
                      notation: "compact",
                    }).format(Number(v))
                  }
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => formatKip(Number(value))}
                    />
                  }
                />
                <Bar
                  dataKey="value"
                  radius={[4, 4, 0, 0]}
                  className={cn("fill-[var(--chart-1)]")}
                />
              </BarChart>
            </ChartContainer>
          </div>
        </>
      )}
    </div>
  );
}
