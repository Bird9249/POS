export const Permissions = {
  users: {
    create: "users:create",
    read: "users:read",
    update: "users:update",
    delete: "users:delete",
    ban: "users:ban",
  },
  audit: {
    read: "audit:read",
  },
  sales: {
    create: "sales:create",
    read: "sales:read",
    read_all: "sales:read_all",
  },
  products: {
    read: "products:read",
    manage: "products:manage",
    cost_read: "products:cost_read",
  },
  reports: {
    read: "reports:read",
  },
  settings: {
    manage: "settings:manage",
  },
} as const;

export const ALL_PERMISSIONS = Object.entries(Permissions).flatMap(
  ([resource, actions]) =>
    Object.entries(actions).map(([action, id]) => ({ id, resource, action })),
);

export type PermissionId = (typeof ALL_PERMISSIONS)[number]["id"];

export const RESOURCE_LABELS: Record<string, string> = {
  users: "Users",
  audit: "Audit",
  sales: "Sales",
  products: "Products",
  reports: "Reports",
  settings: "Settings",
};

export const ACTION_LABELS: Record<string, string> = {
  create: "Create",
  read: "Read",
  read_all: "Read all",
  update: "Update",
  delete: "Delete",
  ban: "Ban",
  manage: "Manage",
  cost_read: "View cost",
  all: "All",
};

export function getResourceLabel(resource: string): string {
  return RESOURCE_LABELS[resource] ?? resource;
}

export function getActionLabel(action: string): string {
  return ACTION_LABELS[action] ?? action;
}

export function getPermissionLabel(id: PermissionId): string {
  const [resource, action] = (id as string).split(":");
  return `${getActionLabel(action ?? "")} ${getResourceLabel(resource ?? "")}`;
}

export function getPermissionLabels(ids: PermissionId[]): string[] {
  return ids.map((id) => getPermissionLabel(id));
}
