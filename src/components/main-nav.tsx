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
} from "@/components/ui-primitives/navigation-menu";
import { useGetMediaPagesQuery } from "@/integrations/hydrus-api/queries/manage-pages";

export default function MainNavbar() {
  return (
    <NavigationMenu>
      <Logo />
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuLink>
            <Link to={"/"}>Home</Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
        <PagesNav />
        <NavigationMenuItem>
          <NavigationMenuLink>
            <Link to="/recently-deleted">Recently deleted</Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink>
            <Link to="/recently-archived">Recently archived</Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink>
            <Link to="/recently-inboxed">Recently inboxed</Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink>
            <Link to={"/settings"}>Settings</Link>
          </NavigationMenuLink>
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
      <NavigationMenuContent className="min-w-(--trigger-width) sm:min-w-56">
        {isPending && (
          <div className="text-sm leading-none font-medium">
            Nothing here yet
          </div>
        )}
        {isSuccess &&
          data.map((page) => (
            <NavigationMenuLink id={page.page_key} key={page.page_key}>
              <Link
                to={`/pages/$pageId`}
                params={{ pageId: page.page_key }}
                activeProps={{
                  className:
                    "font-bold rounded-s-none border-s-4 border-s-primary",
                }}
              >
                {page.name}
              </Link>
            </NavigationMenuLink>
          ))}
      </NavigationMenuContent>
    </NavigationMenuItem>
  );
}
