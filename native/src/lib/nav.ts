import {
  ClipboardList,
  History,
  Package,
  Settings,
  ShoppingCart,
  type LucideIcon,
} from "lucide-react";
import type { PosPath } from "@/features/auth/nav-access";

export type AppPath = PosPath | "/login";

export type NavItem = {
  to: PosPath;
  label: string;
  icon: LucideIcon;
};

export const navIcons: Record<PosPath, LucideIcon> = {
  "/checkout": ShoppingCart,
  "/sales": History,
  "/products": Package,
  "/reports": ClipboardList,
  "/settings": Settings,
};
