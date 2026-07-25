import { and, desc, eq, lt, or } from "drizzle-orm";
import type { DbClient } from "@/server/platform/db/client";
import { shift } from "@/server/platform/db/schema";
import type { CloseShiftDTO } from "../contracts";
import { summarizeShiftSales } from "./shift-summary";

export async function getOpenShiftForUser(userId: string, db: DbClient) {
  const [row] = await db
    .select()
    .from(shift)
    .where(and(eq(shift.openedBy, userId), eq(shift.status, "open")))
    .limit(1);
  return row ?? null;
}

export async function getShiftById(id: string, db: DbClient) {
  const [row] = await db.select().from(shift).where(eq(shift.id, id)).limit(1);
  return row ?? null;
}

export async function openShift(userId: string, db: DbClient) {
  const existing = await getOpenShiftForUser(userId, db);
  if (existing) {
    return { shift: existing, created: false as const };
  }
  const [created] = await db
    .insert(shift)
    .values({
      openedBy: userId,
      status: "open",
    })
    .returning();
  if (!created) throw new Error("FAILED_TO_OPEN_SHIFT");
  return { shift: created, created: true as const };
}

export async function closeShiftZ(
  shiftId: string,
  userId: string,
  input: CloseShiftDTO,
  db: DbClient,
  opts?: { allowAny?: boolean },
) {
  const row = await getShiftById(shiftId, db);
  if (!row) return { ok: false as const, error: "NOT_FOUND" as const };
  if (!opts?.allowAny && row.openedBy !== userId) {
    return { ok: false as const, error: "FORBIDDEN" as const };
  }
  if (row.status === "closed") {
    return { ok: false as const, error: "ALREADY_CLOSED" as const };
  }

  const summary = await summarizeShiftSales(shiftId, db);
  const cashDiffKip = input.countedCashKip - summary.expectedCashKip;
  const closedAt = new Date();

  const [updated] = await db
    .update(shift)
    .set({
      status: "closed",
      closedAt,
      expectedCashKip: summary.expectedCashKip,
      countedCashKip: input.countedCashKip,
      cashDiffKip,
      totalSalesKip: summary.totalSalesKip,
      cashSalesKip: summary.cashSalesKip,
      transferSalesKip: summary.transferSalesKip,
      billCount: summary.billCount,
      note: input.note?.trim() || null,
    })
    .where(and(eq(shift.id, shiftId), eq(shift.status, "open")))
    .returning();

  if (!updated) {
    return { ok: false as const, error: "ALREADY_CLOSED" as const };
  }

  return {
    ok: true as const,
    shift: updated,
    summary,
  };
}

export async function listShifts(
  opts: {
    limit: number;
    cursor?: string;
    openedBy?: string;
  },
  db: DbClient,
) {
  const limit = opts.limit;
  const conditions = [];
  if (opts.openedBy) {
    conditions.push(eq(shift.openedBy, opts.openedBy));
  }
  if (opts.cursor) {
    const [cursorOpenedAt, cursorId] = opts.cursor.split("|");
    if (cursorOpenedAt && cursorId) {
      const cursorDate = new Date(cursorOpenedAt);
      conditions.push(
        or(
          lt(shift.openedAt, cursorDate),
          and(eq(shift.openedAt, cursorDate), lt(shift.id, cursorId)),
        )!,
      );
    }
  }

  const rows = await db
    .select()
    .from(shift)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(shift.openedAt), desc(shift.id))
    .limit(limit + 1);

  const page = rows.slice(0, limit);
  const next =
    rows.length > limit
      ? `${page[page.length - 1]!.openedAt.toISOString()}|${page[page.length - 1]!.id}`
      : null;

  return { items: page, nextCursor: next };
}

/** Attach open shift id for a seller, if any. */
export async function resolveOpenShiftId(
  userId: string,
  db: DbClient,
): Promise<string | null> {
  const open = await getOpenShiftForUser(userId, db);
  return open?.id ?? null;
}

export async function ensureSeedOpenShift(
  userId: string,
  shiftId: string,
  db: DbClient,
) {
  const [existing] = await db
    .select()
    .from(shift)
    .where(eq(shift.id, shiftId))
    .limit(1);
  if (existing) return existing;

  const open = await getOpenShiftForUser(userId, db);
  if (open) return open;

  const [created] = await db
    .insert(shift)
    .values({
      id: shiftId,
      openedBy: userId,
      status: "open",
      openedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    })
    .returning();
  return created!;
}
