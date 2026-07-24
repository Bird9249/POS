import { Perm, hasPermission } from "./permissions";

export type PosPath = "/checkout" | "/products" | "/reports" | "/settings";

export type PosNavItem = {
  to: PosPath;
  label: string;
  /** Any of these permissions grants access */
  requiredPermissions: string[];
};

export const POS_NAV_ITEMS: PosNavItem[] = [
  {
    to: "/checkout",
    label: "ຂາຍ",
    requiredPermissions: [Perm.salesCreate],
  },
  {
    to: "/products",
    label: "ສິນຄ້າ",
    requiredPermissions: [Perm.productsManage],
  },
  {
    to: "/reports",
    label: "ລາຍງານ",
    requiredPermissions: [Perm.reportsRead],
  },
  {
    to: "/settings",
    label: "ຕັ້ງຄ່າ",
    requiredPermissions: [Perm.settingsManage],
  },
];

/** Pure helper — filter nav tabs by session permissions. */
export function filterNavByPermissions(
  items: readonly PosNavItem[],
  permissions: readonly string[] | undefined,
): PosNavItem[] {
  return items.filter((item) =>
    item.requiredPermissions.some((p) => hasPermission(permissions, p)),
  );
}
