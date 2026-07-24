import { beforeAll, describe, expect, test } from "bun:test";
import { createServer } from "@/server/platform/http/server";
import { syncFromCode } from "@/modules/roles/domain/repo/sync-from-code";
import { db } from "@/server/platform/db/client";
import { seedCatalog } from "@/server/scripts/seed-catalog";
import {
  authedRequest,
  signInCookie,
} from "@/modules/products/domain/http/test-auth";

const hasDb = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDb)("categories API", () => {
  const app = createServer();
  let adminCookie = "";

  beforeAll(async () => {
    await syncFromCode(db);
    await seedCatalog(db);
    adminCookie = await signInCookie("admin@admin.com", "123456");
  });

  test("admin list / create / update / delete", async () => {
    const listRes = await app.handle(
      authedRequest("http://localhost/api/categories", adminCookie),
    );
    expect(listRes.status).toBe(200);
    const list = (await listRes.json()) as { items: { id: string }[] };
    expect(list.items.length).toBeGreaterThanOrEqual(2);

    const createRes = await app.handle(
      authedRequest("http://localhost/api/categories", adminCookie, {
        method: "POST",
        body: JSON.stringify({ name: "ທົດສອບຫມວດ" }),
      }),
    );
    expect(createRes.status).toBe(201);
    const created = (await createRes.json()) as { id: string; name: string };
    expect(created.name).toBe("ທົດສອບຫມວດ");

    const patchRes = await app.handle(
      authedRequest(
        `http://localhost/api/categories/${created.id}`,
        adminCookie,
        {
          method: "PATCH",
          body: JSON.stringify({ name: "ຫມວດແກ້ໄຂ" }),
        },
      ),
    );
    expect(patchRes.status).toBe(200);
    const patched = (await patchRes.json()) as { name: string };
    expect(patched.name).toBe("ຫມວດແກ້ໄຂ");

    const delRes = await app.handle(
      authedRequest(
        `http://localhost/api/categories/${created.id}`,
        adminCookie,
        { method: "DELETE" },
      ),
    );
    expect(delRes.status).toBe(204);
  });
});
