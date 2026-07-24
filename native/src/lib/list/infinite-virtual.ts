/**
 * Shared pattern stub for Phase 1+:
 * useInfiniteQuery (cursor) + @tanstack/react-virtual
 * Implement real list helpers when Products list lands.
 */
export type CursorPage<T> = {
  items: T[];
  nextCursor: string | null;
};
