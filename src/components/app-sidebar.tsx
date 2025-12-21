"use client";

import * as React from "react";

import {
  ArchiveBoxIcon,
  Cog6ToothIcon,
  InboxIcon,
  Squares2X2Icon,
  TrashIcon,
} from "@heroicons/react/16/solid";
import { Heading } from "./ui-primitives/heading";
import { SidebarThemeSwitcher } from "./theme-switcher";
import { TouchTarget } from "./ui-primitives/touch-target";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuLinkButton,
  SidebarRail,
} from "@/components/ui-primitives/sidebar";

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuLinkButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              to="/"
            >
              <TouchTarget>
                <div className="border-sidebar-primary flex aspect-square size-8 items-center justify-center rounded-lg border">
                  <span className="size-4">hA</span>
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <Heading className="truncate font-medium" level={1}>
                    hyAway
                  </Heading>
                </div>
              </TouchTarget>
            </SidebarMenuLinkButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuLinkButton to="/pages">
                <TouchTarget>
                  <Squares2X2Icon className="size-8" />
                  <span>Pages</span>
                </TouchTarget>
              </SidebarMenuLinkButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuLinkButton to="/recently-inboxed">
                <TouchTarget>
                  <InboxIcon />
                  <span>Recently inboxed</span>
                </TouchTarget>
              </SidebarMenuLinkButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuLinkButton to="/recently-archived">
                <TouchTarget>
                  <ArchiveBoxIcon />
                  <span>Recently archived</span>
                </TouchTarget>
              </SidebarMenuLinkButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuLinkButton to="/recently-deleted">
                <TouchTarget>
                  <TrashIcon />
                  <span>Recently deleted</span>
                </TouchTarget>
              </SidebarMenuLinkButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarThemeSwitcher />
          <SidebarMenuItem>
            <SidebarMenuLinkButton to="/settings">
              <TouchTarget>
                <Cog6ToothIcon />
                <span>Settings</span>
              </TouchTarget>
            </SidebarMenuLinkButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
