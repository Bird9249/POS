import { z } from "zod";

export const CategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  productCount: z.number().int().optional(),
});
export type CategoryDTO = z.infer<typeof CategorySchema>;

export const CreateCategorySchema = z.object({
  name: z.string().trim().min(1).max(120),
});
export type CreateCategoryDTO = z.infer<typeof CreateCategorySchema>;

export const UpdateCategorySchema = z.object({
  name: z.string().trim().min(1).max(120),
});
export type UpdateCategoryDTO = z.infer<typeof UpdateCategorySchema>;

export const IdParamSchema = z.object({ id: z.string().min(1) });
