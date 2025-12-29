import { useMemo } from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
} from "@/components/ui-primitives/sidebar";
import { RightSidebarPortal } from "@/components/app-shell/right-sidebar-portal";
import { Heading } from "@/components/ui-primitives/heading";
import { Skeleton } from "@/components/ui-primitives/skeleton";

/**
 * Skeleton component for the tags sidebar while loading.
 */
export function TagsSidebarSkeleton({ tagCount = 20 }: { tagCount?: number }) {
  // Generate random but stable widths for skeleton tags
  const widths = useMemo(
    () =>
      Array.from({ length: tagCount }, (_, i) => {
        // Use index-based pseudo-random widths between 40-90%
        const seed = (i * 13 + 5) % 10;
        return 40 + seed * 5;
      }),
    [tagCount],
  );

  return (
    <RightSidebarPortal>
      <Sidebar
        side="right"
        collapsible="none"
        className="sticky top-0 h-svh border-l"
      >
        <SidebarHeader>
          <Heading level={3} className="text-lg font-semibold">
            Tags
          </Heading>
        </SidebarHeader>
        <SidebarContent className="p-1 pe-3">
          <SidebarGroup className="gap-2">
            <Skeleton className="mb-2 h-8 w-full" />
            {widths.map((width, i) => (
              <div key={i} className="flex items-center gap-1">
                <Skeleton className="size-8 shrink-0" />
                <Skeleton
                  className="h-8 rounded-4xl"
                  style={{ width: `${width}%` }}
                />
              </div>
            ))}
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <Skeleton className="h-16 w-full" />
        </SidebarFooter>
      </Sidebar>
    </RightSidebarPortal>
  );
}
