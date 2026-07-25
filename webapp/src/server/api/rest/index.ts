import { Elysia } from "elysia";
import { auditRoutes } from "@/modules/audit/api";
import { authRoutes } from "@/modules/auth/api";
import { categoriesRoutes } from "@/modules/categories/api";
import { productsRoutes } from "@/modules/products/api";
import { rolesRoutes } from "@/modules/roles/api";
import { salesRoutes } from "@/modules/sales/api";
import { settingsRoutes } from "@/modules/settings/api";
import { uploadRoutes } from "@/modules/upload/api";
import { usersRoutes } from "@/modules/users/api";

export function createRestRoutes() {
  return new Elysia()
    .use(authRoutes)
    .use(usersRoutes)
    .use(rolesRoutes)
    .use(auditRoutes)
    .use(uploadRoutes)
    .use(categoriesRoutes)
    .use(productsRoutes)
    .use(salesRoutes)
    .use(settingsRoutes);
}
