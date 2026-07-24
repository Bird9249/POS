import { Elysia } from "elysia";
import { Permissions } from "@/modules/roles/domain/contracts/permissions";
import { requirePermission } from "@/modules/roles/domain/http/middleware";
import { serverContext } from "@/server/platform/http/context";
import {
  CreateCategorySchema,
  IdParamSchema,
  UpdateCategorySchema,
} from "../contracts";
import { createCategory } from "../repo/create";
import { deleteCategory } from "../repo/delete";
import { getCategoryById } from "../repo/get-by-id";
import { listCategories } from "../repo/list";
import { updateCategory } from "../repo/update";

export const categoriesHttpRoutes = new Elysia()
  .use(serverContext)
  .get(
    "/",
    async ({ db }) => {
      const items = await listCategories(db);
      return { items };
    },
    { beforeHandle: requirePermission(Permissions.products.read) },
  )
  .get(
    "/:id",
    async ({ db, params, status }) => {
      const row = await getCategoryById(params.id, db);
      if (!row) return status(404, { error: "NOT_FOUND" });
      return row;
    },
    {
      beforeHandle: requirePermission(Permissions.products.read),
      params: IdParamSchema,
    },
  )
  .post(
    "/",
    async ({ db, body, status }) => {
      const created = await createCategory(body, db);
      return status(201, created);
    },
    {
      beforeHandle: requirePermission(Permissions.products.manage),
      body: CreateCategorySchema,
    },
  )
  .patch(
    "/:id",
    async ({ db, params, body, status }) => {
      const updated = await updateCategory(params.id, body, db);
      if (!updated) return status(404, { error: "NOT_FOUND" });
      return updated;
    },
    {
      beforeHandle: requirePermission(Permissions.products.manage),
      params: IdParamSchema,
      body: UpdateCategorySchema,
    },
  )
  .delete(
    "/:id",
    async ({ db, params, status }) => {
      const deleted = await deleteCategory(params.id, db);
      if (!deleted) return status(404, { error: "NOT_FOUND" });
      return status(204, undefined);
    },
    {
      beforeHandle: requirePermission(Permissions.products.manage),
      params: IdParamSchema,
    },
  );
