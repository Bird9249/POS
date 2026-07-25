import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

/** Single-row store / receipt configuration (one shop). */
export const storeSettings = pgTable("store_settings", {
  id: text("id").primaryKey().default("default"),
  storeName: text("store_name").notNull().default(""),
  address: text("address"),
  phone: text("phone"),
  logoKey: text("logo_key"),
  bankName: text("bank_name"),
  bankAccount: text("bank_account"),
  qrImageKey: text("qr_image_key"),
  /** Thermal paper width in mm: 58 | 80 */
  receiptWidthMm: integer("receipt_width_mm").notNull().default(80),
  footerThanks: text("footer_thanks"),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date()),
});
