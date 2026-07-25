import { describe, expect, test } from "bun:test";
import { Permissions } from "./permissions";
import { CASHIER_PERMISSIONS, Roles } from "./roles";

/**
 * Docs 04 permission matrix — Admin vs Cashier.
 * Keep in sync with docs/04-user-and-settings.md
 */
const MATRIX = [
  { feature: "Checkout / sell", perm: Permissions.sales.create, admin: true, cashier: true },
  { feature: "Own sales history", perm: Permissions.sales.read, admin: true, cashier: true },
  { feature: "All sales history", perm: Permissions.sales.read_all, admin: true, cashier: false },
  { feature: "Reports total", perm: Permissions.reports.read, admin: true, cashier: false },
  { feature: "Cost / profit", perm: Permissions.products.cost_read, admin: true, cashier: false },
  { feature: "Manage products", perm: Permissions.products.manage, admin: true, cashier: false },
  { feature: "Read products", perm: Permissions.products.read, admin: true, cashier: true },
  { feature: "Store settings", perm: Permissions.settings.manage, admin: true, cashier: false },
  { feature: "Manage users", perm: Permissions.users.read, admin: true, cashier: false },
  { feature: "Create users", perm: Permissions.users.create, admin: true, cashier: false },
  { feature: "Ban users", perm: Permissions.users.ban, admin: true, cashier: false },
] as const;

describe("docs 04 permission matrix", () => {
  const admin = new Set(Roles.admin);
  const cashier = new Set(CASHIER_PERMISSIONS);

  for (const row of MATRIX) {
    test(`${row.feature}: admin=${row.admin} cashier=${row.cashier}`, () => {
      expect(admin.has(row.perm)).toBe(row.admin);
      expect(cashier.has(row.perm)).toBe(row.cashier);
    });
  }

  test("cashier has no elevated permissions beyond sell/read catalog", () => {
    for (const p of CASHIER_PERMISSIONS) {
      expect([
        Permissions.sales.create,
        Permissions.sales.read,
        Permissions.products.read,
      ]).toContain(p);
    }
  });
});
