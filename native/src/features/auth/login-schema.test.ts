import { describe, expect, test } from "bun:test";
import { loginFormSchema } from "./login-schema";

describe("loginFormSchema", () => {
  test("accepts demo credentials shape", () => {
    const result = loginFormSchema.safeParse({
      email: "admin@admin.com",
      password: "123456",
    });
    expect(result.success).toBe(true);
  });

  test("rejects short password", () => {
    const result = loginFormSchema.safeParse({
      email: "admin@admin.com",
      password: "123",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "ລະຫັດຜ່ານຕ້ອງມີຢ່າງໜ້ອຍ 6 ຕົວ",
      );
    }
  });
});
