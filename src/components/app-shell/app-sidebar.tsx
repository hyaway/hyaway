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
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground cursor-pointer"
              to="/"
            >
              <TouchTarget>
                <div className="border-sidebar-primary flex aspect-square size-9 items-center justify-center rounded-lg border">
                  <span className="size-5">hA</span>
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
              <SidebarMenuLinkButton
                to="/pages"
                className="cursor-pointer"
                tooltip={"Pages"}
              >
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
                tooltip={"Recently inboxed"}
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
                tooltip={"Recently archived"}
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
                tooltip={"Recently deleted"}
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
                tooltip={"Random inbox"}
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
            <SidebarMenuLinkButton
              to="/settings"
              className="cursor-pointer"
              tooltip={"Settings"}
            >
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
