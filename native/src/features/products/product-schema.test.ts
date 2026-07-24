import { describe, expect, test } from "bun:test";
import { categoryFormSchema, productFormSchema } from "./product-schema";

describe("productFormSchema", () => {
  test("accepts valid product", () => {
    const result = productFormSchema.safeParse({
      name: "ນ້ຳ",
      sellPrice: "5000",
      costPrice: "2000",
      stockQty: "10",
      barcode: "",
      sku: "",
      categoryId: "",
      minStock: "5",
      image: "",
    });
    expect(result.success).toBe(true);
  });

  test("rejects empty name", () => {
    const result = productFormSchema.safeParse({
      name: "  ",
      sellPrice: 1,
      costPrice: 1,
      stockQty: 0,
    });
    expect(result.success).toBe(false);
  });
});

describe("categoryFormSchema", () => {
  test("requires name", () => {
    expect(categoryFormSchema.safeParse({ name: "" }).success).toBe(false);
    expect(categoryFormSchema.safeParse({ name: "ດື່ມ" }).success).toBe(true);
  });
});
