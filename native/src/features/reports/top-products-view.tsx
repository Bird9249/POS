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
import { fetchTopProducts } from "@/lib/api/reports";
import { formatKip } from "@/lib/format-kip";
import {
  rangeForPreset,
  type RangePreset,
  todayYmd,
} from "./date-utils";
import { reportsCopy as copy } from "./ui-copy";

const chartConfig = {
  qty: { label: copy.qty, color: "var(--chart-1)" },
} satisfies ChartConfig;

export function TopProductsView() {
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
    queryKey: ["reports-top", from, to],
    queryFn: async () => (await fetchTopProducts(from, to, 10)).report,
    enabled: Boolean(from && to && from <= to),
  });

  const chartData =
    q.data?.items.map((row) => ({
      name:
        row.productName.length > 10
          ? `${row.productName.slice(0, 10)}…`
          : row.productName,
      qty: row.quantitySold,
    })) ?? [];

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
      ) : q.data.items.length === 0 ? (
        <p className="text-muted-foreground py-10 text-center text-sm">
          {copy.emptyTop}
        </p>
      ) : (
        <>
          <div className="rounded-2xl border p-3">
            <p className="text-muted-foreground mb-2 text-xs font-medium">
              {copy.topChart}
            </p>
            <ChartContainer config={chartConfig} className="h-[220px] w-full">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 4, left: 4, right: 12, bottom: 4 }}
              >
                <CartesianGrid horizontal={false} />
                <XAxis type="number" tickLine={false} axisLine={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={72}
                  tickLine={false}
                  axisLine={false}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="qty"
                  fill="var(--color-qty)"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ChartContainer>
          </div>

          <ul className="divide-y rounded-2xl border">
            {q.data.items.map((row) => (
              <li
                key={row.productId}
                className="flex items-start gap-3 px-3 py-3"
              >
                <span className="text-muted-foreground w-6 shrink-0 text-sm tabular-nums">
                  {row.rank}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{row.productName}</p>
                  <p className="text-muted-foreground text-xs tabular-nums">
                    {row.quantitySold} {copy.qty} · {formatKip(row.salesKip)} ·{" "}
                    {copy.stock} {row.stockQty}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
