import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";
import { user } from "./auth";
import { product } from "./catalog";

export const sale = pgTable(
  "sale",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => nanoid()),
    clientSaleId: text("client_sale_id").notNull(),
    soldBy: text("sold_by")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    soldAt: timestamp("sold_at", { withTimezone: true, mode: "date" })
      .notNull()
      .$defaultFn(() => new Date()),
    paymentMethod: text("payment_method").notNull(), // cash | transfer
    amountDue: integer("amount_due").notNull(),
    amountReceived: integer("amount_received"),
    changeAmount: integer("change_amount"),
    confirmedByStaff: boolean("confirmed_by_staff"),
    slipImageKey: text("slip_image_key"),
    billDiscountType: text("bill_discount_type"),
    billDiscountValue: integer("bill_discount_value"),
    billDiscountKip: integer("bill_discount_kip").notNull().default(0),
    linesSubtotal: integer("lines_subtotal").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [
    uniqueIndex("sale_client_sale_id_unique").on(t.clientSaleId),
    index("sale_by_sold_by_time").on(t.soldBy, t.soldAt),
    index("sale_by_sold_at").on(t.soldAt),
  ],
);

export const saleItem = pgTable(
  "sale_item",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => nanoid()),
    saleId: text("sale_id")
      .notNull()
      .references(() => sale.id, { onDelete: "cascade" }),
    productId: text("product_id")
      .notNull()
      .references(() => product.id, { onDelete: "restrict" }),
    productName: text("product_name").notNull(),
    quantity: integer("quantity").notNull(),
    unitPrice: integer("unit_price").notNull(),
    costPrice: integer("cost_price").notNull(),
    discountType: text("discount_type"),
    discountValue: integer("discount_value"),
    discountKip: integer("discount_kip").notNull().default(0),
    lineTotal: integer("line_total").notNull(),
  },
  (t) => [index("sale_item_by_sale").on(t.saleId)],
);
