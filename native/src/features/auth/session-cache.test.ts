import { describe, expect, test } from "bun:test";
import {
  SESSION_OFFLINE_GRACE_MS,
  isOfflineGraceValid,
  type CachedSessionSnapshot,
} from "./session-cache";

const sample: CachedSessionSnapshot = {
  user: { id: "u1", name: "Cashier", email: "c@pos.com" },
  permissions: ["sales:create"],
  cachedAt: 1_000_000,
};

describe("session offline grace", () => {
  test("valid within 24h of last cache", () => {
    expect(
      isOfflineGraceValid(sample, sample.cachedAt + SESSION_OFFLINE_GRACE_MS),
    ).toBe(true);
    expect(
      isOfflineGraceValid(
        sample,
        sample.cachedAt + SESSION_OFFLINE_GRACE_MS + 1,
      ),
    ).toBe(false);
  });

  test("invalid without cache", () => {
    expect(isOfflineGraceValid(null)).toBe(false);
  });
});
