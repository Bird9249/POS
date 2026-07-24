import { Elysia } from "elysia";
import { requireAuth } from "@/modules/roles/domain/http/middleware";
import { serverContext } from "@/server/platform/http/context";
import { productsHttpRoutes } from "../domain/http/products.routes";

export const productsRoutes = new Elysia({ prefix: "/products" })
  .use(serverContext)
  .onBeforeHandle(requireAuth)
  .use(productsHttpRoutes);
