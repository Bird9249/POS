import { Perm, hasPermission } from "./permissions";

export type PosPath =
  | "/checkout"
  | "/sales"
  | "/products"
  | "/reports"
  | "/settings"
  | "/users";

export type BottomNavPath = Exclude<PosPath, "/settings" | "/users">;

export type PosNavItem = {
  to: PosPath;
  label: string;
  /** Any of these permissions grants access */
  requiredPermissions: string[];
};

export type BottomNavItem = {
  to: BottomNavPath;
  label: string;
  requiredPermissions: string[];
};

/** Bottom tab bar — settings lives in the profile dropdown. */
export const POS_NAV_ITEMS: BottomNavItem[] = [
  {
    to: "/checkout",
    label: "ຂາຍ",
    requiredPermissions: [Perm.salesCreate],
  },
  {
    to: "/sales",
    label: "ປະຫວັດ",
    requiredPermissions: [Perm.salesRead],
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
];

export const SETTINGS_NAV_ITEM: PosNavItem = {
  to: "/settings",
  label: "ຕັ້ງຄ່າ",
  /** Printer + theme for cashiers; store receipt config for admin. */
  requiredPermissions: [Perm.settingsManage, Perm.salesCreate],
};

export const USERS_NAV_ITEM: PosNavItem = {
  to: "/users",
  label: "ຜູ້ໃຊ້",
  requiredPermissions: [Perm.usersRead],
};

/** Pure helper — filter nav tabs by session permissions. */
export function filterNavByPermissions<T extends { requiredPermissions: string[] }>(
  items: readonly T[],
  permissions: readonly string[] | undefined,
): T[] {
  return items.filter((item) =>
    item.requiredPermissions.some((p) => hasPermission(permissions, p)),
  );
}

export function canAccessSettings(
  permissions: readonly string[] | undefined,
): boolean {
  return SETTINGS_NAV_ITEM.requiredPermissions.some((p) =>
    hasPermission(permissions, p),
  );
}

export function canAccessUsers(
  permissions: readonly string[] | undefined,
): boolean {
  return USERS_NAV_ITEM.requiredPermissions.some((p) =>
    hasPermission(permissions, p),
  );
}
