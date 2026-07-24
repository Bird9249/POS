import {
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { user } from "./auth";

export const category = pgTable("category", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => nanoid()),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", {
    withTimezone: true,
    mode: "date",
  })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at", {
    withTimezone: true,
    mode: "date",
  })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const product = pgTable(
  "product",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => nanoid()),
    name: text("name").notNull(),
    image: text("image"),
    barcode: text("barcode"),
    sku: text("sku"),
    costPrice: integer("cost_price").notNull(),
    sellPrice: integer("sell_price").notNull(),
    categoryId: text("category_id").references(() => category.id, {
      onDelete: "set null",
    }),
    stockQty: integer("stock_qty").notNull().default(0),
    minStock: integer("min_stock"),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "date",
    })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "date",
    })
      .notNull()
      .$defaultFn(() => new Date()),
    deletedAt: timestamp("deleted_at", {
      withTimezone: true,
      mode: "date",
    }),
  },
  (t) => [
    uniqueIndex("product_barcode_unique")
      .on(t.barcode)
      .where(sql`${t.barcode} is not null AND ${t.deletedAt} is null`),
  ],
);

/** Stock movement ledger (restock / increase / decrease). */
export const stockAdjustment = pgTable(
  "stock_adjustment",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => nanoid()),
    productId: text("product_id")
      .notNull()
      .references(() => product.id, { onDelete: "restrict" }),
    type: text("type").notNull(), // restock | increase | decrease
    quantity: integer("quantity").notNull(),
    reason: text("reason").notNull(),
    adjustedBy: text("adjusted_by").references(() => user.id, {
      onDelete: "set null",
    }),
    stockBefore: integer("stock_before").notNull(),
    stockAfter: integer("stock_after").notNull(),
    adjustedAt: timestamp("adjusted_at", {
      withTimezone: true,
      mode: "date",
    })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [
    index("stock_adjustment_by_product").on(t.productId, t.adjustedAt),
    index("stock_adjustment_by_time").on(t.adjustedAt),
  ],
);
