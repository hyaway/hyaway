import { useMemo } from "react";

import { RightSidebarPortal } from "../app-shell/right-sidebar-portal";
import { TagsSidebarSkeleton } from "@/components/tag/tags-sidebar-skeleton";
import { Skeleton } from "@/components/ui-primitives/skeleton";
import { DEFAULT_THUMBNAIL_SIZE } from "@/lib/stores/gallery-settings-store";

/**
 * Skeleton component for the thumbnail gallery while loading.
 * Uses CSS columns for responsive masonry layout with 200px item width.
 */
export function ThumbnailGallerySkeleton({
  itemCount = 12,
}: {
  itemCount?: number;
}) {
  // Generate random but stable heights for skeleton items
  const heights = useMemo(
    () =>
      Array.from({ length: itemCount }, (_, i) => {
        // Use index-based pseudo-random heights between 150-300px
        const seed = (i * 7 + 3) % 10;
        return DEFAULT_THUMBNAIL_SIZE / 2 + seed * 15;
      }),
    [itemCount],
  );

  return (
    <div className="flex w-full flex-row">
      <div
        className="w-full columns-(--thumbnail-width) gap-2"
        style={
          {
            "--thumbnail-width": `${DEFAULT_THUMBNAIL_SIZE}px`,
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
      <RightSidebarPortal>
        <TagsSidebarSkeleton />
      </RightSidebarPortal>
    </div>
  );
}
