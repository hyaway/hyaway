"use client";

import * as React from "react";

import {
  ArchiveBoxIcon,
  Cog6ToothIcon,
  InboxIcon,
  Squares2X2Icon,
  TrashIcon,
} from "@heroicons/react/24/solid";
import { DiceIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { SidebarThemeSwitcher } from "./theme-switcher";
import { Heading } from "@/components/ui-primitives/heading";
import { TouchTarget } from "@/components/ui-primitives/touch-target";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
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
              className="group/logo cursor-pointer"
              to="/"
            >
              <TouchTarget>
                <div className="border-sidebar-primary text-foreground bg-background group-data-active/logo:bg-sidebar-primary group-data-active/logo:text-sidebar-primary-foreground group-hover/logo:bg-sidebar-primary group-hover/logo:text-sidebar-primary-foreground flex aspect-square size-9 items-end justify-center border-2">
                  <span className="text-base font-semibold">hA</span>
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <Heading className="truncate font-medium" level={2}>
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
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuLinkButton to="/pages" className="cursor-pointer">
                <TouchTarget>
                  <Squares2X2Icon className="size-8" />
                  <span>Pages</span>
                </TouchTarget>
              </SidebarMenuLinkButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Recent files</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuLinkButton
                to="/recently-inboxed"
                className="cursor-pointer"
              >
                <TouchTarget>
                  <InboxIcon />
                  <span>Recently inboxed</span>
                </TouchTarget>
              </SidebarMenuLinkButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuLinkButton
                to="/recently-archived"
                className="cursor-pointer"
              >
                <TouchTarget>
                  <ArchiveBoxIcon />
                  <span>Recently archived</span>
                </TouchTarget>
              </SidebarMenuLinkButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuLinkButton
                to="/recently-deleted"
                className="cursor-pointer"
              >
                <TouchTarget>
                  <TrashIcon />
                  <span>Recently deleted</span>
                </TouchTarget>
              </SidebarMenuLinkButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Other</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuLinkButton
                to="/random-inbox"
                className="cursor-pointer"
              >
                <TouchTarget>
                  <HugeiconsIcon icon={DiceIcon} />
                  <span>Random inbox</span>
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
            <SidebarMenuLinkButton to="/settings" className="cursor-pointer">
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
