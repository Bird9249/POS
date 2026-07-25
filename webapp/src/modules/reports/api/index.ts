import { Elysia } from "elysia";
import { requireAuth } from "@/modules/roles/domain/http/middleware";
import { serverContext } from "@/server/platform/http/context";
import { reportsHttpRoutes } from "../domain/http/reports.routes";

export const reportsRoutes = new Elysia({ prefix: "/reports" })
  .use(serverContext)
  .onBeforeHandle(requireAuth)
  .use(reportsHttpRoutes);
