import { and, eq, sql } from "drizzle-orm";
import type { DbClient } from "@/server/platform/db/client";
import { sale, saleItem } from "@/server/platform/db/schema";
import type { ShiftSummaryDTO } from "../contracts";

export async function summarizeShiftSales(
  shiftId: string,
  db: DbClient,
): Promise<ShiftSummaryDTO> {
  const [agg] = await db
    .select({
      totalSalesKip: sql<number>`coalesce(sum(${sale.amountDue}), 0)::int`,
      cashSalesKip: sql<number>`coalesce(sum(case when ${sale.paymentMethod} = 'cash' then ${sale.amountDue} else 0 end), 0)::int`,
      transferSalesKip: sql<number>`coalesce(sum(case when ${sale.paymentMethod} = 'transfer' then ${sale.amountDue} else 0 end), 0)::int`,
      expectedCashKip: sql<number>`coalesce(sum(case when ${sale.paymentMethod} = 'cash' then coalesce(${sale.amountReceived}, 0) - coalesce(${sale.changeAmount}, 0) else 0 end), 0)::int`,
      billCount: sql<number>`count(*)::int`,
    })
    .from(sale)
    .where(eq(sale.shiftId, shiftId));

  const [items] = await db
    .select({
      itemCount: sql<number>`coalesce(sum(${saleItem.quantity}), 0)::int`,
    })
    .from(saleItem)
    .innerJoin(sale, eq(saleItem.saleId, sale.id))
    .where(and(eq(sale.shiftId, shiftId)));

  return {
    totalSalesKip: Number(agg?.totalSalesKip ?? 0),
    cashSalesKip: Number(agg?.cashSalesKip ?? 0),
    transferSalesKip: Number(agg?.transferSalesKip ?? 0),
    expectedCashKip: Number(agg?.expectedCashKip ?? 0),
    billCount: Number(agg?.billCount ?? 0),
    itemCount: Number(items?.itemCount ?? 0),
  };
}
