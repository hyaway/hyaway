import {
  Navbar,
  NavbarGap,
  NavbarItem,
  NavbarItemLink,
  NavbarMobile,
  type NavbarProps,
  NavbarProvider,
  NavbarSection,
  NavbarSpacer,
  NavbarStart,
  NavbarTrigger,
} from "@/components/ui/navbar";
import { ThemeSwitcher } from "./theme-switcher";
import { Menu, MenuContent, MenuItem, MenuLink } from "@/components/ui/menu";
import { ChevronDownIcon } from "@heroicons/react/24/solid";
import { useGetMediaPagesQuery } from "@/integrations/hydrus-api/queries";

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
  const { data, isLoading, isSuccess } = useGetMediaPagesQuery();
  return (
    <Menu>
      <NavbarItem>
        Pages
        <ChevronDownIcon className="col-start-3" />
      </NavbarItem>
      <MenuContent className="min-w-(--trigger-width) sm:min-w-56">
        {isLoading && <MenuItem>Loading...</MenuItem>}
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
