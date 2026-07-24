import Database from "@tauri-apps/plugin-sql";
import type { SqlDb } from "./types";

export const LOCAL_DB_URL = "sqlite:pos.db";

let cached: Promise<SqlDb> | null = null;

/** Load Tauri SQLite (runs migrations registered in Rust). */
export function getLocalDb(): Promise<SqlDb> {
  if (!cached) {
    cached = Database.load(LOCAL_DB_URL) as Promise<SqlDb>;
  }
  return cached;
}

/** Test helper — reset singleton between suites if needed. */
export function resetLocalDbCache() {
  cached = null;
}
