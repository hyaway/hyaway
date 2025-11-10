import { ChevronDownIcon } from "@heroicons/react/24/solid";
import { ThemeSwitcher } from "./theme-switcher";
import type { NavbarProps } from "@/components/ui/navbar";
import {
  Navbar,
  NavbarGap,
  NavbarItem,
  NavbarItemLink,
  NavbarMobile,
  NavbarProvider,
  NavbarSection,
  NavbarSpacer,
  NavbarStart,
  NavbarTrigger,
} from "@/components/ui/navbar";
import { Menu, MenuContent, MenuItem, MenuLink } from "@/components/ui/menu";
import { useGetMediaPagesQuery } from "@/integrations/hydrus-api/queries/manage-pages";

export default function MainNavbar(props: NavbarProps) {
  return (
    <NavbarProvider>
      <Navbar {...props}>
        <NavbarStart>
          <span>:)</span>
        </NavbarStart>
        <NavbarGap />
        <NavbarSection>
          <NavbarItemLink to={"/"}>Home</NavbarItemLink>
          <PagesNav />
          <NavbarItemLink to="/recently-deleted">
            Recently deleted
          </NavbarItemLink>
          <NavbarItemLink to="/recently-archived">
            Recently archived
          </NavbarItemLink>
          <NavbarItemLink to="/recently-inboxed">
            Recently inboxed
          </NavbarItemLink>
          <NavbarItemLink to={"/settings"}>Settings</NavbarItemLink>
        </NavbarSection>
        <NavbarSpacer />
        <NavbarSection className="hidden md:flex">
          <ThemeSwitcher />
        </NavbarSection>
      </Navbar>
      <NavbarMobile>
        <NavbarTrigger />
        <NavbarSpacer />
        <ThemeSwitcher />
      </NavbarMobile>
    </NavbarProvider>
  );
}

function PagesNav() {
  const { data, isPending, isSuccess } = useGetMediaPagesQuery();
  return (
    <Menu>
      <NavbarItem>
        Client pages
        <ChevronDownIcon className="col-start-3" />
      </NavbarItem>
      <MenuContent className="min-w-(--trigger-width) sm:min-w-56">
        {isPending && <MenuItem>Nothing here yet</MenuItem>}
        {isSuccess &&
          data.map((page) => (
            <MenuLink
              id={page.page_key}
              textValue={page.name}
              key={page.page_key}
              to={`/pages/$pageId`}
              params={{ pageId: page.page_key }}
              activeProps={{
                className:
                  "font-bold rounded-s-none border-s-4 border-s-primary",
              }}
            >
              {page.name}
            </MenuLink>
          ))}
      </MenuContent>
    </Menu>
  );
}
