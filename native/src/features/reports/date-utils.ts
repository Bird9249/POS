/** YYYY-MM-DD in Asia/Vientiane. */
export function todayYmd(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Vientiane",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function addDaysYmd(ymd: string, delta: number): string {
  const d = new Date(`${ymd}T12:00:00+07:00`);
  d.setTime(d.getTime() + delta * 24 * 60 * 60 * 1000);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Vientiane",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

export type RangePreset = "today" | "7d" | "30d" | "custom";

export function rangeForPreset(preset: RangePreset): { from: string; to: string } {
  const to = todayYmd();
  if (preset === "today") return { from: to, to };
  if (preset === "7d") return { from: addDaysYmd(to, -6), to };
  if (preset === "30d") return { from: addDaysYmd(to, -29), to };
  return { from: to, to };
}
