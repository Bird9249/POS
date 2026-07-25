import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { DatePicker } from "@/components/date-picker";
import { Spinner } from "@/components/ui/spinner";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { fetchDailySales } from "@/lib/api/reports";
import { formatKip } from "@/lib/format-kip";
import { formatYmd, parseYmd, todayYmd } from "./date-utils";
import { StatRow } from "./stat-row";
import { reportsCopy as copy } from "./ui-copy";

const chartConfig = {
  cash: { label: copy.cash, color: "var(--chart-1)" },
  transfer: { label: copy.transfer, color: "var(--chart-3)" },
} satisfies ChartConfig;

export function DailySalesView() {
  const [date, setDate] = useState(todayYmd);
  const q = useQuery({
    queryKey: ["reports-daily", date],
    queryFn: async () => (await fetchDailySales(date)).report,
  });

  const chartData = q.data
    ? [
        {
          name: copy.paymentSplit,
          cash: q.data.cashSalesKip,
          transfer: q.data.transferSalesKip,
        },
      ]
    : [];

  return (
    <div className="space-y-4">
      <label className="block space-y-1.5">
        <span className="text-muted-foreground text-xs font-medium">
          {copy.date}
        </span>
        <DatePicker
          mode="single"
          value={parseYmd(date)}
          onChange={(d) => setDate(d ? formatYmd(d) : todayYmd())}
          className="h-11 w-full rounded-xl"
        />
      </label>

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
              label={copy.totalSales}
              value={formatKip(q.data.totalSalesKip)}
              emphasize
            />
            <StatRow label={copy.cash} value={formatKip(q.data.cashSalesKip)} />
            <StatRow
              label={copy.transfer}
              value={formatKip(q.data.transferSalesKip)}
            />
            <StatRow label={copy.bills} value={String(q.data.billCount)} />
            <StatRow label={copy.items} value={String(q.data.itemCount)} />
          </div>

          <div className="rounded-2xl border p-3">
            <p className="text-muted-foreground mb-2 text-xs font-medium">
              {copy.paymentSplit}
            </p>
            <ChartContainer config={chartConfig} className="h-[200px] w-full">
              <BarChart data={chartData} margin={{ top: 8, left: 8, right: 8 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} />
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
                  dataKey="cash"
                  fill="var(--color-cash)"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="transfer"
                  fill="var(--color-transfer)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </div>
        </>
      )}
    </div>
  );
}
