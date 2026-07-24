/** Parse comma-separated CORS_ORIGIN into a clean list. */
export function parseCorsOrigins(raw: string | undefined): string[] {
  const value = (raw ?? "http://localhost:3000").trim();
  const origins = value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return origins.length > 0 ? origins : ["http://localhost:3000"];
}
