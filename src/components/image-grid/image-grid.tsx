import { useWindowVirtualizer } from "@tanstack/react-virtual";
import React, { useDeferredValue, useEffect, useMemo } from "react";
import { CARD_FOOTER_HEIGHT, ImageGridCard } from "./image-grid-card";
import { ImageGridSkeleton } from "./image-grid-skeleton";
import type { FileMetadata } from "@/integrations/hydrus-api/models";
import { TagsSidebar } from "@/components/tag/tags-sidebar";
import { PageError } from "@/components/page/page-error";
import { Badge } from "@/components/ui-primitives/badge";
import { useThumbnailDimensions } from "@/integrations/hydrus-api/queries/options";
import { useInfiniteGetFilesMetadata } from "@/integrations/hydrus-api/queries/manage-files";
import { useMasonryNavigation } from "@/hooks/use-masonry-navigation";
import { useResponsiveGrid } from "@/hooks/use-responsive-grid";
import { useScrollRestoration } from "@/hooks/use-scroll-restoration";
import { cn } from "@/lib/utils";
import { useGridExpandImages, useGridMaxLanes } from "@/lib/ux-settings-store";

export function ImageGrid({ fileIds }: { fileIds: Array<number> }) {
  const itemsQuery = useInfiniteGetFilesMetadata(fileIds, false);
  const defaultDimensions = useThumbnailDimensions();

  if (fileIds.length === 0) {
    return <p>Page is empty.</p>;
  }

  if (!defaultDimensions || itemsQuery.isPending) {
    return <ImageGridSkeleton />;
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
    <PureImageGrid
      itemsQuery={itemsQuery}
      totalItems={fileIds.length}
      defaultDimensions={defaultDimensions}
    />
  );
}

export function PureImageGrid({
  itemsQuery,
  totalItems,
  defaultDimensions,
}: {
  itemsQuery: ReturnType<typeof useInfiniteGetFilesMetadata>;
  totalItems: number;
  defaultDimensions: { width: number; height: number };
}) {
  const { data, isFetchingNextPage, fetchNextPage, hasNextPage } = itemsQuery;

  const items = useMemo(
    () => (data ? data.pages.flatMap((d) => d.metadata) : []),
    [data],
  );

  // Defer items so old grid stays visible while new items load
  const deferredItems = useDeferredValue(items);

  const parentRef = React.useRef<HTMLDivElement>(null);
  const { width, lanes } = useResponsiveGrid(
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
    const height = Math.max(aspectRatio * width, 64) + CARD_FOOTER_HEIGHT;
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
    gap: 8,
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

  const maxLanes = useGridMaxLanes();
  const expandImages = useGridExpandImages();

  const { setLinkRef, handleKeyDown, handleItemFocus, getTabIndex } =
    useMasonryNavigation({
      lanes,
      totalItems: deferredItems.length,
      getVirtualItems: rowVirtualizer.getVirtualItems.bind(rowVirtualizer),
      scrollToIndex: rowVirtualizer.scrollToIndex.bind(rowVirtualizer),
    });

  const maxWidth = !expandImages ? maxLanes * (width + 4) : undefined;

  const visibleIndices = useMemo(
    () => virtualItems.map((v) => v.index),
    [virtualItems],
  );

  return (
    <div className="flex w-full flex-row" style={{ maxWidth }}>
      <div ref={parentRef} className="@container w-full">
        <ul
          role="grid"
          onKeyDown={handleKeyDown}
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
          }}
          className="relative w-full"
        >
          {!!lanes &&
            virtualItems.map((virtualRow) => {
              const item = deferredItems[virtualRow.index];
              const itemHeight = getItemHeight(item);

              return (
                <ImageGridCard
                  key={virtualRow.index}
                  virtualRow={virtualRow}
                  lanes={lanes}
                  totalItemsCount={deferredItems.length}
                  item={item}
                  width={width}
                  height={itemHeight}
                  scrollMargin={rowVirtualizer.options.scrollMargin}
                  isScrolling={rowVirtualizer.isScrolling}
                  tabIndex={getTabIndex(virtualRow.index, visibleIndices)}
                  linkRef={setLinkRef(virtualRow.index)}
                  onFocus={() => handleItemFocus(virtualRow.index)}
                />
              );
            })}
        </ul>
      </div>
      <Badge
        className={cn(
          "fixed right-4 bottom-4 z-10 mt-4 transition-opacity xl:right-72",
          rowVirtualizer.isScrolling
            ? "opacity-90 delay-0 duration-100"
            : "opacity-50 delay-100 duration-500",
        )}
        variant="secondary"
      >
        {(lastItemIndex ?? 0) + 1}/{deferredItems.length} ({totalItems})
      </Badge>
      <TagsSidebar items={deferredItems} />
    </div>
  );
}
