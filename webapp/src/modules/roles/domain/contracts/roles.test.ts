import { describe, expect, test } from "bun:test";
import { Permissions } from "./permissions";
import { CASHIER_PERMISSIONS, Roles } from "./roles";

describe("POS RBAC roles", () => {
  test("defines admin and cashier", () => {
    expect(Object.keys(Roles).sort()).toEqual(["admin", "cashier"]);
  });

  test("admin has all permissions including cost and reports", () => {
    const admin = new Set(Roles.admin);
    expect(admin.has(Permissions.products.cost_read)).toBe(true);
    expect(admin.has(Permissions.reports.read)).toBe(true);
    expect(admin.has(Permissions.settings.manage)).toBe(true);
    expect(admin.has(Permissions.products.manage)).toBe(true);
    expect(admin.has(Permissions.sales.create)).toBe(true);
  });

  test("cashier cannot see reports, cost, product manage, or settings", () => {
    const cashier = new Set(CASHIER_PERMISSIONS);
    expect(cashier.has(Permissions.sales.create)).toBe(true);
    expect(cashier.has(Permissions.sales.read)).toBe(true);
    expect(cashier.has(Permissions.products.read)).toBe(true);

    expect(cashier.has(Permissions.reports.read)).toBe(false);
    expect(cashier.has(Permissions.products.cost_read)).toBe(false);
    expect(cashier.has(Permissions.products.manage)).toBe(false);
    expect(cashier.has(Permissions.settings.manage)).toBe(false);
    expect(cashier.has(Permissions.users.read)).toBe(false);
    expect(cashier.has(Permissions.sales.read_all)).toBe(false);
  });
});
