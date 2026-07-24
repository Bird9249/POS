import { describe, expect, test } from "bun:test";

/**
 * Pure helper mirror of normalize logic in update-product service.
 * Ensures empty string clears image the same way as users module.
 */
function normalizeImage(
  image: string | null | undefined,
): string | null | undefined {
  if (image === undefined) return undefined;
  if (image === null) return null;
  const trimmed = image.trim();
  return trimmed === "" ? null : trimmed;
}

describe("product image normalize", () => {
  test("empty string becomes null (clear)", () => {
    expect(normalizeImage("")).toBeNull();
    expect(normalizeImage("  ")).toBeNull();
  });

  test("undefined means leave unchanged", () => {
    expect(normalizeImage(undefined)).toBeUndefined();
  });

  test("keeps object key", () => {
    expect(normalizeImage("uploads/products/a.jpg")).toBe(
      "uploads/products/a.jpg",
    );
  });
});
