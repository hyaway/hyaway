import { Outlet, createFileRoute, linkOptions } from "@tanstack/react-router";
import {
  FingerPrintIcon,
  RectangleGroupIcon,
} from "@heroicons/react/24/outline";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
  RouterNavigationMenuLink,
} from "@/components/ui-primitives/navigation-menu";
import { Heading } from "@/components/ui-primitives/heading";
import { Separator } from "@/components/ui-primitives/separator";

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
    icon: FingerPrintIcon,
  },
  { name: "UX", to: "/settings/ux", icon: RectangleGroupIcon },
]);

function SettingsComponent() {
  const { getTitle } = Route.useRouteContext();
  return (
    <div>
      <Heading level={1}>{getTitle()}</Heading>
      <Separator className="my-2" />

      <NavigationMenu className="mb-8">
        <NavigationMenuList>
          {settingsItems.map((item) => (
            <NavigationMenuItem key={item.to}>
              <RouterNavigationMenuLink to={item.to}>
                <item.icon aria-hidden="true" className="size-4" />
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
