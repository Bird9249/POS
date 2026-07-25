/** Offline grace: sell with last-known session for up to 24h, then force login. */
export const SESSION_OFFLINE_GRACE_MS = 24 * 60 * 60 * 1000;

const STORAGE_KEY = "pos.session.cache.v1";

export type CachedSessionSnapshot = {
  user: {
    id: string;
    name: string | null;
    email: string;
  };
  permissions: string[];
  cachedAt: number;
};

export function saveSessionCache(snapshot: CachedSessionSnapshot): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // private mode / quota — ignore
  }
}

export function readSessionCache(): CachedSessionSnapshot | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedSessionSnapshot;
    if (!parsed?.user?.id || typeof parsed.cachedAt !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearSessionCache(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

/** Offline access allowed while within grace window after last online validation. */
export function isOfflineGraceValid(
  cache: CachedSessionSnapshot | null,
  now = Date.now(),
  graceMs = SESSION_OFFLINE_GRACE_MS,
): boolean {
  if (!cache) return false;
  return now - cache.cachedAt <= graceMs;
}
