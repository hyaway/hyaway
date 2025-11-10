import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { AxiosError } from "axios";
import React, { useLayoutEffect, useMemo, useState } from "react";
import { Loader } from "../ui/loader";
import { Note } from "../ui/note";
import { Thumbnail } from "./thumbnail";
import { useThumbnailDimensions } from "@/integrations/hydrus-api/queries";
import { useGetFilesMetadata } from "@/integrations/hydrus-api/get-files";

export function ImageGrid({ fileIds }: { fileIds: Array<number> }) {
  const { data, isLoading, isError, error } = useGetFilesMetadata(fileIds);
  const defaultDimensions = useThumbnailDimensions();

  if (!defaultDimensions || isLoading) {
    return <Loader />;
  }

  if (isError) {
    return (
      <Note intent="danger">
        {error instanceof Error
          ? error.message
          : "An unknown error occurred while fetching gallery"}
        <br />
        {error instanceof AxiosError && error.response?.data?.error && (
          <span>{error.response.data.error}</span>
        )}
      </Note>
    );
  }

  if (!data || data.length === 0) {
    return <p>No images to display.</p>;
  }

  return <PureImageGrid items={data} defaultDimensions={defaultDimensions} />;
}

export function PureImageGrid({
  items,
  defaultDimensions,
}: {
  items: Array<{
    file_id: number;
    width: number;
    height: number;
  }>;
  defaultDimensions: { width: number; height: number };
}) {
  const parentRef = React.useRef<HTMLDivElement>(null);

  const [desiredLanes, setLanes] = useState(0);
  const lanes = items.length < desiredLanes ? items.length : desiredLanes;

  const heights = useMemo(
    () =>
      items.map(
        (item) =>
          Math.min(item.height / item.width, 3) * defaultDimensions.width,
      ),
    [items, defaultDimensions.width],
  );

  const rowVirtualizer = useWindowVirtualizer({
    count: items.length,
    estimateSize: (i) => heights[i],
    overscan: 5,
    gap: 8,
    lanes,
    scrollMargin: parentRef.current?.offsetTop ?? 0,
  });

  useLayoutEffect(() => {
    if (!parentRef.current) {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      const newLanes = Math.max(
        1,
        Math.floor(entry.contentRect.width / (defaultDimensions.width + 4)),
      );
      setLanes(newLanes);
      rowVirtualizer.measure();
    });

    observer.observe(parentRef.current);

    return () => observer.disconnect();
  }, [defaultDimensions.width, rowVirtualizer]);

  return (
    <>
      <div ref={parentRef}>
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
          }}
          className="relative w-full"
        >
          {!!lanes &&
            rowVirtualizer.getVirtualItems().map((virtualRow) => (
              <div
                key={virtualRow.index}
                style={{
                  left: `${(virtualRow.lane * 100) / lanes}%`,
                  width: `${defaultDimensions.width}px`,
                  height: `${heights[virtualRow.index]}px`,
                  transform: `translateY(${virtualRow.start - rowVirtualizer.options.scrollMargin}px)`,
                  transition: "transform 150ms ease-out, left 150ms ease-out",
                  willChange: "transform,left",
                }}
                className="absolute top-0"
              >
                <Thumbnail fileId={items[virtualRow.index].file_id} />
              </div>
            ))}
        </div>
      </div>
    </>
  );
}
