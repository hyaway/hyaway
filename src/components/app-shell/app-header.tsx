import { AppBreadcrumb } from "@/components/app-shell/app-breadcrumb";
import { Separator } from "@/components/ui-primitives/separator";
import { SidebarTrigger } from "@/components/ui-primitives/sidebar";

export function AppHeader() {
  return (
    <div className="short:h-(--header-height-short) flex h-(--header-height) shrink-0 items-center gap-2 px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator
        orientation="vertical"
        className="my-auto mr-2 data-[orientation=vertical]:h-4"
      />
      <AppBreadcrumb />
    </div>
  );
}
