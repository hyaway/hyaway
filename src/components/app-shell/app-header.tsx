"use client";

import { AppBreadcrumb } from "@/components/app-shell/app-breadcrumb";
import { useRightSidebarHasContent } from "@/components/app-shell/right-sidebar-portal";
import { Separator } from "@/components/ui-primitives/separator";
import { SidebarTrigger } from "@/components/ui-primitives/sidebar";

export function AppHeader() {
  const hasRightSidebar = useRightSidebarHasContent();

  return (
    <div className="short:h-(--header-height-short) flex h-(--header-height) shrink-0 items-center gap-2 px-4">
      <SidebarTrigger side="left" className="-ml-1" />
      <Separator
        orientation="vertical"
        className="my-auto mr-2 data-[orientation=vertical]:h-4"
      />
      <AppBreadcrumb />
      {hasRightSidebar && (
        <>
          <Separator
            orientation="vertical"
            className="my-auto ml-auto data-[orientation=vertical]:h-4"
          />
          <SidebarTrigger side="right" className="-mr-1" />
        </>
      )}
    </div>
  );
}
