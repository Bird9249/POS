import { Elysia } from "elysia";
import { Permissions } from "@/modules/roles/domain/contracts/permissions";
import { requirePermission } from "@/modules/roles/domain/http/middleware";
import { serverContext } from "@/server/platform/http/context";
import {
  UpdateStoreSettingsSchema,
  toStoreSettingsDTO,
} from "../contracts";
import {
  ensureStoreSettings,
  updateStoreSettings,
} from "../repo/store-settings";

function canReadReceipt(permissions: string[]) {
  return (
    permissions.includes(Permissions.settings.manage) ||
    permissions.includes(Permissions.sales.create)
  );
}

export const settingsHttpRoutes = new Elysia()
  .use(serverContext)
  .get(
    "/receipt",
    async ({ db, permissions, set }) => {
      if (!canReadReceipt(permissions)) {
        set.status = 403;
        return { error: "FORBIDDEN" };
      }
      const row = await ensureStoreSettings(db);
      return { settings: toStoreSettingsDTO(row) };
    },
  )
  .patch(
    "/receipt",
    async ({ db, body }) => {
      const row = await updateStoreSettings(body, db);
      return { settings: toStoreSettingsDTO(row) };
    },
    {
      beforeHandle: requirePermission(Permissions.settings.manage),
      body: UpdateStoreSettingsSchema,
    },
  );
