import { Database } from "bun:sqlite";
import { CATALOG_SCHEMA_SQL } from "./schema";
import type { SqlDb } from "./types";

/** In-memory / file SQLite for unit tests (Bun runtime). */
export function openBunSqlite(path = ":memory:"): SqlDb & { raw: Database } {
  const raw = new Database(path);
  raw.exec(CATALOG_SCHEMA_SQL);

  return {
    raw,
    async execute(query: string, bindValues: unknown[] = []) {
      const stmt = raw.prepare(query);
      const info = stmt.run(...bindValues);
      return { rowsAffected: Number(info.changes ?? 0) };
    },
    async select<T>(query: string, bindValues: unknown[] = []) {
      const stmt = raw.prepare(query);
      return stmt.all(...bindValues) as T[];
    },
  };
}
