import { apiFetch } from "./fetcher";

export type HealthResponse = { ok: boolean };

export function fetchHealth() {
  return apiFetch<HealthResponse>("/api/health");
}
