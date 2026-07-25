import { apiFetch } from "./fetcher";

export type UserRole = {
  id: string;
  name: string;
};

export type PosUser = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  banned: boolean;
  roleIds: string[];
  roles: UserRole[];
  createdAt: string;
  updatedAt: string;
};

export type UsersListResult = {
  data: PosUser[];
  meta: { total: number; limit: number; offset: number };
};

export type RoleLookupItem = {
  id: string;
  name: string;
};

export type CreateUserInput = {
  email: string;
  name: string;
  password: string;
  roleId: string;
};

export type UpdateUserInput = {
  email?: string;
  name?: string;
  password?: string;
  roleId?: string;
};

type ListUsersParams = {
  limit?: number;
  offset?: number;
  q?: string;
};

function buildListQuery(params: ListUsersParams): string {
  const sp = new URLSearchParams();
  sp.set("limit", String(params.limit ?? 20));
  sp.set("offset", String(params.offset ?? 0));
  sp.set("sort", JSON.stringify([{ field: "createdAt", dir: "desc" }]));
  const q = params.q?.trim();
  if (q) {
    sp.set(
      "filters",
      JSON.stringify([
        {
          field: "name",
          op: "or",
          value: [
            { field: "name", op: "contains", value: q },
            { field: "email", op: "contains", value: q },
          ],
        },
      ]),
    );
  }
  return sp.toString();
}

export function listUsers(params: ListUsersParams = {}) {
  return apiFetch<UsersListResult>(`/api/users?${buildListQuery(params)}`);
}

export function getUser(id: string) {
  return apiFetch<PosUser>(`/api/users/${id}`);
}

export function createUser(input: CreateUserInput) {
  return apiFetch<PosUser>("/api/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function updateUser(id: string, input: UpdateUserInput) {
  return apiFetch<PosUser>(`/api/users/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function deleteUser(id: string) {
  return apiFetch<PosUser>(`/api/users/${id}`, { method: "DELETE" });
}

export function banUser(id: string, reason?: string) {
  return apiFetch<{ ok: boolean }>(`/api/users/${id}/ban`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(reason ? { reason } : {}),
  });
}

export function unbanUser(id: string) {
  return apiFetch<{ ok: boolean }>(`/api/users/${id}/unban`, {
    method: "POST",
  });
}

export function listRolesLookup(limit = 50) {
  const sp = new URLSearchParams({
    limit: String(limit),
    skip: "0",
  });
  return apiFetch<{ items: RoleLookupItem[]; total: number }>(
    `/api/rbac/roles/lookup?${sp.toString()}`,
  );
}
