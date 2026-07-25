import { describe, expect, test } from "bun:test";
import { POS_NAV_ITEMS, filterNavByPermissions } from "./nav-access";
import { Perm } from "./permissions";

describe("filterNavByPermissions", () => {
  test("admin sees all tabs", () => {
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
      "/settings",
    ]);
  });

  test("cashier sees checkout + sales history", () => {
    const perms = [Perm.salesCreate, Perm.salesRead, Perm.productsRead];
    const nav = filterNavByPermissions(POS_NAV_ITEMS, perms);
    expect(nav.map((n) => n.to)).toEqual(["/checkout", "/sales"]);
  });

  test("empty permissions sees nothing", () => {
    expect(filterNavByPermissions(POS_NAV_ITEMS, []).length).toBe(0);
    expect(filterNavByPermissions(POS_NAV_ITEMS, undefined).length).toBe(0);
  });
});
