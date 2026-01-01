"use client";

import * as React from "react";

import {
  IconArchive,
  IconArchiveFilled,
  IconArrowsShuffle,
  IconArrowsShuffle2,
  IconEye,
  IconEyeFilled,
  IconLayoutGrid,
  IconLayoutGridFilled,
  IconMail,
  IconMailFilled,
  IconSettings,
  IconSettingsFilled,
  IconTrash,
  IconTrashFilled,
} from "@tabler/icons-react";
import { SidebarThemeSwitcher } from "./theme-switcher";
import { Heading } from "@/components/ui-primitives/heading";
import { TouchTarget } from "@/components/ui-primitives/touch-target";
import {
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
import { cn } from "@/lib/utils";

/** Icon pair component that shows outline icon normally, filled when parent has data-active */
function SidebarIcon({
  icon: Icon,
  filledIcon: FilledIcon,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  filledIcon: React.ComponentType<{ className?: string }>;
  className?: string;
}) {
  return (
    <>
      <Icon className={cn(className, "group-data-active/menu-button:hidden")} />
      <FilledIcon
        className={cn(className, "hidden group-data-active/menu-button:block")}
      />
    </>
  );
}

export function AppSidebar() {
  return (
    <>
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
                  <SidebarIcon
                    icon={IconLayoutGrid}
                    filledIcon={IconLayoutGridFilled}
                    className="size-8"
                  />
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
                  <SidebarIcon icon={IconMail} filledIcon={IconMailFilled} />
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
                  <SidebarIcon
                    icon={IconArchive}
                    filledIcon={IconArchiveFilled}
                  />
                  <span>Recently archived</span>
                </TouchTarget>
              </SidebarMenuLinkButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuLinkButton
                to="/recently-trashed"
                className="cursor-pointer"
              >
                <TouchTarget>
                  <SidebarIcon icon={IconTrash} filledIcon={IconTrashFilled} />
                  <span>Recently trashed</span>
                </TouchTarget>
              </SidebarMenuLinkButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Other</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuLinkButton to="/history" className="cursor-pointer">
                <TouchTarget>
                  <SidebarIcon icon={IconEye} filledIcon={IconEyeFilled} />
                  <span>Watch history</span>
                </TouchTarget>
              </SidebarMenuLinkButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuLinkButton
                to="/random-inbox"
                className="cursor-pointer"
              >
                <TouchTarget>
                  <SidebarIcon
                    icon={IconArrowsShuffle}
                    filledIcon={IconArrowsShuffle2}
                  />
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
                <SidebarIcon
                  icon={IconSettings}
                  filledIcon={IconSettingsFilled}
                />
                <span>Settings</span>
              </TouchTarget>
            </SidebarMenuLinkButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </>
  );
}
