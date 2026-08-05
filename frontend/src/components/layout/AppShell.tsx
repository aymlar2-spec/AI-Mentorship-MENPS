import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";
import { NAV_ITEMS } from "./navigation";

function usePageTitle(): string {
  const location = useLocation();
  const match = NAV_ITEMS.find((item) => location.pathname.startsWith(item.path));
  return match?.label ?? "MENPS";
}

/**
 * AppShell — the authenticated app layout.
 * Composes Sidebar + Navbar around routed page content (<Outlet />), and
 * owns the collapse/drawer state shared between the two.
 */
export function AppShell() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const title = usePageTitle();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        isCollapsed={isCollapsed}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar
          title={title}
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed((c) => !c)}
          onOpenMobile={() => setIsMobileOpen(true)}
        />
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-6 md:py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
