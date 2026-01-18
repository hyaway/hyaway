// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useMemo } from "react";

import {
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
} from "@/components/ui-primitives/sidebar";
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
    <>
      <SidebarHeader className="gap-4">
        <Heading level={3} className="text-lg font-semibold">
          Tags
        </Heading>
        {/* Search input skeleton */}
        <Skeleton className="h-8 w-full" />
        {/* Toggle group skeleton */}
        <div className="flex w-full gap-1">
          <Skeleton className="h-8 flex-1" />
          <Skeleton className="h-8 flex-1" />
        </div>
      </SidebarHeader>
      <SidebarContent className="min-h-0 flex-1 pe-1">
        <SidebarGroup className="gap-1.5 pe-2.5">
          {widths.map((width, i) => (
            <Skeleton
              key={i}
              className="h-6 rounded-sm"
              style={{ width: `${width}%` }}
            />
          ))}
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <Skeleton className="h-5 w-3/4" />
      </SidebarFooter>
    </>
  );
}
