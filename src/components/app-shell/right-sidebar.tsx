"use client";

import * as React from "react";
import { RightSidebarSlot } from "./right-sidebar-portal";
import { Sidebar, SidebarContent } from "@/components/ui-primitives/sidebar";

export function RightSidebar(props: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar side="right" collapsible="none" {...props}>
      <SidebarContent>
        <RightSidebarSlot className="flex h-full flex-col" />
      </SidebarContent>
    </Sidebar>
  );
}
