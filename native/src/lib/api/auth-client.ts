import { createAuthClient } from "better-auth/react";
import { customSessionClient } from "better-auth/client/plugins";
import { getApiBaseUrl } from "./config";

export const authClient = createAuthClient({
  baseURL: getApiBaseUrl() || undefined,
  basePath: "/api/auth",
  fetchOptions: {
    credentials: "include",
  },
  plugins: [customSessionClient()],
});

export type SessionPermissions = string[];
