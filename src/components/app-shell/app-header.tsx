import { AppBreadcrumb } from "@/components/app-shell/app-breadcrumb";
import { BackButton } from "@/components/app-shell/back-button";
import { FloatingHeader } from "@/components/app-shell/floating-header";
import { HeaderPortalSlot } from "@/components/app-shell/header-portal";
import { Separator } from "@/components/ui-primitives/separator";
import { SidebarTrigger } from "@/components/ui-primitives/sidebar";
import {
  SCROLL_RESTORATION_EVENT,
  dispatchScrollRestoration,
} from "@/hooks/use-scroll-direction";

// Re-export for backwards compatibility
export { SCROLL_RESTORATION_EVENT, dispatchScrollRestoration };

export function AppHeader() {
  return (
    <FloatingHeader>
      <div className="short:h-(--header-height-short) flex h-(--header-height) shrink-0 items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="my-auto mr-2 data-[orientation=vertical]:h-4"
        />
        <BackButton className="md:hidden" />
        <AppBreadcrumb />
      </div>
      <HeaderPortalSlot className="px-4" />
    </FloatingHeader>
  );
}
