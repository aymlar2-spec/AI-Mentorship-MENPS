import { NavLink } from "react-router-dom";
import { X, Sparkles } from "lucide-react";
import { cn } from "@/lib/cn";
import { useAuth } from "@/hooks/useAuth";
import { getVisibleNavItems } from "./navigation";

export interface SidebarProps {
  /** Desktop: permanent but can be collapsed to icon-only (tablet default). */
  isCollapsed: boolean;
  /** Mobile: shown as an overlay drawer. */
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

/**
 * Sidebar — MENPS design-system component.
 * Desktop (lg+): permanent, full-width.
 * Tablet (md): collapsible to icon rail (`isCollapsed`).
 * Mobile: hidden by default, rendered as a drawer over the content.
 */
export function Sidebar({ isCollapsed, isMobileOpen, onCloseMobile }: SidebarProps) {
  const { user } = useAuth();
  const items = getVisibleNavItems(user?.role);

  const content = (
    <nav className="flex h-full flex-col" aria-label="Primary navigation">
      <div
        className={cn("flex items-center gap-2 px-4 py-5", isCollapsed && "justify-center px-2")}
      >
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-control)] bg-primary text-white">
          <Sparkles className="h-4.5 w-4.5" aria-hidden="true" />
        </span>
        {!isCollapsed && (
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-text">MENPS</p>
            <p className="truncate text-xs text-text-muted">Mentorship Platform</p>
          </div>
        )}
        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Close navigation"
          className="ml-auto rounded-full p-1.5 text-text-muted hover:bg-black/[0.05] md:hidden"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <ul className="flex flex-1 flex-col gap-1 overflow-y-auto scrollbar-thin px-2 py-2">
        {items.map((item) => (
          <li key={item.path}>
            <NavLink
              to={item.path}
              onClick={onCloseMobile}
              title={isCollapsed ? item.label : undefined}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-[var(--radius-control)] px-3 py-2.5 text-sm font-medium transition-colors duration-200",
                  isCollapsed && "justify-center px-2",
                  isActive
                    ? "bg-primary-light text-primary"
                    : "text-text-muted hover:bg-black/[0.04] hover:text-text",
                )
              }
            >
              <item.icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
              {!isCollapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          </li>
        ))}
      </ul>

      {!isCollapsed && user && (
        <div className="border-t border-border px-4 py-4">
          <p className="truncate text-sm font-medium text-text">{user.full_name}</p>
          <p className="truncate text-xs capitalize text-text-muted">{user.role}</p>
        </div>
      )}
    </nav>
  );

  return (
    <>
      {/* Desktop / tablet: permanent rail */}
      <aside
        className={cn(
          "hidden md:flex md:flex-col border-r border-border bg-card transition-[width] duration-200",
          isCollapsed ? "md:w-[72px]" : "md:w-64",
        )}
      >
        {content}
      </aside>

      {/* Mobile: drawer */}
      <div
        className={cn(
          "fixed inset-0 z-40 md:hidden transition-opacity duration-200",
          isMobileOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        )}
        aria-hidden={!isMobileOpen}
      >
        <div className="absolute inset-0 bg-slate-900/50" onClick={onCloseMobile} />
        <aside
          className={cn(
            "absolute left-0 top-0 h-full w-64 bg-card shadow-xl transition-transform duration-200",
            isMobileOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          {content}
        </aside>
      </div>
    </>
  );
}
