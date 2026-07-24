export type CursorPage<T> = {
  items: T[];
  nextCursor: string | null;
};

export function flattenCursorPages<T>(
  pages: CursorPage<T>[] | undefined,
): T[] {
  return pages?.flatMap((p) => p.items) ?? [];
}
