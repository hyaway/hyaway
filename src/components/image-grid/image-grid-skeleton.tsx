import { useMemo } from "react";

import { TagsSidebarSkeleton } from "@/components/tag/tags-sidebar-skeleton";
import { Skeleton } from "@/components/ui-primitives/skeleton";
import { useThumbnailDimensions } from "@/integrations/hydrus-api/queries/options";

/**
 * Skeleton component for the image grid while loading.
 * Uses CSS columns for responsive masonry layout with 200px item width.
 */
export function ImageGridSkeleton({ itemCount = 12 }: { itemCount?: number }) {
  const dimensions = useThumbnailDimensions() || { width: 200, height: 200 };
  // Generate random but stable heights for skeleton items
  const heights = useMemo(
    () =>
      Array.from({ length: itemCount }, (_, i) => {
        // Use index-based pseudo-random heights between 150-300px
        const seed = (i * 7 + 3) % 10;
        return dimensions.height / 2 + seed * 15;
      }),
    [itemCount],
  );

  return (
    <div className="flex w-full flex-row">
      <div
        className="w-full columns-(--thumbnail-width) gap-2"
        style={
          {
            "--thumbnail-width": `${dimensions.width}px`,
          } as React.CSSProperties
        }
      >
        {heights.map((height, i) => (
          <Skeleton
            key={i}
            className="mb-2 w-full break-inside-avoid"
            style={{ height: `${height}px` }}
          />
        ))}
      </div>
      <TagsSidebarSkeleton />
    </div>
  );
}
