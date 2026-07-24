import { beforeAll, describe, expect, test } from "bun:test";
import { createServer } from "./server";

describe("GET /api/health", () => {
  let app: ReturnType<typeof createServer>;

  beforeAll(() => {
    app = createServer();
  });

  test("returns 200 and ok: true", async () => {
    const res = await app.handle(new Request("http://localhost/api/health"));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean };
    expect(body.ok).toBe(true);
  });
});
