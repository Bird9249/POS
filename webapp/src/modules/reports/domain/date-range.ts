/** Parse YYYY-MM-DD as Asia/Vientiane (UTC+7) day bounds [start, end). */
export function dayBoundsVientiane(dateStr: string): { start: Date; end: Date } {
  const start = new Date(`${dateStr}T00:00:00+07:00`);
  if (Number.isNaN(start.getTime())) {
    throw new Error("INVALID_DATE");
  }
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}

/** Inclusive from / exclusive to+1day end for date-only strings. */
export function rangeBoundsVientiane(
  from: string,
  to: string,
): { start: Date; end: Date } {
  const start = new Date(`${from}T00:00:00+07:00`);
  const toStart = new Date(`${to}T00:00:00+07:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(toStart.getTime())) {
    throw new Error("INVALID_DATE");
  }
  if (toStart.getTime() < start.getTime()) {
    throw new Error("INVALID_RANGE");
  }
  const end = new Date(toStart.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}

export function todayVientiane(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Vientiane",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
