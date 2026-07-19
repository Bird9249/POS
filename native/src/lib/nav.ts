import {
  Home as HomeIcon,
  LayoutDashboard,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";

export type AppPath = "/" | "/dashboard" | "/users" | "/settings";

export type NavItem = {
  to: AppPath;
  label: string;
  icon: LucideIcon;
};

export const navItems: NavItem[] = [
  { to: "/", label: "ໜ້າຫຼັກ", icon: HomeIcon },
  { to: "/dashboard", label: "ແດຊບອດ", icon: LayoutDashboard },
  { to: "/users", label: "ຜູ້ໃຊ້", icon: Users },
  { to: "/settings", label: "ຕັ້ງຄ່າ", icon: Settings },
];
