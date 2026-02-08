// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
import { cn } from "@/lib/utils";
import {
  useGalleryEnableContextMenu,
  useGalleryEntryDuration,
  useGalleryHorizontalGap,
  useGalleryHoverZoomDuration,
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
  const hoverZoomDuration = useGalleryHoverZoomDuration();
  const enableContextMenu = useGalleryEnableContextMenu();

  // Track which item has an open context menu
  const [openMenuIndex, setOpenMenuIndex] = useState<number | null>(null);

  // Roving tabindex: only one item is tabbable at a time
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const linkRefs = useRef<Map<number, HTMLAnchorElement>>(new Map());
  const pendingFocusRef = useRef<number | null>(null);

  const setLinkRef = useCallback(
    (el: HTMLAnchorElement | null, index: number) => {
      if (el) {
        linkRefs.current.set(index, el);
        if (pendingFocusRef.current === index) {
          pendingFocusRef.current = null;
          el.focus({ preventScroll: true });
        }
      } else {
        linkRefs.current.delete(index);
      }
    },
    [],
  );

  const getTabIndex = (index: number): number => {
    const target = focusedIndex ?? 0;
    const visibleIndices = virtualizer.getVirtualItems().map((v) => v.index);
    if (visibleIndices.includes(target)) {
      return index === target ? 0 : -1;
    }
    const firstVisible = Math.min(...visibleIndices);
    return index === firstVisible ? 0 : -1;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const currentIndex = focusedIndex ?? 0;
    let nextIndex: number | null = null;

    switch (e.key) {
      case "ArrowRight":
        if (currentIndex < fileIds.length - 1) nextIndex = currentIndex + 1;
        break;
      case "ArrowLeft":
        if (currentIndex > 0) nextIndex = currentIndex - 1;
        break;
      case "Home":
        nextIndex = 0;
        break;
      case "End":
        nextIndex = fileIds.length - 1;
        break;
      default:
        return;
    }

    if (nextIndex !== null && nextIndex !== currentIndex) {
      e.preventDefault();
      setFocusedIndex(nextIndex);

      const nextEl = linkRefs.current.get(nextIndex);
      if (nextEl) {
        nextEl.focus({ preventScroll: true });
        nextEl.scrollIntoView({
          behavior: e.repeat ? "instant" : "smooth",
          block: "nearest",
          inline: "nearest",
        });
      } else {
        pendingFocusRef.current = nextIndex;
        virtualizer.scrollToIndex(nextIndex, {
          align: "auto",
          behavior: e.repeat ? "auto" : "smooth",
        });
      }
    }
  };

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

  // Redirect vertical wheel events to horizontal scroll (pointer devices only)
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      // Only redirect vertical scroll when there's horizontal overflow
      if (el.scrollWidth <= el.clientWidth) return;
      if (e.deltaY === 0) return;

      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, []);

  if (fileIds.length === 0) {
    return null;
  }

  return (
    <ThumbnailGalleryProvider infoMode="filesize">
      <div
        className="group/gallery"
        data-image-bg={imageBackground}
        onKeyDown={handleKeyDown}
        style={
          {
            "--gallery-entry-duration": `${entryDuration}ms`,
            "--gallery-hover-zoom-duration": `${hoverZoomDuration}ms`,
          } as React.CSSProperties
        }
      >
        <ScrollArea
          viewportClassName="scroll-p-2 p-2 pb-5"
          orientation="horizontal"
          ref={scrollContainerRef}
          tabIndex={-1}
        >
          <div
            className="relative mx-auto"
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
                      tabIndex={getTabIndex(virtualItem.index)}
                      setLinkRef={setLinkRef}
                      onItemFocus={setFocusedIndex}
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
  tabIndex: number;
  setLinkRef: (el: HTMLAnchorElement | null, index: number) => void;
  onItemFocus: (index: number) => void;
  enableContextMenu: boolean;
  isMenuOpen: boolean;
  onMenuOpenChange: (open: boolean) => void;
}

function FilmstripItem({
  item,
  fileId,
  itemIndex,
  tabIndex,
  setLinkRef,
  onItemFocus,
  enableContextMenu,
  isMenuOpen,
  onMenuOpenChange,
}: FilmstripItemProps) {
  const linkElement = (
    <Link
      to="/file/$fileId"
      params={{ fileId: String(fileId) }}
      className="absolute inset-0 z-10 outline-hidden"
      tabIndex={tabIndex}
      ref={(el) => setLinkRef(el, itemIndex)}
      onFocus={() => onItemFocus(itemIndex)}
      aria-label={`File ${fileId}`}
    />
  );

  const wrappedLink = enableContextMenu ? (
    <ContextMenu open={isMenuOpen} onOpenChange={onMenuOpenChange}>
      <ContextMenuTrigger>{linkElement}</ContextMenuTrigger>
      <ThumbnailGalleryItemContextMenu
        item={item}
        itemIndex={itemIndex}
        hideReviewActions
      />
    </ContextMenu>
  ) : (
    linkElement
  );

  return (
    <div className="group relative h-full w-full">
      {wrappedLink}
      <div
        className={cn(
          "pointer-events-none h-full w-full",
          "[&_img]:transition-transform [&_img]:duration-(--gallery-hover-zoom-duration) [&_img]:ease-out",
          "group-hover:[&_img]:scale-105",
          "group-has-focus-visible:ring-3 group-has-focus-visible:ring-black group-has-focus-visible:ring-offset-3 group-has-focus-visible:ring-offset-white dark:group-has-focus-visible:ring-white dark:group-has-focus-visible:ring-offset-black",
          enableContextMenu &&
            isMenuOpen &&
            "ring-primary-foreground ring-offset-primary ring-0 ring-offset-3",
        )}
      >
        <ThumbnailGalleryItemContent item={item} imageLoading="eager" />
      </div>
    </div>
  );
}
