import { Outlet, createFileRoute, linkOptions } from "@tanstack/react-router";
import { IconLayoutDashboard, IconLock } from "@tabler/icons-react";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
  RouterNavigationMenuLink,
} from "@/components/ui-primitives/navigation-menu";
import { PageHeading } from "@/components/page/page-heading";

export const Route = createFileRoute("/settings")({
  component: SettingsComponent,
  beforeLoad: () => ({
    getTitle: () => "Settings",
  }),
});

const settingsItems = linkOptions([
  {
    name: "Client API",
    to: "/settings/client-api",
    icon: IconLock,
  },
  { name: "UX", to: "/settings/ux", icon: IconLayoutDashboard },
]);

function SettingsComponent() {
  return (
    <div>
      <PageHeading title="Settings" />
      <NavigationMenu className="mb-8">
        <NavigationMenuList>
          {settingsItems.map((item) => (
            <NavigationMenuItem key={item.to}>
              <RouterNavigationMenuLink to={item.to}>
                <item.icon aria-hidden="true" />
                {item.name}
              </RouterNavigationMenuLink>
            </NavigationMenuItem>
          ))}
        </NavigationMenuList>
      </NavigationMenu>

      <div className="space-y-16 sm:space-y-20">
        <Outlet />
      </div>
    </div>
  );
}
