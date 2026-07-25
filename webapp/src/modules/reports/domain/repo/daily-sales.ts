import { and, eq, gte, lt, sql } from "drizzle-orm";
import type { DbClient } from "@/server/platform/db/client";
import { sale, saleItem } from "@/server/platform/db/schema";
import type { DailySalesDTO } from "../contracts";
import { dayBoundsVientiane, todayVientiane } from "../date-range";

export async function getDailySales(
  date: string | undefined,
  db: DbClient,
): Promise<DailySalesDTO> {
  const day = date ?? todayVientiane();
  const { start, end } = dayBoundsVientiane(day);

  const [agg] = await db
    .select({
      totalSalesKip: sql<number>`coalesce(sum(${sale.amountDue}), 0)::int`,
      cashSalesKip: sql<number>`coalesce(sum(case when ${sale.paymentMethod} = 'cash' then ${sale.amountDue} else 0 end), 0)::int`,
      transferSalesKip: sql<number>`coalesce(sum(case when ${sale.paymentMethod} = 'transfer' then ${sale.amountDue} else 0 end), 0)::int`,
      billCount: sql<number>`count(*)::int`,
    })
    .from(sale)
    .where(and(gte(sale.soldAt, start), lt(sale.soldAt, end)));

  const [items] = await db
    .select({
      itemCount: sql<number>`coalesce(sum(${saleItem.quantity}), 0)::int`,
    })
    .from(saleItem)
    .innerJoin(sale, eq(saleItem.saleId, sale.id))
    .where(and(gte(sale.soldAt, start), lt(sale.soldAt, end)));

  return {
    date: day,
    totalSalesKip: Number(agg?.totalSalesKip ?? 0),
    cashSalesKip: Number(agg?.cashSalesKip ?? 0),
    transferSalesKip: Number(agg?.transferSalesKip ?? 0),
    billCount: Number(agg?.billCount ?? 0),
    itemCount: Number(items?.itemCount ?? 0),
  };
}
