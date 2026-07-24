import { beforeAll, describe, expect, test } from "bun:test";
import { auth } from "./better-auth";
import { syncFromCode } from "@/modules/roles/domain/repo/sync-from-code";
import { db } from "@/server/platform/db/client";

const hasDb = Boolean(process.env.DATABASE_URL);

async function signIn(email: string, password: string) {
  const res = await auth.api.signInEmail({
    body: { email, password },
    asResponse: true,
  });
  return res;
}

describe.skipIf(!hasDb)("auth login + session", () => {
  beforeAll(async () => {
    await syncFromCode(db);
    // Prefer seeded users from `bun run db:seed`
  });

  test("admin can sign in", async () => {
    const res = await signIn("admin@admin.com", "123456");
    expect(res.status).toBeLessThan(400);
    const setCookie = res.headers.getSetCookie?.() ?? [];
    expect(setCookie.length + (res.headers.get("set-cookie") ? 1 : 0)).toBeGreaterThan(0);
  });

  test("cashier can sign in", async () => {
    const res = await signIn("cashier@pos.com", "123456");
    expect(res.status).toBeLessThan(400);
  });
});
