import { and, desc, eq, gte, lt, sql } from "drizzle-orm";
import type { DbClient } from "@/server/platform/db/client";
import { product, sale, saleItem } from "@/server/platform/db/schema";
import type { TopProductsDTO } from "../contracts";
import { rangeBoundsVientiane } from "../date-range";

/** Rank by quantity sold (locked criterion). Tie-break: sales kip desc. */
export async function getTopProducts(
  from: string,
  to: string,
  limit: number,
  db: DbClient,
): Promise<TopProductsDTO> {
  const { start, end } = rangeBoundsVientiane(from, to);
  const capped = Math.min(10, Math.max(1, limit));

  const rows = await db
    .select({
      productId: saleItem.productId,
      productName: sql<string>`max(${saleItem.productName})`,
      quantitySold: sql<number>`sum(${saleItem.quantity})::int`,
      salesKip: sql<number>`sum(${saleItem.lineTotal})::int`,
      stockQty: product.stockQty,
    })
    .from(saleItem)
    .innerJoin(sale, eq(saleItem.saleId, sale.id))
    .innerJoin(product, eq(saleItem.productId, product.id))
    .where(and(gte(sale.soldAt, start), lt(sale.soldAt, end)))
    .groupBy(saleItem.productId, product.stockQty)
    .orderBy(
      desc(sql`sum(${saleItem.quantity})`),
      desc(sql`sum(${saleItem.lineTotal})`),
    )
    .limit(capped);

  return {
    from,
    to,
    items: rows.map((r, i) => ({
      rank: i + 1,
      productId: r.productId,
      productName: r.productName,
      quantitySold: Number(r.quantitySold),
      salesKip: Number(r.salesKip),
      stockQty: r.stockQty,
    })),
  };
}
