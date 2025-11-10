import { createFileRoute, Outlet, useLocation } from "@tanstack/react-router";
import { TabLink, TabList, TabPanel, Tabs } from "@/components/ui/tabs";

export const Route = createFileRoute("/settings")({
  component: SettingsComponent,
});

function SettingsComponent() {
  const pathname = useLocation({
    select: (location) => location.pathname,
  });
  return (
    <Tabs aria-label="Navbar" selectedKey={pathname}>
      <TabList className="px-4">
        <TabLink to="/settings/account" id="/settings/account">
          Account
        </TabLink>
        <TabLink to="/settings/ux" id="/settings/ux">
          UX
        </TabLink>
      </TabList>
      <TabPanel id={pathname}>
        <Outlet />
      </TabPanel>
    </Tabs>
  );
}
