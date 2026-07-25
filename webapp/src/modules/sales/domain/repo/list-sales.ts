import { and, desc, eq, lt, sql } from "drizzle-orm";
import type { DbClient } from "@/server/platform/db/client";
import { sale, saleItem } from "@/server/platform/db/schema";

export type ListSalesQuery = {
  limit: number;
  cursor?: string;
  /** When false, only sales by this user */
  soldBy?: string;
};

export async function listSales(query: ListSalesQuery, db: DbClient) {
  const limit = query.limit;
  const conditions = [];
  if (query.soldBy) {
    conditions.push(eq(sale.soldBy, query.soldBy));
  }
  if (query.cursor) {
    const cursorDate = new Date(query.cursor);
    if (!Number.isNaN(cursorDate.getTime())) {
      conditions.push(lt(sale.soldAt, cursorDate));
    }
  }

  const rows = await db
    .select()
    .from(sale)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(sale.soldAt))
    .limit(limit + 1);

  const page = rows.slice(0, limit);
  const nextCursor =
    rows.length > limit
      ? page[page.length - 1]!.soldAt.toISOString()
      : null;

  return { items: page, nextCursor };
}

export async function getSaleWithItems(saleId: string, db: DbClient) {
  const [row] = await db.select().from(sale).where(eq(sale.id, saleId)).limit(1);
  if (!row) return null;
  const items = await db
    .select()
    .from(saleItem)
    .where(eq(saleItem.saleId, saleId));
  return { sale: row, items };
}

export async function countSalesByUser(userId: string, db: DbClient) {
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(sale)
    .where(eq(sale.soldBy, userId));
  return Number(row?.n ?? 0);
}
