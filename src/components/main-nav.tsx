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
      </Navbar>
      <NavbarMobile>
        <NavbarTrigger />
      </NavbarMobile>
    </NavbarProvider>
  );
}
