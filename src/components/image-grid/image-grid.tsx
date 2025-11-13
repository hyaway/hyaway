import { useWindowVirtualizer } from "@tanstack/react-virtual";
import React, { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { AxiosError } from "axios";
import { Loader } from "../ui/loader";
import { Note } from "../ui/note";
import { Badge } from "../ui/badge";
import { ImageGridCard } from "./image-grid-card";
import { TagsSidebar } from "./tags-sidebar";
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
    return <Loader />;
  }

  if (itemsQuery.isError) {
    return (
      <Note intent="danger">
        {itemsQuery.error instanceof Error
          ? itemsQuery.error.message
          : "An unknown error occurred while fetching gallery"}
        <br />
        {itemsQuery.error instanceof AxiosError &&
          itemsQuery.error.response?.data?.error && (
            <span>{itemsQuery.error.response.data.error}</span>
          )}
      </Note>
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

  const parentRef = React.useRef<HTMLDivElement>(null);

  const [desiredLanes, setLanes] = useState(0);
  const lanes =
    items.length < desiredLanes ? Math.max(items.length, 2) : desiredLanes;

  const [width, setWidth] = useState(defaultDimensions.width);

  const heights = useMemo(
    () => items.map((item) => Math.min(item.height / item.width, 3) * width),
    [items, width],
  );

  const rowVirtualizer = useWindowVirtualizer({
    count: items.length,
    estimateSize: (i) => heights[i],
    overscan: 3,
    gap: 8,
    lanes,
    scrollMargin: parentRef.current?.offsetTop ?? 0,
  });

  const lastItemIndex = rowVirtualizer.getVirtualIndexes().at(-1);

  useEffect(() => {
    if (!lastItemIndex) {
      return;
    }

    if (
      lastItemIndex >= items.length - 1 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage();
    }
  }, [
    hasNextPage,
    fetchNextPage,
    items.length,
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
      if (newLanes < 3) {
        setWidth(entry.contentRect.width / newLanes - 4);
      } else {
        setWidth(defaultDimensions.width);
      }
      setLanes(newLanes);
    });

    observer.observe(parentRef.current);

    return () => observer.disconnect();
  }, [defaultDimensions.width, rowVirtualizer]);

  useLayoutEffect(() => {
    rowVirtualizer.measure();
  }, [heights, width, lanes, rowVirtualizer]);

  return (
    <div className="flex w-full flex-row">
      <div ref={parentRef} className="w-full">
        <ul
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
          }}
          className="relative w-full"
        >
          {!!lanes &&
            rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const item = items[virtualRow.index];

              return (
                <li
                  key={virtualRow.index}
                  style={{
                    left: `${(virtualRow.lane * 100) / lanes}%`,
                    width: `${width}px`,
                    height: `${heights[virtualRow.index]}px`,
                    transform: `translateY(${virtualRow.start - rowVirtualizer.options.scrollMargin}px)`,
                  }}
                  className="absolute top-0 z-0 overflow-visible transition-[left,transform,width,height] duration-350 ease-out will-change-[left,transform,width,height] hover:z-999"
                >
                  <ImageGridCard
                    virtualRow={virtualRow}
                    lanes={lanes}
                    totalItemsCount={items.length}
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
          "fixed right-4 bottom-4 z-10 mt-4",
          rowVirtualizer.isScrolling ? "opacity-100" : "opacity-50",
        )}
        intent="secondary"
        isCircle={true}
      >
        {(lastItemIndex ?? 0) + 1}/{items.length} ({totalItems})
      </Badge>
      <TagsSidebar items={items} />
    </div>
  );
}
