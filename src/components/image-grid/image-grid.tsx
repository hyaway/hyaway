import { useWindowVirtualizer } from "@tanstack/react-virtual";
import React, {
  startTransition,
  useDeferredValue,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import { AxiosError } from "axios";
import { ExclamationCircleIcon } from "@heroicons/react/16/solid";
import { ImageGridCard } from "./image-grid-card";
import { TagsSidebar } from "./tags-sidebar";
import { Spinner } from "@/components/ui-primitives/spinner";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui-primitives/alert";
import { Badge } from "@/components/ui-primitives/badge";
import { useThumbnailDimensions } from "@/integrations/hydrus-api/queries/options";
import { useInfiniteGetFilesMetadata } from "@/integrations/hydrus-api/queries/get-files";
import { cn } from "@/lib/utils";

export function ImageGrid({ fileIds }: { fileIds: Array<number> }) {
  const itemsQuery = useInfiniteGetFilesMetadata(fileIds, false);
  const defaultDimensions = useThumbnailDimensions();

  if (fileIds.length === 0) {
    return <p>Page is empty.</p>;
  }

  if (!defaultDimensions || itemsQuery.isPending) {
    return <Spinner />;
  }

  if (itemsQuery.isError) {
    return (
      <Alert variant="destructive">
        <ExclamationCircleIcon />
        <AlertTitle>
          {itemsQuery.error instanceof Error
            ? itemsQuery.error.message
            : "An unknown error occurred while fetching gallery"}
        </AlertTitle>
        <AlertDescription>
          {itemsQuery.error instanceof AxiosError &&
          itemsQuery.error.response?.data?.error ? (
            <span>{itemsQuery.error.response.data.error}</span>
          ) : null}
        </AlertDescription>
      </Alert>
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

  const [gridState, setGridState] = useState({
    width: defaultDimensions.width,
    desiredLanes: 0,
  });
  const { width, desiredLanes } = gridState;
  const lanes =
    deferredItems.length < desiredLanes
      ? Math.max(deferredItems.length, 2)
      : desiredLanes;

  // Cache heights - invalidates when width changes
  const heightCache = useMemo(() => new Map<number, number>(), [width]);

  const getItemHeight = (itemWidth: number, itemHeight: number) => {
    const cached = heightCache.get(itemHeight);
    if (cached !== undefined) return cached;
    const height = Math.min(itemHeight / itemWidth, 3) * width;
    heightCache.set(itemHeight, height);
    return height;
  };

  const rowVirtualizer = useWindowVirtualizer({
    count: deferredItems.length,
    estimateSize: (i) => {
      const item = deferredItems[i];
      return getItemHeight(item.width, item.height);
    },
    overscan: 4,
    gap: 8,
    lanes,
    scrollMargin: parentRef.current?.offsetTop ?? 0,
  });

  // Cache virtual items to avoid calling getVirtualItems() multiple times
  const virtualItems = rowVirtualizer.getVirtualItems();
  const lastItemIndex = virtualItems.at(-1)?.index;

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

  useLayoutEffect(() => {
    if (!parentRef.current) {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      const newLanes = Math.max(
        2,
        Math.floor(entry.contentRect.width / (defaultDimensions.width + 4)),
      );
      const newWidth =
        newLanes < 3
          ? entry.contentRect.width / newLanes - 4
          : defaultDimensions.width;

      startTransition(() => {
        setGridState({ width: newWidth, desiredLanes: newLanes });
      });
    });

    observer.observe(parentRef.current);

    return () => observer.disconnect();
  }, [defaultDimensions.width, rowVirtualizer]);

  useEffect(() => {
    rowVirtualizer.measure();
  }, [deferredItems, width, lanes, rowVirtualizer]);

  return (
    <div className="flex w-full flex-row">
      <div ref={parentRef} className="@container w-full">
        <ul
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
          }}
          className="relative w-full"
        >
          {!!lanes &&
            virtualItems.map((virtualRow) => {
              const item = deferredItems[virtualRow.index];
              const itemHeight = getItemHeight(item.width, item.height);

              return (
                <li
                  key={virtualRow.index}
                  style={{
                    width: `${width}px`,
                    height: `${itemHeight}px`,
                    transform: `translate(${(virtualRow.lane * 100) / lanes}cqw, ${virtualRow.start - rowVirtualizer.options.scrollMargin}px)`,
                    containIntrinsicSize: `${width}px ${itemHeight}px`,
                  }}
                  className={cn(
                    "absolute top-0 left-0 z-0 overflow-visible [content-visibility:auto] hover:z-999 hover:[content-visibility:visible]",
                    !rowVirtualizer.isScrolling &&
                      "transition-transform duration-350 ease-out",
                  )}
                >
                  <ImageGridCard
                    virtualRow={virtualRow}
                    lanes={lanes}
                    totalItemsCount={deferredItems.length}
                    item={item}
                    width={width}
                  />
                </li>
              );
            })}
        </ul>
      </div>
      <Badge
        className={cn(
          "fixed right-4 bottom-4 z-10 mt-4 transition-opacity lg:right-72",
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
