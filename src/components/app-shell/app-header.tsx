// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

"use client";

import { AppBreadcrumb } from "@/components/app-shell/app-breadcrumb";
import {
  HeaderActionsPortalSlot,
  useHeaderActionsHasContent,
} from "@/components/app-shell/header-actions-portal";
import { useRightSidebarHasContent } from "@/components/app-shell/right-sidebar-portal";
import { ThemeSwitcher } from "@/components/app-shell/theme-switcher";
import { Separator } from "@/components/ui-primitives/separator";
import { SidebarTrigger } from "@/components/ui-primitives/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";

export function AppHeader() {
  const hasRightSidebar = useRightSidebarHasContent();
  const hasHeaderActions = useHeaderActionsHasContent();
  const isMobile = useIsMobile();

  return (
    <div className="short:h-(--header-height-short) flex h-(--header-height) shrink-0 items-center gap-2 px-4">
      <SidebarTrigger side="left" className="-ml-1" />
      <Separator
        orientation="vertical"
        className="my-auto mr-2 data-[orientation=vertical]:h-4"
      />
      <AppBreadcrumb />
      {/* Header actions portal slot */}
      <HeaderActionsPortalSlot />
      {hasHeaderActions && (isMobile || hasRightSidebar) && (
        <Separator
          orientation="vertical"
          className="my-auto data-[orientation=vertical]:h-4"
        />
      )}
      {isMobile && <ThemeSwitcher size="icon-sm" />}
      {hasRightSidebar && (
        <>
          {isMobile && (
            <Separator
              orientation="vertical"
              className="my-auto data-[orientation=vertical]:h-4"
            />
          )}
          <SidebarTrigger side="right" className="-mr-1" />
        </>
      )}
    </div>
  );
}
