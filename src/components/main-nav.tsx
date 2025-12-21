import { ThemeSwitcher } from "./theme-switcher";
import { Heading } from "./ui-primitives/heading";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
  RouterNavigationMenuLink,
} from "@/components/ui-primitives/navigation-menu";
import { useGetMediaPagesQuery } from "@/integrations/hydrus-api/queries/manage-pages";

export default function MainNavbar() {
  return (
    <NavigationMenu className="max-w-full">
      <Logo />
      <NavigationMenuList className="ms-4 flex-wrap justify-start gap-1">
        <NavigationMenuItem>
          <RouterNavigationMenuLink to={"/"}>Home</RouterNavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <RouterNavigationMenuLink to="/pages">
            Client pages
          </RouterNavigationMenuLink>
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
function Logo() {
  return (
    <Heading className="font-logo font-normal tracking-normal" level={1}>
      hyAway
    </Heading>
  );
}
