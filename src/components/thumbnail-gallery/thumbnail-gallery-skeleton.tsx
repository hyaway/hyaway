// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useEffect, useMemo, useState } from "react";

import { RightSidebarPortal } from "../app-shell/right-sidebar-portal";
import { TagsSidebarSkeleton } from "@/components/tag/tags-sidebar-skeleton";
import { Skeleton } from "@/components/ui-primitives/skeleton";
import { formatDuration } from "@/lib/format-utils";
import { DEFAULT_THUMBNAIL_SIZE } from "@/stores/gallery-settings-store";

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

  const [showMessage, setShowMessage] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    const startedAt = Date.now();
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setShowMessage(true), 10000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex w-full flex-col">
      {showMessage && (
        <p className="text-muted-foreground mb-4 text-sm">
          Still loading… Large searches can take a while.{" "}
          <span className="tabular-nums">
            Waited for: {formatDuration(elapsedSeconds * 1000)}
          </span>
        </p>
      )}
      <div className="flex w-full flex-row">
        <div
          className="w-full columns-(--thumbnail-width) gap-2"
          style={{
            "--thumbnail-width": `${DEFAULT_THUMBNAIL_SIZE}px`,
          }}
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
    </div>
  );
}
