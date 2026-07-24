/** Permission ids mirrored from webapp POS RBAC (Phase 0). */
export const Perm = {
  salesCreate: "sales:create",
  salesRead: "sales:read",
  salesReadAll: "sales:read_all",
  productsRead: "products:read",
  productsManage: "products:manage",
  productsCostRead: "products:cost_read",
  reportsRead: "reports:read",
  settingsManage: "settings:manage",
} as const;

export function hasPermission(
  permissions: readonly string[] | undefined,
  required: string,
): boolean {
  return Boolean(permissions?.includes(required));
}

export function hasAnyPermission(
  permissions: readonly string[] | undefined,
  required: readonly string[],
): boolean {
  if (!permissions?.length) return false;
  return required.some((p) => permissions.includes(p));
}
