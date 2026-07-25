import { Elysia } from "elysia";
import { requireAuth } from "@/modules/roles/domain/http/middleware";
import { serverContext } from "@/server/platform/http/context";
import { shiftsHttpRoutes } from "../domain/http/shifts.routes";

export const shiftsRoutes = new Elysia({ prefix: "/shifts" })
  .use(serverContext)
  .onBeforeHandle(requireAuth)
  .use(shiftsHttpRoutes);
