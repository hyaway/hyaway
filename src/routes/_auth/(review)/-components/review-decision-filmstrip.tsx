// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useVirtualizer } from "@tanstack/react-virtual";

import type { FileMetadata } from "@/integrations/hydrus-api/models";

import { ThumbnailGalleryItemContent } from "@/components/thumbnail-gallery/thumbnail-gallery-item-content";
import { ThumbnailGalleryItemContextMenu } from "@/components/thumbnail-gallery/thumbnail-gallery-item-context-menu";
import { ThumbnailGalleryProvider } from "@/components/thumbnail-gallery/thumbnail-gallery-context";
import {
  ContextMenu,
  ContextMenuTrigger,
} from "@/components/ui-primitives/context-menu";
import { ScrollArea } from "@/components/ui-primitives/scroll-area";
import { Skeleton } from "@/components/ui-primitives/skeleton";
import { useInfiniteGetFilesMetadata } from "@/integrations/hydrus-api/queries/manage-files";
import { useThumbnailDimensions } from "@/integrations/hydrus-api/queries/options";
import {
  useGalleryEnableContextMenu,
  useGalleryEntryDuration,
  useGalleryHorizontalGap,
  useGalleryImageBackground,
} from "@/stores/gallery-settings-store";

/** Height of the polaroid-style footer strip in pixels (h-6 = 24px) */
const ITEM_FOOTER_HEIGHT = 24;

/** Min/max aspect ratio clamps to prevent extreme sizes */
const MIN_ASPECT_RATIO = 0.5;
const MAX_ASPECT_RATIO = 3;

/** Maximum height for filmstrip tiles */
const MAX_FILMSTRIP_HEIGHT = 250;

interface ReviewDecisionFilmstripProps {
  /** File IDs to display in this filmstrip */
  fileIds: Array<number>;
}

/**
 * Horizontally scrolling, virtualized filmstrip of thumbnail tiles.
 * Uses fixed height (from Hydrus thumbnail settings) with variable width based on aspect ratio.
 * Follows the same patterns as ThumbnailGallery for consistency.
 */
