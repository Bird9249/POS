import { z } from "zod";
import { copy } from "./ui-copy";

export const userFormSchema = z
  .object({
    name: z.string().trim().min(1),
    email: z.string().trim().email(),
    roleId: z.string().min(1),
    password: z.string(),
    isCreate: z.boolean(),
  })
  .superRefine((val, ctx) => {
    if (val.isCreate) {
      if (!val.password.trim()) {
        ctx.addIssue({
          code: "custom",
          path: ["password"],
          message: copy.passwordRequired,
        });
      } else if (val.password.length < 6) {
        ctx.addIssue({
          code: "custom",
          path: ["password"],
          message: copy.passwordMin,
        });
      }
    } else if (val.password && val.password.length < 6) {
      ctx.addIssue({
        code: "custom",
        path: ["password"],
        message: copy.passwordMin,
      });
    }
  });

export type UserFormValues = z.infer<typeof userFormSchema>;
