import { getMeta, setMeta } from "./catalog-repo";
import type { SqlDb } from "./types";

export const META_OPEN_SHIFT = "open_shift";

export type CachedOpenShift = {
  id: string;
  openedAt: string;
};

export async function cacheOpenShift(db: SqlDb, shift: CachedOpenShift) {
  await setMeta(db, META_OPEN_SHIFT, JSON.stringify(shift));
}

export async function clearCachedOpenShift(db: SqlDb) {
  await setMeta(db, META_OPEN_SHIFT, "");
}

export async function getCachedOpenShift(
  db: SqlDb,
): Promise<CachedOpenShift | null> {
  const raw = await getMeta(db, META_OPEN_SHIFT);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as CachedOpenShift;
    if (!parsed?.id) return null;
    return parsed;
  } catch {
    return null;
  }
}
