import { Elysia } from "elysia";
import { Permissions } from "@/modules/roles/domain/contracts/permissions";
import { requirePermission } from "@/modules/roles/domain/http/middleware";
import { serverContext } from "@/server/platform/http/context";
import {
  AdjustStockSchema,
  CreateProductSchema,
  IdParamSchema,
  ListProductsQuerySchema,
  SyncProductsQuerySchema,
  toProductDTO,
  UpdateProductSchema,
  type StockAdjustmentDTO,
} from "../contracts";
import { adjustStock, listStockAdjustments } from "../repo/adjust-stock";
import { createProduct } from "../repo/create";
import { getProductById } from "../repo/get-by-id";
import { listProducts } from "../repo/list";
import { syncCatalog } from "../repo/sync-catalog";
import { softDeleteProductService } from "../service/soft-delete-product";
import { updateProductService } from "../service/update-product";

function canReadCost(permissions: string[]) {
  return permissions.includes(Permissions.products.cost_read);
}

function toAdjustmentDTO(row: {
  id: string;
  productId: string;
  type: string;
  quantity: number;
  reason: string;
  adjustedBy: string | null;
  stockBefore: number;
  stockAfter: number;
  adjustedAt: Date;
}): StockAdjustmentDTO {
  return {
    id: row.id,
    productId: row.productId,
    type: row.type as StockAdjustmentDTO["type"],
    quantity: row.quantity,
    reason: row.reason,
    adjustedBy: row.adjustedBy,
    stockBefore: row.stockBefore,
    stockAfter: row.stockAfter,
    adjustedAt: row.adjustedAt,
  };
}

export const productsHttpRoutes = new Elysia()
  .use(serverContext)
  .get(
    "/",
    async ({ db, query, permissions }) => {
      const { items, nextCursor } = await listProducts(query, db);
      const includeCost = canReadCost(permissions);
      return {
        items: items.map((row) => toProductDTO(row, { includeCost })),
        nextCursor,
      };
    },
    {
      beforeHandle: requirePermission(Permissions.products.read),
      query: ListProductsQuerySchema,
    },
  )
  // Must be before /:id so "sync" is not captured as an id
  .get(
    "/sync",
    async ({ db, query, permissions }) => {
      const includeCost = canReadCost(permissions);
      const { products, categories } = await syncCatalog(
        { since: query.since },
        db,
      );
      const serverTime = new Date();
      return {
        serverTime,
        products: products.map((row) => toProductDTO(row, { includeCost })),
        categories,
      };
    },
    {
      beforeHandle: requirePermission(Permissions.products.read),
      query: SyncProductsQuerySchema,
    },
  )
  .get(
    "/:id",
    async ({ db, params, permissions, status }) => {
      const row = await getProductById(params.id, db);
      if (!row) return status(404, { error: "NOT_FOUND" });
      return toProductDTO(row, { includeCost: canReadCost(permissions) });
    },
    {
      beforeHandle: requirePermission(Permissions.products.read),
      params: IdParamSchema,
    },
  )
  .get(
    "/:id/stock-adjustments",
    async ({ db, params, status }) => {
      const row = await getProductById(params.id, db);
      if (!row) return status(404, { error: "NOT_FOUND" });
      const items = await listStockAdjustments(params.id, db);
      return { items: items.map(toAdjustmentDTO) };
    },
    {
      beforeHandle: requirePermission(Permissions.products.manage),
      params: IdParamSchema,
    },
  )
  .post(
    "/:id/stock-adjustments",
    async ({ db, params, body, user, permissions, status }) => {
      const result = await adjustStock(
        {
          productId: params.id,
          type: body.type,
          quantity: body.quantity,
          reason: body.reason,
          adjustedBy: user?.id ?? null,
        },
        db,
      );
      if (!result.ok) {
        if (result.error === "NOT_FOUND") {
          return status(404, { error: "NOT_FOUND" });
        }
        if (result.error === "INSUFFICIENT_STOCK") {
          return status(409, { error: "INSUFFICIENT_STOCK" });
        }
        return status(400, { error: result.error });
      }
      return status(201, {
        product: toProductDTO(result.product, {
          includeCost: canReadCost(permissions),
        }),
        adjustment: toAdjustmentDTO(result.adjustment),
      });
    },
    {
      beforeHandle: requirePermission(Permissions.products.manage),
      params: IdParamSchema,
      body: AdjustStockSchema,
    },
  )
  .post(
    "/",
    async ({ db, body, permissions, status }) => {
      try {
        const created = await createProduct(body, db);
        if (!created) return status(500, { error: "CREATE_FAILED" });
        return status(
          201,
          toProductDTO(created, { includeCost: canReadCost(permissions) }),
        );
      } catch (e) {
        if (e instanceof Error && e.message === "BARCODE_DUPLICATE") {
          return status(409, { error: "BARCODE_DUPLICATE" });
        }
        throw e;
      }
    },
    {
      beforeHandle: requirePermission(Permissions.products.manage),
      body: CreateProductSchema,
    },
  )
  .patch(
    "/:id",
    async ({ db, params, body, permissions, status }) => {
      try {
        const updated = await updateProductService(params.id, body, db);
        if (!updated) return status(404, { error: "NOT_FOUND" });
        return toProductDTO(updated, { includeCost: canReadCost(permissions) });
      } catch (e) {
        if (e instanceof Error && e.message === "BARCODE_DUPLICATE") {
          return status(409, { error: "BARCODE_DUPLICATE" });
        }
        throw e;
      }
    },
    {
      beforeHandle: requirePermission(Permissions.products.manage),
      params: IdParamSchema,
      body: UpdateProductSchema,
    },
  )
  .delete(
    "/:id",
    async ({ db, params, status }) => {
      const deleted = await softDeleteProductService(params.id, db);
      if (!deleted) return status(404, { error: "NOT_FOUND" });
      return status(204, undefined);
    },
    {
      beforeHandle: requirePermission(Permissions.products.manage),
      params: IdParamSchema,
    },
  );