export function ReviewDecisionFilmstrip({
  fileIds,
}: ReviewDecisionFilmstripProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Get thumbnail dimensions from Hydrus service settings, capped at max height
  const dimensions = useThumbnailDimensions();
  const fixedHeight = Math.min(dimensions?.height ?? 200, MAX_FILMSTRIP_HEIGHT);
  const contentHeight = fixedHeight - ITEM_FOOTER_HEIGHT;

  // Gallery settings for consistent styling
  const horizontalGap = useGalleryHorizontalGap();
  const imageBackground = useGalleryImageBackground();
  const entryDuration = useGalleryEntryDuration();
  const enableContextMenu = useGalleryEnableContextMenu();

  // Track which item has an open context menu
  const [openMenuIndex, setOpenMenuIndex] = useState<number | null>(null);

  // Fetch metadata for the file IDs (same as ThumbnailGallery)
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteGetFilesMetadata(fileIds, false);

  // Flatten pages into items array (same pattern as ThumbnailGallery)
  const items = useMemo(
    () => (data ? data.pages.flatMap((d) => d.metadata) : []),
    [data],
  );

  // Defer items so old strip stays visible while new items load
  const deferredItems = useDeferredValue(items);

  // Build a lookup map from deferred items for O(1) access by fileId
  const itemsMap = useMemo(() => {
    const map = new Map<number, FileMetadata>();
    for (const item of deferredItems) {
      map.set(item.file_id, item);
    }
    return map;
  }, [deferredItems]);

  // Width cache - invalidates when contentHeight or gap changes (same pattern as gallery heightCache)
  const widthCache = useMemo(
    () => new Map<number, number>(),
    [contentHeight, horizontalGap],
  );

  const getItemWidth = (item: FileMetadata): number => {
    const cached = widthCache.get(item.file_id);
    if (cached !== undefined) return cached;

    const aspectRatio = Math.max(
      MIN_ASPECT_RATIO,
      Math.min(MAX_ASPECT_RATIO, item.width / item.height),
    );
    const width = Math.round(contentHeight * aspectRatio);
    widthCache.set(item.file_id, width);
    return width;
  };

  // Default width for items not yet loaded
  const defaultWidth = Math.round(contentHeight * 1);

  const virtualizer = useVirtualizer({
    horizontal: true,
    count: fileIds.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: (index) => {
      const fileId = fileIds[index];
      const item = itemsMap.get(fileId);
      return (item ? getItemWidth(item) : defaultWidth) + horizontalGap;
    },
    overscan: 3,
  });

  const virtualItems = virtualizer.getVirtualItems();
  const lastItemIndex = virtualItems.at(-1)?.index;

  // Guard against duplicate fetch calls (same pattern as ThumbnailGallery)
  const fetchingRef = useRef(false);
  useEffect(() => {
    fetchingRef.current = isFetchingNextPage;
  }, [isFetchingNextPage]);

  // Infinite scroll - fetch next page when near the end
  useEffect(() => {
    const FETCH_THRESHOLD = Math.min(deferredItems.length * 0.5, 32);
    if (lastItemIndex === undefined) return;
    if (fetchingRef.current) return;

    if (
      lastItemIndex >= deferredItems.length - FETCH_THRESHOLD &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchingRef.current = true;
      fetchNextPage();
    }
  }, [
    hasNextPage,
    fetchNextPage,
    deferredItems.length,
    lastItemIndex,
    isFetchingNextPage,
  ]);

  // Re-measure when items or dimensions change
  useEffect(() => {
    virtualizer.measure();
  }, [deferredItems, contentHeight, horizontalGap, virtualizer]);

  if (fileIds.length === 0) {
    return null;
  }

  return (
    <ThumbnailGalleryProvider infoMode="filesize">
      <div
        className="group/gallery"
        data-image-bg={imageBackground}
        style={
          {
            "--gallery-entry-duration": `${entryDuration}ms`,
          } as React.CSSProperties
        }
      >
        <ScrollArea
          viewportClassName="pb-4"
          orientation="horizontal"
          ref={scrollContainerRef}
        >
          <div
            className="relative"
            style={{
              width: `${virtualizer.getTotalSize()}px`,
              height: `${fixedHeight}px`,
            }}
          >
            {virtualItems.map((virtualItem) => {
              const fileId = fileIds[virtualItem.index];
              const item = itemsMap.get(fileId);
              const itemWidth = item ? getItemWidth(item) : defaultWidth;

              return (
                <div
                  key={virtualItem.key}
                  className="absolute top-0 left-0"
                  style={{
                    width: `${itemWidth}px`,
                    height: `${fixedHeight}px`,
                    transform: `translateX(${virtualItem.start}px)`,
                  }}
                >
                  {item ? (
                    <FilmstripItem
                      item={item}
                      fileId={fileId}
                      itemIndex={virtualItem.index}
                      enableContextMenu={enableContextMenu}
                      isMenuOpen={openMenuIndex === virtualItem.index}
                      onMenuOpenChange={(open) =>
                        setOpenMenuIndex(open ? virtualItem.index : null)
                      }
                    />
                  ) : (
                    <Skeleton className="h-full w-full rounded-sm" />
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    </ThumbnailGalleryProvider>
  );
}

// --- Filmstrip Item (with optional context menu) ---

interface FilmstripItemProps {
  item: FileMetadata;
  fileId: number;
  itemIndex: number;
  enableContextMenu: boolean;
  isMenuOpen: boolean;
  onMenuOpenChange: (open: boolean) => void;
}

function FilmstripItem({
  item,
  fileId,
  itemIndex,
  enableContextMenu,
  isMenuOpen,
  onMenuOpenChange,
}: FilmstripItemProps) {
  const linkContent = (
    <Link
      to="/file/$fileId"
      params={{ fileId: String(fileId) }}
      className="block h-full w-full"
    >
      <ThumbnailGalleryItemContent item={item} />
    </Link>
  );

  if (!enableContextMenu) {
    return linkContent;
  }

  return (
    <ContextMenu open={isMenuOpen} onOpenChange={onMenuOpenChange}>
      <ContextMenuTrigger className="h-full w-full">
        {linkContent}
      </ContextMenuTrigger>
      <ThumbnailGalleryItemContextMenu
        item={item}
        itemIndex={itemIndex}
        hideReviewActions
      />
    </ContextMenu>
  );
}
