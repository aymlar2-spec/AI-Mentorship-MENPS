import { createContext, useContext, useId, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

interface TabsContextValue {
  activeTab: string;
  setActiveTab: (id: string) => void;
  baseId: string;
}

const TabsContext = createContext<TabsContextValue | undefined>(undefined);

export interface TabsProps {
  defaultTab: string;
  children: ReactNode;
  className?: string;
}

/**
 * Tabs — MENPS design-system component.
 * Accessible tab navigation (roving tablist) used by the Administration
 * page. Compose with <TabList>/<Tab>/<TabPanel>.
 */
export function Tabs({ defaultTab, children, className }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const baseId = useId();

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab, baseId }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

function useTabsContext(component: string): TabsContextValue {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error(`<${component}> must be used within <Tabs>`);
  return ctx;
}

export function TabList({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      role="tablist"
      className={cn("flex gap-1 border-b border-border overflow-x-auto scrollbar-thin", className)}
    >
      {children}
    </div>
  );
}

export function Tab({ id, children }: { id: string; children: ReactNode }) {
  const { activeTab, setActiveTab, baseId } = useTabsContext("Tab");
  const isActive = activeTab === id;

  return (
    <button
      type="button"
      role="tab"
      id={`${baseId}-tab-${id}`}
      aria-selected={isActive}
      aria-controls={`${baseId}-panel-${id}`}
      tabIndex={isActive ? 0 : -1}
      onClick={() => setActiveTab(id)}
      className={cn(
        "shrink-0 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors duration-200",
        isActive
          ? "border-primary text-primary"
          : "border-transparent text-text-muted hover:text-text",
      )}
    >
      {children}
    </button>
  );
}

export function TabPanel({ id, children }: { id: string; children: ReactNode }) {
  const { activeTab, baseId } = useTabsContext("TabPanel");
  if (activeTab !== id) return null;

  return (
    <div
      role="tabpanel"
      id={`${baseId}-panel-${id}`}
      aria-labelledby={`${baseId}-tab-${id}`}
      className="pt-5 animate-[fade-in_200ms_ease-out]"
    >
      {children}
    </div>
  );
}
