import { Elysia } from "elysia";
import { requireAuth } from "@/modules/roles/domain/http/middleware";
import { serverContext } from "@/server/platform/http/context";
import { settingsHttpRoutes } from "../domain/http/settings.routes";

export const settingsRoutes = new Elysia({ prefix: "/settings" })
  .use(serverContext)
  .onBeforeHandle(requireAuth)
  .use(settingsHttpRoutes);
