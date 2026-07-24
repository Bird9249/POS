import { Elysia } from "elysia";
import { requireAuth } from "@/modules/roles/domain/http/middleware";
import { serverContext } from "@/server/platform/http/context";
import { categoriesHttpRoutes } from "../domain/http/categories.routes";

export const categoriesRoutes = new Elysia({ prefix: "/categories" })
  .use(serverContext)
  .onBeforeHandle(requireAuth)
  .use(categoriesHttpRoutes);
