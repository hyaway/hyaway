import { ThemeSwitcher } from "./theme-switcher";
import { Heading } from "./ui-primitives/heading";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
  RouterNavigationMenuLink,
} from "@/components/ui-primitives/navigation-menu";

export default function MainNavbar() {
  return (
    <NavigationMenu className="max-w-full">
      <Heading className="font-logo font-normal tracking-normal" level={1}>
        hyAway
      </Heading>
      <NavigationMenuList className="ms-4 flex-wrap justify-start gap-1">
        <NavigationMenuItem>
          <RouterNavigationMenuLink to="/pages">Pages</RouterNavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <RouterNavigationMenuLink to="/recently-deleted">
            Recently deleted
          </RouterNavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <RouterNavigationMenuLink to="/recently-archived">
            Recently archived
          </RouterNavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <RouterNavigationMenuLink to="/recently-inboxed">
            Recently inboxed
          </RouterNavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <RouterNavigationMenuLink to={"/settings"}>
            Settings
          </RouterNavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
      <ThemeSwitcher className={"ms-auto border-0"} />
    </NavigationMenu>
  );
}
