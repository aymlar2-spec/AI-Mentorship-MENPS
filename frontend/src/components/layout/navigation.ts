import {
  LayoutDashboard,
  UserCircle,
  Users2,
  MessageCircle,
  History,
  ShieldCheck,
  Settings,
  type LucideIcon,
} from "lucide-react";
import type { UserRole } from "@/types";

export interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  /** Restrict visibility to these roles; omit to show to everyone authenticated. */
  roles?: UserRole[];
}

/**
 * Primary navigation — mirrors the page inventory from
 * UI_UX_Design_Specification_MENPS.docx: Dashboard, Profile, Matching,
 * AI Chat, History, Administration, Settings.
 */
export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "Profile", path: "/profile", icon: UserCircle },
  { label: "Matching", path: "/matching", icon: Users2, roles: ["mentee", "admin"] },
  { label: "AI Chat", path: "/chat", icon: MessageCircle },
  { label: "History", path: "/history", icon: History },
  { label: "Administration", path: "/admin", icon: ShieldCheck, roles: ["admin"] },
  { label: "Settings", path: "/settings", icon: Settings },
];

export function getVisibleNavItems(role: UserRole | undefined): NavItem[] {
  return NAV_ITEMS.filter((item) => !item.roles || (role && item.roles.includes(role)));
}
