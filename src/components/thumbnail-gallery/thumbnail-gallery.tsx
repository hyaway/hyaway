// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useWindowVirtualizer } from "@tanstack/react-virtual";
import React, {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { RightSidebarPortal } from "../app-shell/right-sidebar-portal";
import {
  ITEM_FOOTER_HEIGHT,
  ThumbnailGalleryItem,
} from "./thumbnail-gallery-item";
import { ThumbnailGallerySkeleton } from "./thumbnail-gallery-skeleton";
import type { FileLinkBuilder } from "./thumbnail-gallery-item";
import type { FileMetadata } from "@/integrations/hydrus-api/models";
import { ScrollPositionBadge } from "@/components/scroll-position-badge";
import { ThumbnailGalleryTagsSidebar } from "@/components/tag/thumbnail-gallery-tags-sidebar";
import { PageError } from "@/components/page-shell/page-error";
import { Spinner } from "@/components/ui-primitives/spinner";
import {
  useEffectiveGalleryBaseWidthMode,
  useThumbnailDimensions,
} from "@/integrations/hydrus-api/queries/options";
import { useInfiniteGetFilesMetadata } from "@/integrations/hydrus-api/queries/manage-files";
import { useMasonryNavigation } from "@/hooks/use-masonry-navigation";
import { useGalleryResponsiveLanes } from "@/hooks/use-responsive-lanes";
import {
  useElementScrollRestoration,
  useScrollRestoration,
} from "@/hooks/use-scroll-restoration";
import {
  useGalleryCustomBaseWidth,
  useGalleryEntryDuration,
  useGalleryHorizontalGap,
  useGalleryHoverZoomDuration,
  useGalleryImageBackground,
  useGalleryLinkImageBackground,
  useGalleryReflowDuration,
  useGalleryShowFooter,
  useGalleryShowScrollBadge,
  useGalleryVerticalGap,
} from "@/stores/gallery-settings-store";
import { useImageBackground as useFileViewerImageBackground } from "@/stores/file-viewer-settings-store";
import { useSidebarIsTransitioning } from "@/stores/sidebar-store";

export interface ThumbnailGalleryProps {
  fileIds: Array<number>;
  /** File IDs to hide visually while keeping the source metadata query unchanged. */
  hiddenFileIds?: Array<number>;
  /** Custom link builder for contextual navigation */
  getFileLink?: FileLinkBuilder;
  /**
   * When true, preserve the current window scroll on mount instead of
   * restoring a previously saved one.
   */
  preserveCurrentScroll?: boolean;
  /** Accessible label for the gallery */
  "aria-label"?: string;
}

export function ThumbnailGallery({
  fileIds,
  hiddenFileIds,
  getFileLink,
  preserveCurrentScroll,
  "aria-label": ariaLabel = "File gallery",
}: ThumbnailGalleryProps) {
  const itemsQuery = useInfiniteGetFilesMetadata(fileIds, false);
  const defaultDimensions = useThumbnailDimensions();

  if (fileIds.length === 0) {
    return <p>Page is empty.</p>;
  }

  if (itemsQuery.isPending) {
    return <ThumbnailGallerySkeleton />;
  }

  if (itemsQuery.isError) {
    return (
      <PageError
        error={itemsQuery.error}
        fallbackMessage="An unknown error occurred while fetching gallery"
      />
    );
  }

  if (itemsQuery.data.pages[0].metadata.length === 0) {
    return <p>No images loaded.</p>;
  }

  return (
    <PureThumbnailGallery
      itemsQuery={itemsQuery}
      hiddenFileIds={hiddenFileIds}
      totalItems={fileIds.length - (hiddenFileIds?.length ?? 0)}
      defaultDimensions={defaultDimensions}
      getFileLink={getFileLink}
      preserveCurrentScroll={preserveCurrentScroll}
      aria-label={ariaLabel}
    />
  );
}

export function PureThumbnailGallery({
  itemsQuery,
  hiddenFileIds,
  totalItems,
  defaultDimensions,
  getFileLink,
  preserveCurrentScroll,
  "aria-label": ariaLabel,
}: {
  itemsQuery: ReturnType<typeof useInfiniteGetFilesMetadata>;
  hiddenFileIds?: Array<number>;
  totalItems: number;
  defaultDimensions: { width: number; height: number };
  getFileLink?: FileLinkBuilder;
  preserveCurrentScroll?: boolean;
  "aria-label"?: string;
}) {
  const { data, isFetchingNextPage, fetchNextPage, hasNextPage } = itemsQuery;

  const hiddenFileIdSet = useMemo(
    () => (hiddenFileIds?.length ? new Set(hiddenFileIds) : null),
    [hiddenFileIds],
  );
  const { loadedItemsCount, visibleItems } = useMemo(() => {
    const loaded = data ? data.pages.flatMap((page) => page.metadata) : [];
    return {
      loadedItemsCount: loaded.length,
      visibleItems: hiddenFileIdSet
        ? loaded.filter((item) => !hiddenFileIdSet.has(item.file_id))
        : loaded,
    };
  }, [data, hiddenFileIdSet]);

  // Defer items so old grid stays visible while new items load
  const deferredItems = useDeferredValue(visibleItems);

  // Get layout settings - defer expensive ones for responsive slider UX
  const baseWidthMode = useEffectiveGalleryBaseWidthMode();
  const customBaseWidth = useGalleryCustomBaseWidth();
  const verticalGap = useGalleryVerticalGap();
  const horizontalGap = useGalleryHorizontalGap();
  const showFooter = useGalleryShowFooter();

  // Animation durations - set as CSS variables at root to avoid child re-renders
  const reflowDuration = useGalleryReflowDuration();
  const entryDuration = useGalleryEntryDuration();
  const hoverZoomDuration = useGalleryHoverZoomDuration();

  // Image background setting - use file viewer's when linked
  const galleryImageBackground = useGalleryImageBackground();
  const linkImageBackground = useGalleryLinkImageBackground();
  const fileViewerImageBackground = useFileViewerImageBackground();
  const imageBackground = linkImageBackground
    ? fileViewerImageBackground
    : galleryImageBackground;

  // Determine base width based on mode
  const baseWidth =
    baseWidthMode === "custom" ? customBaseWidth : defaultDimensions.width;

  // Defer layout-affecting values so sliders stay responsive
  const deferredBaseWidth = useDeferredValue(baseWidth);
  const deferredVerticalGap = useDeferredValue(verticalGap);
  const deferredHorizontalGap = useDeferredValue(horizontalGap);

  const parentRef = React.useRef<HTMLDivElement>(null);
  const { width, lanes } = useGalleryResponsiveLanes(
    parentRef,
    deferredBaseWidth,
    deferredItems.length,
    { horizontalGap: deferredHorizontalGap },
  );

  // Use lanes: 1 for virtualizer when measuring to avoid hook order issues
  const effectiveLanes = lanes || 1;
  const isMeasuring = lanes === 0;

  // Cache heights - invalidates when lanes or width changes
  // Both affect height calculation: lanes determines column count, width is used in aspect ratio calc
  const heightCache = useMemo(
    () => new Map<number, number>(),
    [effectiveLanes, width, showFooter],
  );

  const getItemHeight = (item: FileMetadata) => {
    const cached = heightCache.get(item.file_id);
    if (cached !== undefined) return cached;
    const aspectRatio = Math.max(Math.min(item.height / item.width, 2), 0.33);
    const footerHeight = showFooter ? ITEM_FOOTER_HEIGHT : 0;
    const height = Math.max(aspectRatio * width, 64) + footerHeight;
    heightCache.set(item.file_id, height);
    return height;
  };

  // Get scroll restoration data before creating virtualizer
  const scrollEntry = useElementScrollRestoration({
    getElement: () => window,
  });
  const restoredScrollY = preserveCurrentScroll
    ? undefined
    : scrollEntry?.scrollY;
  const virtualizerInitialOffset = preserveCurrentScroll
    ? () => (typeof document !== "undefined" ? window.scrollY : 0)
    : restoredScrollY;
  const getItemKey = useCallback(
    (index: number) => deferredItems[index].file_id,
    [deferredItems],
  );

  const rowVirtualizer = useWindowVirtualizer({
    count: deferredItems.length,
    getItemKey,
    estimateSize: (i) => {
      const item = deferredItems[i];
      return getItemHeight(item);
    },
    // Lower overscan to reduce concurrent thumbnail loads during fast scroll.
    // 2 rows of buffer is enough for smooth UX without flooding the network.
    overscan: 2 * (effectiveLanes || 1),
    gap: deferredVerticalGap,
    lanes: effectiveLanes,
    scrollMargin: parentRef.current?.offsetTop ?? 0,
    initialOffset: virtualizerInitialOffset,
  });

  const totalSize = rowVirtualizer.getTotalSize();

  // Handle scroll restoration - scrolls window when totalSize is ready
  useScrollRestoration(totalSize, restoredScrollY);

  // Cache virtual items to avoid calling getVirtualItems() multiple times
  const virtualItems = rowVirtualizer.getVirtualItems();
  const lastItemIndex = virtualItems.at(-1)?.index;

  // Guard against duplicate fetch calls before isFetchingNextPage updates
  const fetchingRef = useRef(false);
  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage || fetchingRef.current) return;

    const loadedButNothingVisible =
      totalItems > 0 && loadedItemsCount > 0 && visibleItems.length === 0;
    const fetchThreshold = Math.min(
      Math.max(deferredItems.length * 0.5, 1),
      256,
    );
    const isNearRenderedEnd =
      lastItemIndex !== undefined &&
      lastItemIndex >= deferredItems.length - fetchThreshold;

    if (!loadedButNothingVisible && !isNearRenderedEnd) {
      return;
    }

    fetchingRef.current = true;
    void fetchNextPage().finally(() => {
      fetchingRef.current = false;
    });
  }, [
    deferredItems.length,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    lastItemIndex,
    loadedItemsCount,
    totalItems,
    visibleItems.length,
  ]);

  // Re-measure when items or dimensions change
  useEffect(() => {
    rowVirtualizer.measure();
  }, [
    deferredItems,
    width,
    lanes,
    deferredVerticalGap,
    showFooter,
    rowVirtualizer,
  ]);

  const showScrollBadge = useGalleryShowScrollBadge();

  const { setLinkRef, handleKeyDown, handleItemFocus, getTabIndex } =
    useMasonryNavigation({
      lanes: effectiveLanes,
      totalItems: deferredItems.length,
      getVirtualItems: rowVirtualizer.getVirtualItems.bind(rowVirtualizer),
      scrollToIndex: rowVirtualizer.scrollToIndex.bind(rowVirtualizer),
    });

  const visibleIndices = useMemo(
    () => virtualItems.map((v) => v.index),
    [virtualItems],
  );

  // Lock width during sidebar transitions to prevent resize jitter
  const isTransitioning = useSidebarIsTransitioning();
  const lockedWidthRef = useRef<number | null>(null);

  // Capture width when transition starts, clear when it ends
  if (isTransitioning && lockedWidthRef.current === null && parentRef.current) {
    lockedWidthRef.current = parentRef.current.clientWidth;
  } else if (!isTransitioning) {
    lockedWidthRef.current = null;
  }

  const containerStyle = lockedWidthRef.current
    ? { width: `${lockedWidthRef.current}px` }
    : undefined;

  // CSS custom properties for animation durations - avoids re-renders of all items
  const galleryStyle = useMemo(
    () => ({
      ...containerStyle,
      "--gallery-reflow-duration": `${reflowDuration}ms`,
      "--gallery-entry-duration": `${entryDuration}ms`,
      "--gallery-hover-zoom-duration": `${hoverZoomDuration}ms`,
    }),
    [containerStyle, reflowDuration, entryDuration, hoverZoomDuration],
  ) as React.CSSProperties;

  return (
    <div
      className="group/gallery w-full"
      ref={parentRef}
      style={galleryStyle}
      data-image-bg={imageBackground}
    >
      {isMeasuring ? (
        <ThumbnailGallerySkeleton />
      ) : (
        <>
          <ul
            role="grid"
            aria-label={ariaLabel}
            onKeyDown={handleKeyDown}
            data-scrolling={rowVirtualizer.isScrolling}
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
            }}
            className="@container relative w-full"
          >
            {virtualItems.map((virtualRow) => {
              const item = deferredItems[virtualRow.index];
              const itemHeight = getItemHeight(item);

              return (
                <ThumbnailGalleryItem
                  key={virtualRow.key}
                  virtualRow={virtualRow}
                  lanes={effectiveLanes}
                  totalItemsCount={deferredItems.length}
                  item={item}
                  width={width}
                  height={itemHeight}
                  scrollMargin={rowVirtualizer.options.scrollMargin}
                  tabIndex={getTabIndex(virtualRow.index, visibleIndices)}
                  setLinkRef={setLinkRef}
                  onItemFocus={handleItemFocus}
                  getFileLink={getFileLink}
                />
              );
            })}
          </ul>
          <ScrollPositionBadge
            current={lastItemIndex === undefined ? 0 : lastItemIndex + 1}
            loaded={deferredItems.length}
            total={totalItems}
            isScrolling={rowVirtualizer.isScrolling}
            show={showScrollBadge}
          />
          {isFetchingNextPage && (
            <div className="flex justify-center py-4">
              <Spinner className="text-muted-foreground size-5" />
            </div>
          )}
          <RightSidebarPortal>
            <ThumbnailGalleryTagsSidebar items={deferredItems} />
          </RightSidebarPortal>
        </>
      )}
    </div>
  );
}
