import { integer, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { nanoid } from "nanoid";

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
