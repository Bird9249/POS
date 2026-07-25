import { Elysia } from "elysia";
import { Permissions } from "@/modules/roles/domain/contracts/permissions";
import { requirePermission } from "@/modules/roles/domain/http/middleware";
import { serverContext } from "@/server/platform/http/context";
import {
  DailySalesQuerySchema,
  ProfitLossQuerySchema,
  TopProductsQuerySchema,
} from "../contracts";
import { getDailySales } from "../repo/daily-sales";
import { getProfitLoss } from "../repo/profit-loss";
import { getTopProducts } from "../repo/top-products";

export const reportsHttpRoutes = new Elysia()
  .use(serverContext)
  .get(
    "/daily-sales",
    async ({ db, query, set }) => {
      try {
        const report = await getDailySales(query.date, db);
        return { report };
      } catch {
        set.status = 400;
        return { error: "INVALID_DATE" };
      }
    },
    {
      beforeHandle: requirePermission(Permissions.reports.read),
      query: DailySalesQuerySchema,
    },
  )
  .get(
    "/profit-loss",
    async ({ db, query, set }) => {
      try {
        const report = await getProfitLoss(query.from, query.to, db);
        return { report };
      } catch (e) {
        set.status = 400;
        return {
          error: e instanceof Error ? e.message : "INVALID_RANGE",
        };
      }
    },
    {
      beforeHandle: requirePermission(Permissions.reports.read),
      query: ProfitLossQuerySchema,
    },
  )
  .get(
    "/top-products",
    async ({ db, query, set }) => {
      try {
        const report = await getTopProducts(
          query.from,
          query.to,
          query.limit,
          db,
        );
        return { report };
      } catch (e) {
        set.status = 400;
        return {
          error: e instanceof Error ? e.message : "INVALID_RANGE",
        };
      }
    },
    {
      beforeHandle: requirePermission(Permissions.reports.read),
      query: TopProductsQuerySchema,
    },
  );
