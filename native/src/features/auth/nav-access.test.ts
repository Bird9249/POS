import { describe, expect, test } from "bun:test";
import {
  canAccessSettings,
  filterNavByPermissions,
  POS_NAV_ITEMS,
} from "./nav-access";
import { Perm } from "./permissions";

describe("filterNavByPermissions", () => {
  test("admin sees bottom tabs without settings", () => {
    const perms = [
      Perm.salesCreate,
      Perm.salesRead,
      Perm.productsManage,
      Perm.reportsRead,
      Perm.settingsManage,
    ];
    const nav = filterNavByPermissions(POS_NAV_ITEMS, perms);
    expect(nav.map((n) => n.to)).toEqual([
      "/checkout",
      "/sales",
      "/products",
      "/reports",
    ]);
    expect(canAccessSettings(perms)).toBe(true);
  });

  test("cashier sees checkout + sales; settings via profile", () => {
    const perms = [Perm.salesCreate, Perm.salesRead, Perm.productsRead];
    const nav = filterNavByPermissions(POS_NAV_ITEMS, perms);
    expect(nav.map((n) => n.to)).toEqual(["/checkout", "/sales"]);
    expect(canAccessSettings(perms)).toBe(true);
  });

  test("empty permissions sees nothing", () => {
    expect(filterNavByPermissions(POS_NAV_ITEMS, []).length).toBe(0);
    expect(filterNavByPermissions(POS_NAV_ITEMS, undefined).length).toBe(0);
    expect(canAccessSettings([])).toBe(false);
  });
});
