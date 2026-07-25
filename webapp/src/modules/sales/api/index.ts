import { Elysia } from "elysia";
import { requireAuth } from "@/modules/roles/domain/http/middleware";
import { serverContext } from "@/server/platform/http/context";
import { salesHttpRoutes } from "../domain/http/sales.routes";

export const salesRoutes = new Elysia({ prefix: "/sales" })
  .use(serverContext)
  .onBeforeHandle(requireAuth)
  .use(salesHttpRoutes);
