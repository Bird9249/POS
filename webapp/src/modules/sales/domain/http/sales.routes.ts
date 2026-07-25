import { Elysia } from "elysia";
import { Permissions } from "@/modules/roles/domain/contracts/permissions";
import { requirePermission } from "@/modules/roles/domain/http/middleware";
import { serverContext } from "@/server/platform/http/context";
import {
  CreateSaleSchema,
  ListSalesQuerySchema,
  toSaleDTO,
} from "../contracts";
import { createSale } from "../repo/create-sale";
import { getSaleWithItems, listSales } from "../repo/list-sales";

function canReadCost(permissions: string[]) {
  return permissions.includes(Permissions.products.cost_read);
}

function canReadAll(permissions: string[]) {
  return permissions.includes(Permissions.sales.read_all);
}

export const salesHttpRoutes = new Elysia()
  .use(serverContext)
  .post(
    "/",
    async ({ db, body, user, set }) => {
      const result = await createSale(body, user.id, db);
      if (!result.ok) {
        set.status =
          result.error === "PRODUCT_NOT_FOUND"
            ? 404
            : result.error === "SHIFT_REQUIRED"
              ? 409
              : 400;
        return { error: result.error };
      }
      set.status = result.created ? 201 : 200;
      return {
        sale: toSaleDTO(result.sale, result.items, {
          includeCost: true,
        }),
        created: result.created,
      };
    },
    {
      beforeHandle: requirePermission(Permissions.sales.create),
      body: CreateSaleSchema,
    },
  )
  .get(
    "/",
    async ({ db, query, user, permissions }) => {
      const scopeAll = canReadAll(permissions);
      const { items, nextCursor } = await listSales(
        {
          limit: query.limit,
          cursor: query.cursor,
          soldBy: scopeAll ? undefined : user.id,
        },
        db,
      );
      const includeCost = canReadCost(permissions);
      return {
        items: items.map((row) => toSaleDTO(row, undefined, { includeCost })),
        nextCursor,
      };
    },
    {
      beforeHandle: requirePermission(Permissions.sales.read),
      query: ListSalesQuerySchema,
    },
  )
  .get(
    "/:id",
    async ({ db, params, user, permissions, set }) => {
      const found = await getSaleWithItems(params.id, db);
      if (!found) {
        set.status = 404;
        return { error: "NOT_FOUND" };
      }
      if (
        !canReadAll(permissions) &&
        found.sale.soldBy !== user.id
      ) {
        set.status = 403;
        return { error: "FORBIDDEN" };
      }
      return {
        sale: toSaleDTO(found.sale, found.items, {
          includeCost: canReadCost(permissions),
        }),
      };
    },
    {
      beforeHandle: requirePermission(Permissions.sales.read),
    },
  );
