"use client";

import * as React from "react";

import {
  IconArchive,
  IconArchiveFilled,
  IconArrowsShuffle,
  IconArrowsShuffle2,
  IconCalendarStats,
  IconCards,
  IconCardsFilled,
  IconChartArea,
  IconChartAreaFilled,
  IconClock,
  IconClockFilled,
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
import { usePermissions } from "@/integrations/hydrus-api/queries/permissions";
import { PERMISSION_LABELS } from "@/integrations/hydrus-api/permissions";
import { Permission } from "@/integrations/hydrus-api/models";
import { Heading } from "@/components/ui-primitives/heading";
import { TouchTarget } from "@/components/ui-primitives/touch-target";
import {
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuItem,
  SidebarMenuLinkButton,
  SidebarRail,
} from "@/components/ui-primitives/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui-primitives/tooltip";
import { useReviewQueueRemaining } from "@/stores/review-queue-store";
import { cn } from "@/lib/utils";

/** Icon pair component that shows outline icon normally, filled when parent has data-active */
function SidebarIcon({
  icon: Icon,
  filledIcon: FilledIcon,
  className,
}: {
  icon: React.ComponentType<{ className?: string; stroke?: number }>;
  filledIcon: React.ComponentType<{ className?: string; stroke?: number }>;
  className?: string;
}) {
  return (
    <>
      <Icon
        className={cn(className, "group-data-active/menu-button:hidden")}
        stroke={Icon === FilledIcon ? 1.5 : undefined}
      />
      <FilledIcon
        className={cn(className, "hidden group-data-active/menu-button:block")}
        stroke={Icon === FilledIcon ? 2.25 : undefined}
      />
    </>
  );
}

/** Wrapper that computes muted variant based on permissions */
interface SidebarNavLinkProps {
  /** Permissions required to access this route - link is muted if any are missing */
  requiredPermissions?: Array<Permission>;
  /** Whether permissions have been fetched */
  permissionsFetched: boolean;
  /** Function to check if a permission is granted */
  hasPermission: (permission: Permission) => boolean;
  /** Render function that receives the computed variant */
  children: (variant: "default" | "muted") => React.ReactElement;
}

function SidebarNavLink({
  requiredPermissions = [],
  permissionsFetched,
  hasPermission,
  children,
}: SidebarNavLinkProps) {
  const missingPermissions = requiredPermissions.filter(
    (p) => !hasPermission(p),
  );
  const isMuted = permissionsFetched && missingPermissions.length > 0;
  const variant = isMuted ? "muted" : "default";

  const content = children(variant);

  if (isMuted) {
    const tooltipText = missingPermissions
      .map((p) => PERMISSION_LABELS[p])
      .join(", ");

    return (
      <Tooltip>
        <TooltipTrigger render={content} />
        <TooltipContent side="right">Missing: {tooltipText}</TooltipContent>
      </Tooltip>
    );
  }

  return content;
}

/** Review queue nav item with badge showing remaining items */
function ReviewQueueNavItem({
  permissionsFetched,
  hasPermission,
}: Omit<SidebarNavLinkProps, "children" | "requiredPermissions">) {
  const remaining = useReviewQueueRemaining();

  return (
    <SidebarMenuItem>
      <SidebarNavLink
        requiredPermissions={[Permission.IMPORT_AND_DELETE_FILES]}
        permissionsFetched={permissionsFetched}
        hasPermission={hasPermission}
      >
        {(variant) => (
          <SidebarMenuLinkButton to="/review" variant={variant}>
            <TouchTarget>
              <SidebarIcon icon={IconCards} filledIcon={IconCardsFilled} />
              <span>Review queue</span>
            </TouchTarget>
            {remaining > 0 && (
              <SidebarMenuBadge className="bg-primary text-primary-foreground">
                {remaining > 999 ? "999+" : remaining}
              </SidebarMenuBadge>
            )}
          </SidebarMenuLinkButton>
        )}
      </SidebarNavLink>
    </SidebarMenuItem>
  );
}

export function AppSidebar() {
  const { hasPermission, isFetched } = usePermissions();

  // Common props for all nav links
  const navLinkProps = {
    permissionsFetched: isFetched,
    hasPermission,
  };

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
                    HyAway
                  </Heading>
                </div>
              </TouchTarget>
            </SidebarMenuLinkButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Browse</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarNavLink
                requiredPermissions={[
                  Permission.SEARCH_FOR_AND_FETCH_FILES,
                  Permission.MANAGE_PAGES,
                ]}
                {...navLinkProps}
              >
                {(variant) => (
                  <SidebarMenuLinkButton to="/pages" variant={variant}>
                    <TouchTarget>
                      <SidebarIcon
                        icon={IconLayoutGrid}
                        filledIcon={IconLayoutGridFilled}
                        className="size-8"
                      />
                      <span>Pages</span>
                    </TouchTarget>
                  </SidebarMenuLinkButton>
                )}
              </SidebarNavLink>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarNavLink
                requiredPermissions={[Permission.SEARCH_FOR_AND_FETCH_FILES]}
                {...navLinkProps}
              >
                {(variant) => (
                  <SidebarMenuLinkButton to="/random-inbox" variant={variant}>
                    <TouchTarget>
                      <SidebarIcon
                        icon={IconArrowsShuffle}
                        filledIcon={IconArrowsShuffle2}
                      />
                      <span>Random inbox</span>
                    </TouchTarget>
                  </SidebarMenuLinkButton>
                )}
              </SidebarNavLink>
            </SidebarMenuItem>
            <ReviewQueueNavItem {...navLinkProps} />
          </SidebarMenu>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Recent Activity</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarNavLink
                requiredPermissions={[Permission.SEARCH_FOR_AND_FETCH_FILES]}
                {...navLinkProps}
              >
                {(variant) => (
                  <SidebarMenuLinkButton
                    to="/recently-inboxed"
                    variant={variant}
                  >
                    <TouchTarget>
                      <SidebarIcon
                        icon={IconMail}
                        filledIcon={IconMailFilled}
                      />
                      <span>Recently inboxed</span>
                    </TouchTarget>
                  </SidebarMenuLinkButton>
                )}
              </SidebarNavLink>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarNavLink
                requiredPermissions={[Permission.SEARCH_FOR_AND_FETCH_FILES]}
                {...navLinkProps}
              >
                {(variant) => (
                  <SidebarMenuLinkButton
                    to="/recently-archived"
                    variant={variant}
                  >
                    <TouchTarget>
                      <SidebarIcon
                        icon={IconArchive}
                        filledIcon={IconArchiveFilled}
                      />
                      <span>Recently archived</span>
                    </TouchTarget>
                  </SidebarMenuLinkButton>
                )}
              </SidebarNavLink>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarNavLink
                requiredPermissions={[Permission.SEARCH_FOR_AND_FETCH_FILES]}
                {...navLinkProps}
              >
                {(variant) => (
                  <SidebarMenuLinkButton
                    to="/recently-trashed"
                    variant={variant}
                  >
                    <TouchTarget>
                      <SidebarIcon
                        icon={IconTrash}
                        filledIcon={IconTrashFilled}
                      />
                      <span>Recently trashed</span>
                    </TouchTarget>
                  </SidebarMenuLinkButton>
                )}
              </SidebarNavLink>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Statistics</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarNavLink
                requiredPermissions={[Permission.SEARCH_FOR_AND_FETCH_FILES]}
                {...navLinkProps}
              >
                {(variant) => (
                  <SidebarMenuLinkButton to="/history" variant={variant}>
                    <TouchTarget>
                      <SidebarIcon icon={IconEye} filledIcon={IconEyeFilled} />
                      <span>Watch history</span>
                    </TouchTarget>
                  </SidebarMenuLinkButton>
                )}
              </SidebarNavLink>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarNavLink
                requiredPermissions={[Permission.SEARCH_FOR_AND_FETCH_FILES]}
                {...navLinkProps}
              >
                {(variant) => (
                  <SidebarMenuLinkButton to="/remote-history" variant={variant}>
                    <TouchTarget>
                      <SidebarIcon
                        icon={IconCalendarStats}
                        filledIcon={IconCalendarStats}
                      />
                      <span>Remote history</span>
                    </TouchTarget>
                  </SidebarMenuLinkButton>
                )}
              </SidebarNavLink>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarNavLink
                requiredPermissions={[Permission.SEARCH_FOR_AND_FETCH_FILES]}
                {...navLinkProps}
              >
                {(variant) => (
                  <SidebarMenuLinkButton to="/most-viewed" variant={variant}>
                    <TouchTarget>
                      <SidebarIcon
                        icon={IconChartArea}
                        filledIcon={IconChartAreaFilled}
                      />
                      <span>Most viewed</span>
                    </TouchTarget>
                  </SidebarMenuLinkButton>
                )}
              </SidebarNavLink>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarNavLink
                requiredPermissions={[Permission.SEARCH_FOR_AND_FETCH_FILES]}
                {...navLinkProps}
              >
                {(variant) => (
                  <SidebarMenuLinkButton to="/longest-viewed" variant={variant}>
                    <TouchTarget>
                      <SidebarIcon
                        icon={IconClock}
                        filledIcon={IconClockFilled}
                      />
                      <span>Longest viewed</span>
                    </TouchTarget>
                  </SidebarMenuLinkButton>
                )}
              </SidebarNavLink>
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
