import { and, eq, gte, lt, sql } from "drizzle-orm";
import type { DbClient } from "@/server/platform/db/client";
import { sale, saleItem } from "@/server/platform/db/schema";
import type { ProfitLossDTO } from "../contracts";
import { rangeBoundsVientiane } from "../date-range";

/**
 * Gross Profit = Revenue − COGS
 * Revenue = Σ amountDue (net after discounts)
 * COGS = Σ costPrice × quantity (snapshot at sale)
 * Equivalent to Σ (sell − cost) × qty when no discounts.
 */
export async function getProfitLoss(
  from: string,
  to: string,
  db: DbClient,
): Promise<ProfitLossDTO> {
  const { start, end } = rangeBoundsVientiane(from, to);

  const [rev] = await db
    .select({
      revenueKip: sql<number>`coalesce(sum(${sale.amountDue}), 0)::int`,
    })
    .from(sale)
    .where(and(gte(sale.soldAt, start), lt(sale.soldAt, end)));

  const [cogs] = await db
    .select({
      cogsKip: sql<number>`coalesce(sum(${saleItem.costPrice} * ${saleItem.quantity}), 0)::int`,
    })
    .from(saleItem)
    .innerJoin(sale, eq(saleItem.saleId, sale.id))
    .where(and(gte(sale.soldAt, start), lt(sale.soldAt, end)));

  const revenueKip = Number(rev?.revenueKip ?? 0);
  const cogsKip = Number(cogs?.cogsKip ?? 0);
  const grossProfitKip = revenueKip - cogsKip;
  const marginPercent =
    revenueKip > 0
      ? Math.round((grossProfitKip / revenueKip) * 1000) / 10
      : null;

  return {
    from,
    to,
    revenueKip,
    cogsKip,
    grossProfitKip,
    marginPercent,
  };
}
