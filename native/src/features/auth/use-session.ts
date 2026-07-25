import { useEffect } from "react";
import { authClient } from "@/lib/api/auth-client";
import {
  clearSessionCache,
  readSessionCache,
  saveSessionCache,
  type CachedSessionSnapshot,
} from "./session-cache";

export function useSession() {
  return authClient.useSession();
}

export function getSessionPermissions(
  data: { permissions?: string[] } | null | undefined,
): string[] {
  return data?.permissions ?? [];
}

/** Persist last-known session for offline grace (Phase 7). */
export function usePersistSessionCache(
  data: {
    session?: unknown;
    user?: { id?: string; name?: string | null; email?: string | null };
    permissions?: string[];
  } | null | undefined,
) {
  useEffect(() => {
    const user = data?.user;
    if (!data?.session || !user?.id || !user.email) return;
    const snap: CachedSessionSnapshot = {
      user: {
        id: user.id,
        name: user.name ?? null,
        email: user.email,
      },
      permissions: getSessionPermissions(data),
      cachedAt: Date.now(),
    };
    saveSessionCache(snap);
  }, [data]);
}

export function useClearSessionCacheOnSignOut() {
  return clearSessionCache;
}

export { clearSessionCache, readSessionCache };
