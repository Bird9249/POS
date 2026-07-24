import * as z from "zod";

export const loginFormSchema = z.object({
  email: z
    .string()
    .min(1, "ກະລຸນາໃສ່ອີເມວ")
    .email("ອີເມວບໍ່ຖືກຕ້ອງ"),
  password: z
    .string()
    .min(1, "ກະລຸນາໃສ່ລະຫັດຜ່ານ")
    .min(6, "ລະຫັດຜ່ານຕ້ອງມີຢ່າງໜ້ອຍ 6 ຕົວ"),
});

export type LoginFormValues = z.infer<typeof loginFormSchema>;
