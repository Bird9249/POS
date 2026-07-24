import { Elysia } from "elysia";
import { Permissions } from "@/modules/roles/domain/contracts/permissions";
import { requirePermission } from "@/modules/roles/domain/http/middleware";
import { serverContext } from "@/server/platform/http/context";
import {
  CreateProductSchema,
  IdParamSchema,
  ListProductsQuerySchema,
  toProductDTO,
  UpdateProductSchema,
} from "../contracts";
import { createProduct } from "../repo/create";
import { getProductById } from "../repo/get-by-id";
import { listProducts } from "../repo/list";
import { softDeleteProductService } from "../service/soft-delete-product";
import { updateProductService } from "../service/update-product";

function canReadCost(permissions: string[]) {
  return permissions.includes(Permissions.products.cost_read);
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
