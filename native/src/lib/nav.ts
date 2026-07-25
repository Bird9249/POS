import {
  ClipboardList,
  History,
  Package,
  ShoppingCart,
  type LucideIcon,
} from "lucide-react";
import type { BottomNavPath, PosPath } from "@/features/auth/nav-access";

export type AppPath = PosPath | "/login";

export type NavItem = {
  to: BottomNavPath;
  label: string;
  icon: LucideIcon;
};

export const navIcons: Record<BottomNavPath, LucideIcon> = {
  "/checkout": ShoppingCart,
  "/sales": History,
  "/products": Package,
  "/reports": ClipboardList,
};
