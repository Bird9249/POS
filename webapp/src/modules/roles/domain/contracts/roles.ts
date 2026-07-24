import { ALL_PERMISSIONS, Permissions, type PermissionId } from "./permissions";

/** Cashier: sell + own sales history only — no cost, reports total, products manage, settings */
export const CASHIER_PERMISSIONS: PermissionId[] = [
  Permissions.sales.create,
  Permissions.sales.read,
  Permissions.products.read,
];

export const Roles: Record<string, PermissionId[]> = {
  admin: ALL_PERMISSIONS.map((p) => p.id),
  cashier: CASHIER_PERMISSIONS,
};
