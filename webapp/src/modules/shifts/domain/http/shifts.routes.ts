import { Elysia } from "elysia";
import { Permissions } from "@/modules/roles/domain/contracts/permissions";
import { requirePermission } from "@/modules/roles/domain/http/middleware";
import { serverContext } from "@/server/platform/http/context";
import {
  CloseShiftSchema,
  ListShiftsQuerySchema,
  toShiftDTO,
} from "../contracts";
import { summarizeShiftSales } from "../repo/shift-summary";
import {
  closeShiftZ,
  getOpenShiftForUser,
  getShiftById,
  listShifts,
  openShift,
} from "../repo/shifts";

function canReadAllSales(permissions: string[]) {
  return permissions.includes(Permissions.sales.read_all);
}

export const shiftsHttpRoutes = new Elysia()
  .use(serverContext)
  .get(
    "/current",
    async ({ db, user }) => {
      const row = await getOpenShiftForUser(user.id, db);
      if (!row) return { shift: null };
      const summary = await summarizeShiftSales(row.id, db);
      return { shift: toShiftDTO(row, summary) };
    },
    {
      beforeHandle: requirePermission(Permissions.sales.create),
    },
  )
  .post(
    "/open",
    async ({ db, user, set }) => {
      const result = await openShift(user.id, db);
      set.status = result.created ? 201 : 200;
      const summary = await summarizeShiftSales(result.shift.id, db);
      return {
        shift: toShiftDTO(result.shift, summary),
        created: result.created,
      };
    },
    {
      beforeHandle: requirePermission(Permissions.sales.create),
    },
  )
  .get(
    "/:id/x-report",
    async ({ db, params, user, permissions, set }) => {
      const row = await getShiftById(params.id, db);
      if (!row) {
        set.status = 404;
        return { error: "NOT_FOUND" };
      }
      if (!canReadAllSales(permissions) && row.openedBy !== user.id) {
        set.status = 403;
        return { error: "FORBIDDEN" };
      }
      const summary = await summarizeShiftSales(row.id, db);
      return {
        report: "x",
        shift: toShiftDTO(row, summary),
      };
    },
    {
      beforeHandle: requirePermission(Permissions.sales.read),
    },
  )
  .post(
    "/:id/z-report",
    async ({ db, params, body, user, permissions, set }) => {
      const result = await closeShiftZ(params.id, user.id, body, db, {
        allowAny: canReadAllSales(permissions),
      });
      if (!result.ok) {
        set.status =
          result.error === "NOT_FOUND"
            ? 404
            : result.error === "FORBIDDEN"
              ? 403
              : 409;
        return { error: result.error };
      }
      return {
        report: "z",
        shift: toShiftDTO(result.shift, result.summary),
      };
    },
    {
      beforeHandle: requirePermission(Permissions.sales.create),
      body: CloseShiftSchema,
    },
  )
  .get(
    "/",
    async ({ db, query, user, permissions }) => {
      const scopeAll = canReadAllSales(permissions);
      const { items, nextCursor } = await listShifts(
        {
          limit: query.limit,
          cursor: query.cursor,
          openedBy: scopeAll ? undefined : user.id,
        },
        db,
      );
      return {
        items: items.map((row) => toShiftDTO(row)),
        nextCursor,
      };
    },
    {
      beforeHandle: requirePermission(Permissions.sales.read),
      query: ListShiftsQuerySchema,
    },
  );
