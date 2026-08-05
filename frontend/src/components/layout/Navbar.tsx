import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronDown,
  LogOut,
  Settings as SettingsIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useAuth } from "@/hooks/useAuth";
import { Avatar } from "@/components/ui";

export interface NavbarProps {
  title: string;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onOpenMobile: () => void;
}

/**
 * Navbar — MENPS design-system component.
 * Hosts the mobile menu trigger, desktop collapse toggle, page title, and
 * the user menu (profile shortcut + logout).
 */
export function Navbar({ title, isCollapsed, onToggleCollapse, onOpenMobile }: NavbarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border bg-card px-4 md:px-6">
      <button
        type="button"
        onClick={onOpenMobile}
        aria-label="Open navigation"
        className="rounded-[var(--radius-control)] p-2 text-text-muted hover:bg-black/[0.04] md:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      <button
        type="button"
        onClick={onToggleCollapse}
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="hidden rounded-[var(--radius-control)] p-2 text-text-muted hover:bg-black/[0.04] md:inline-flex"
      >
        {isCollapsed ? (
          <PanelLeftOpen className="h-5 w-5" />
        ) : (
          <PanelLeftClose className="h-5 w-5" />
        )}
      </button>

      <h1 className="min-w-0 truncate text-base font-semibold text-text">{title}</h1>

      <div className="ml-auto flex items-center gap-3" ref={menuRef}>
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsMenuOpen((open) => !open)}
            aria-haspopup="menu"
            aria-expanded={isMenuOpen}
            className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 transition-colors duration-200 hover:bg-black/[0.04]"
          >
            <Avatar name={user?.full_name ?? "?"} size={32} />
            <span className="hidden text-sm font-medium text-text sm:inline">
              {user?.full_name}
            </span>
            <ChevronDown className="hidden h-3.5 w-3.5 text-text-muted sm:inline" />
          </button>

          {isMenuOpen && (
            <div
              role="menu"
              className={cn(
                "absolute right-0 mt-2 w-48 overflow-hidden rounded-[var(--radius-control)] border border-border bg-card shadow-lg",
                "animate-[fade-in_150ms_ease-out]",
              )}
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setIsMenuOpen(false);
                  navigate("/settings");
                }}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-text hover:bg-black/[0.04]"
              >
                <SettingsIcon className="h-4 w-4 text-text-muted" />
                Settings
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={handleLogout}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-danger hover:bg-danger-light"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
