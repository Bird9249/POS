import { describe, expect, test } from "bun:test";
import { parseCorsOrigins } from "./cors-origins";

describe("parseCorsOrigins", () => {
  test("splits comma-separated origins", () => {
    expect(
      parseCorsOrigins("http://localhost:3000,http://localhost:1420"),
    ).toEqual(["http://localhost:3000", "http://localhost:1420"]);
  });

  test("trims whitespace", () => {
    expect(parseCorsOrigins(" http://a.com , http://b.com ")).toEqual([
      "http://a.com",
      "http://b.com",
    ]);
  });

  test("falls back when empty", () => {
    expect(parseCorsOrigins("")).toEqual(["http://localhost:3000"]);
    expect(parseCorsOrigins(undefined)).toEqual(["http://localhost:3000"]);
  });
});
