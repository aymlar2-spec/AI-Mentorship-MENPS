import { ShieldCheck } from "lucide-react";
import { Card, Tab, TabList, TabPanel, Tabs } from "@/components/ui";
import { AdminMatchingPanel, AdminStats, ThemeManager, UsersPanel } from "@/components/admin";

export default function Administration() {
  return (
    <div className="flex flex-col gap-6">
      <Card padding="md" className="flex items-start gap-3">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-light text-primary">
          <ShieldCheck className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h1 className="text-lg font-semibold text-text">Administration</h1>
          <p className="mt-1 text-sm text-text-muted">
            Gérez les utilisateurs, les thématiques et le matching du programme MENPS.
          </p>
        </div>
      </Card>

      <AdminStats />

      <Card padding="md">
        <Tabs defaultTab="users">
          <TabList>
            <Tab id="users">Utilisateurs</Tab>
            <Tab id="themes">Thématiques</Tab>
            <Tab id="matching">Matching</Tab>
          </TabList>

          <TabPanel id="users">
            <UsersPanel />
          </TabPanel>
          <TabPanel id="themes">
            <ThemeManager />
          </TabPanel>
          <TabPanel id="matching">
            <AdminMatchingPanel />
          </TabPanel>
        </Tabs>
      </Card>
    </div>
  );
}
