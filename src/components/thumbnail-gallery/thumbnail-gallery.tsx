import { useWindowVirtualizer } from "@tanstack/react-virtual";
import React, { useDeferredValue, useEffect, useMemo } from "react";
import { RightSidebarPortal } from "../app-shell/right-sidebar-portal";
import {
  ITEM_FOOTER_HEIGHT,
  ThumbnailGalleryItem,
} from "./thumbnail-gallery-item";
import { ThumbnailGallerySkeleton } from "./thumbnail-gallery-skeleton";
import type { FileLinkBuilder } from "./thumbnail-gallery-item";
import type { FileMetadata } from "@/integrations/hydrus-api/models";
import { ScrollPositionBadge } from "@/components/scroll-position-badge";
import { TagsSidebar } from "@/components/tag/tags-sidebar";
import { PageError } from "@/components/page-shell/page-error";
import { useThumbnailDimensions } from "@/integrations/hydrus-api/queries/options";
import { useInfiniteGetFilesMetadata } from "@/integrations/hydrus-api/queries/manage-files";
import { useMasonryNavigation } from "@/hooks/use-masonry-navigation";
import { useGalleryResponsiveLanes } from "@/hooks/use-responsive-lanes";
import { useScrollRestoration } from "@/hooks/use-scroll-restoration";
import {
  GALLERY_HORIZONTAL_GAP_SIZE,
  GALLERY_VERTICAL_GAP_SIZE,
  useGalleryExpandImages,
  useGalleryMaxLanes,
  useGalleryShowScrollBadge,
} from "@/lib/settings-store";

export interface ThumbnailGalleryProps {
  fileIds: Array<number>;
  /** Custom link builder for contextual navigation */
  getFileLink?: FileLinkBuilder;
  /** Accessible label for the gallery */
  "aria-label"?: string;
}

export function ThumbnailGallery({
  fileIds,
  getFileLink,
  "aria-label": ariaLabel = "File gallery",
}: ThumbnailGalleryProps) {
  const itemsQuery = useInfiniteGetFilesMetadata(fileIds, false);
  const defaultDimensions = useThumbnailDimensions();

  if (fileIds.length === 0) {
    return <p>Page is empty.</p>;
  }

  if (!defaultDimensions || itemsQuery.isPending) {
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
      totalItems={fileIds.length}
      defaultDimensions={defaultDimensions}
      getFileLink={getFileLink}
      aria-label={ariaLabel}
    />
  );
}

export function PureThumbnailGallery({
  itemsQuery,
  totalItems,
  defaultDimensions,
  getFileLink,
  "aria-label": ariaLabel,
}: {
  itemsQuery: ReturnType<typeof useInfiniteGetFilesMetadata>;
  totalItems: number;
  defaultDimensions: { width: number; height: number };
  getFileLink?: FileLinkBuilder;
  "aria-label"?: string;
}) {
  const { data, isFetchingNextPage, fetchNextPage, hasNextPage } = itemsQuery;

  const items = useMemo(
    () => (data ? data.pages.flatMap((d) => d.metadata) : []),
    [data],
  );

  // Defer items so old grid stays visible while new items load
  const deferredItems = useDeferredValue(items);

  const parentRef = React.useRef<HTMLDivElement>(null);
  const { width, lanes } = useGalleryResponsiveLanes(
    parentRef,
    defaultDimensions.width,
    deferredItems.length,
  );

  // Cache heights - invalidates when width changes
  const heightCache = useMemo(() => new Map<number, number>(), [width]);

  const getItemHeight = (item: FileMetadata) => {
    const cached = heightCache.get(item.file_id);
    if (cached !== undefined) return cached;
    const aspectRatio = Math.max(Math.min(item.height / item.width, 2), 0.33);
    const height = Math.max(aspectRatio * width, 64) + ITEM_FOOTER_HEIGHT;
    heightCache.set(item.file_id, height);
    return height;
  };

  const rowVirtualizer = useWindowVirtualizer({
    count: deferredItems.length,
    estimateSize: (i) => {
      const item = deferredItems[i];
      return getItemHeight(item);
    },
    overscan: 4,
    gap: GALLERY_VERTICAL_GAP_SIZE,
    lanes,
    scrollMargin: parentRef.current?.offsetTop ?? 0,
  });

  const totalSize = rowVirtualizer.getTotalSize();
  useScrollRestoration(totalSize);

  // Cache virtual items to avoid calling getVirtualItems() multiple times
  const virtualItems = rowVirtualizer.getVirtualItems();
  const lastItemIndex = virtualItems.at(-1)?.index;

  // Infinite scroll - fetch next page when near the end
  useEffect(() => {
    if (lastItemIndex === undefined) return;

    if (
      lastItemIndex >= deferredItems.length - 1 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage();
    }
  }, [
    hasNextPage,
    fetchNextPage,
    deferredItems.length,
    isFetchingNextPage,
    lastItemIndex,
  ]);

  // Re-measure when items or dimensions change
  useEffect(() => {
    rowVirtualizer.measure();
  }, [deferredItems, width, lanes, rowVirtualizer]);

  const maxLanes = useGalleryMaxLanes();
  const expandImages = useGalleryExpandImages();
  const showScrollBadge = useGalleryShowScrollBadge();

  const { setLinkRef, handleKeyDown, handleItemFocus, getTabIndex } =
    useMasonryNavigation({
      lanes,
      totalItems: deferredItems.length,
      getVirtualItems: rowVirtualizer.getVirtualItems.bind(rowVirtualizer),
      scrollToIndex: rowVirtualizer.scrollToIndex.bind(rowVirtualizer),
    });

  const maxWidth = !expandImages
    ? maxLanes * (width + GALLERY_HORIZONTAL_GAP_SIZE)
    : undefined;

  const visibleIndices = useMemo(
    () => virtualItems.map((v) => v.index),
    [virtualItems],
  );

  return (
    <div className="w-full" ref={parentRef}>
      <ul
        role="grid"
        aria-label={ariaLabel}
        onKeyDown={handleKeyDown}
        data-scrolling={rowVirtualizer.isScrolling}
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          maxWidth,
        }}
        className="@container relative w-full"
      >
        {!!lanes &&
          virtualItems.map((virtualRow) => {
            const item = deferredItems[virtualRow.index];
            const itemHeight = getItemHeight(item);

            return (
              <ThumbnailGalleryItem
                key={virtualRow.index}
                virtualRow={virtualRow}
                lanes={lanes}
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
        current={(lastItemIndex ?? 0) + 1}
        loaded={deferredItems.length}
        total={totalItems}
        isScrolling={rowVirtualizer.isScrolling}
        show={showScrollBadge}
      />
      <RightSidebarPortal>
        <TagsSidebar items={deferredItems} />
      </RightSidebarPortal>
    </div>
  );
}
