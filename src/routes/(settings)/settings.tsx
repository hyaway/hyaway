import { Outlet, createFileRoute, linkOptions } from "@tanstack/react-router";
import {
  IconDatabase,
  IconLayoutDashboard,
  IconLayoutDashboardFilled,
  IconLock,
  IconLockFilled,
} from "@tabler/icons-react";
import type { ComponentType } from "react";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
  RouterNavigationMenuLink,
} from "@/components/ui-primitives/navigation-menu";
import { PageHeading } from "@/components/page-shell/page-heading";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/(settings)/settings")({
  component: SettingsComponent,
  beforeLoad: () => ({
    getTitle: () => "Settings",
  }),
});

/** Icon pair component that shows outline icon normally, filled when parent has data-active */
function NavIcon({
  icon: Icon,
  filledIcon: FilledIcon,
  className,
}: {
  icon: ComponentType<{ className?: string; stroke?: number }>;
  filledIcon: ComponentType<{ className?: string; stroke?: number }>;
  className?: string;
}) {
  return (
    <>
      <Icon
        className={cn(className, "group-data-active:hidden")}
        stroke={Icon === FilledIcon ? 1.5 : undefined}
      />
      <FilledIcon
        className={cn(className, "hidden group-data-active:block")}
        stroke={Icon === FilledIcon ? 2.25 : undefined}
      />
    </>
  );
}

const settingsItems = linkOptions([
  {
    name: "Client API",
    to: "/settings/client-api",
    icon: IconLock,
    filledIcon: IconLockFilled,
  },
  {
    name: "UX",
    to: "/settings/ux",
    icon: IconLayoutDashboard,
    filledIcon: IconLayoutDashboardFilled,
  },
  {
    name: "Data",
    to: "/settings/data",
    icon: IconDatabase,
    filledIcon: IconDatabase,
  },
]);

function SettingsComponent() {
  return (
    <div>
      <PageHeading title="Settings" />
      <NavigationMenu className="mb-8">
        <NavigationMenuList className={"flex-wrap"}>
          {settingsItems.map((item) => (
            <NavigationMenuItem key={item.to}>
              <RouterNavigationMenuLink to={item.to} className="group">
                <NavIcon
                  icon={item.icon}
                  filledIcon={item.filledIcon}
                  aria-hidden="true"
                />
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
