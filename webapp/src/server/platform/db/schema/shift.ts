import { sql } from "drizzle-orm";
import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";
import { user } from "./auth";

/** Cash drawer / cashier shift for X/Z reports. */
export const shift = pgTable(
  "shift",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => nanoid()),
    openedBy: text("opened_by")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    openedAt: timestamp("opened_at", { withTimezone: true, mode: "date" })
      .notNull()
      .$defaultFn(() => new Date()),
    closedAt: timestamp("closed_at", { withTimezone: true, mode: "date" }),
    status: text("status").notNull().default("open"), // open | closed
    /** Expected cash in drawer from system (cash sales − change) at close. */
    expectedCashKip: integer("expected_cash_kip"),
    /** Cash counted by cashier at Z-close. */
    countedCashKip: integer("counted_cash_kip"),
    cashDiffKip: integer("cash_diff_kip"),
    totalSalesKip: integer("total_sales_kip"),
    cashSalesKip: integer("cash_sales_kip"),
    transferSalesKip: integer("transfer_sales_kip"),
    billCount: integer("bill_count"),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [
    index("shift_by_opened_by_opened_at").on(t.openedBy, t.openedAt),
    index("shift_by_status").on(t.status),
    uniqueIndex("shift_one_open_per_user")
      .on(t.openedBy)
      .where(sql`${t.status} = 'open'`),
  ],
);
