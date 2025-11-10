import {
  Navbar,
  NavbarGap,
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
