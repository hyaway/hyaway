import { Link } from "@tanstack/react-router";
import { ThemeSwitcher } from "./theme-switcher";
import { Heading } from "./ui-primitives/heading";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  RouterNavigationMenuLink,
} from "@/components/ui-primitives/navigation-menu";
import { useGetMediaPagesQuery } from "@/integrations/hydrus-api/queries/manage-pages";

export default function MainNavbar() {
  return (
    <NavigationMenu>
      <Logo />
      <NavigationMenuList>
        <NavigationMenuItem>
          <RouterNavigationMenuLink to={"/"}>Home</RouterNavigationMenuLink>
        </NavigationMenuItem>
        <PagesNav />
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
      <ThemeSwitcher />
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

function PagesNav() {
  const { data, isPending, isSuccess } = useGetMediaPagesQuery();
  return (
    <NavigationMenuItem>
      <NavigationMenuTrigger>Client pages</NavigationMenuTrigger>
      <NavigationMenuContent>
        {isPending && (
          <div className="text-sm leading-none font-medium">
            Nothing here yet
          </div>
        )}
        {isSuccess &&
          data.map((page) => (
            <RouterNavigationMenuLink
              id={page.page_key}
              key={page.page_key}
              to={`/pages/$pageId`}
              params={{ pageId: page.page_key }}
              activeProps={{
                active: true,
                "data-active": true,
                className:
                  "font-bold rounded-s-none border-s-4 border-s-primary",
              }}
            >
              {page.name}
            </RouterNavigationMenuLink>
          ))}
      </NavigationMenuContent>
    </NavigationMenuItem>
  );
}
