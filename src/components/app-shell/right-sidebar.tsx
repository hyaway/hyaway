"use client";

import * as React from "react";
import {
  RightSidebarSlot,
  useRightSidebarHasContent,
} from "./right-sidebar-portal";
import { Sidebar, SidebarContent } from "@/components/ui-primitives/sidebar";
import { cn } from "@/lib/utils";

export function RightSidebar({
  className,
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const hasContent = useRightSidebarHasContent();

  if (!hasContent) {
    return null;
  }

  return (
    <Sidebar
      side="right"
      collapsible="offExamples"
      className={cn(className)}
      {...props}
    >
      <SidebarContent>
        <RightSidebarSlot className="flex h-full flex-col" />
      </SidebarContent>
    </Sidebar>
  );
}
