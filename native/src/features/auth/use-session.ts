import { authClient } from "@/lib/api/auth-client";

export function useSession() {
  return authClient.useSession();
}

export function getSessionPermissions(
  data: { permissions?: string[] } | null | undefined,
): string[] {
  return data?.permissions ?? [];
}
