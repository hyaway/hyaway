import { useMemo } from "react";

import { TagsSidebarSkeleton } from "./tags-sidebar-skeleton";
import { Skeleton } from "@/components/ui-primitives/skeleton";

/**
 * Skeleton component for the image grid while loading.
 * Uses CSS columns for responsive masonry layout with 200px item width.
 */
export function ImageGridSkeleton({ itemCount = 12 }: { itemCount?: number }) {
  // Generate random but stable heights for skeleton items
  const heights = useMemo(
    () =>
      Array.from({ length: itemCount }, (_, i) => {
        // Use index-based pseudo-random heights between 150-300px
        const seed = (i * 7 + 3) % 10;
        return 150 + seed * 15;
      }),
    [itemCount],
  );

  return (
    <div className="flex w-full flex-row">
      <div className="w-full columns-[200px] gap-2">
        {heights.map((height, i) => (
          <Skeleton
            key={i}
            className="mb-2 w-full break-inside-avoid rounded-lg"
            style={{ height: `${height}px` }}
          />
        ))}
      </div>
      <TagsSidebarSkeleton />
    </div>
  );
}
