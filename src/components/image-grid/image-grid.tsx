import { useWindowVirtualizer } from "@tanstack/react-virtual";
import React, { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { Thumbnail } from "./thumbnail";
import { useThumbnailDimensions } from "@/integrations/hydrus-api/queries";

export function ImageGrid({ fileIds }: { fileIds: Array<number> }) {
  const dimensions = useThumbnailDimensions();

  const items = useMemo(
    () =>
      fileIds.map((fileId, index) => {
        // Deterministic pseudo-random number in [0,1)
        const seed = fileId ^ ((index + 1) * 0x45d9f3b);
        let x = seed;
        x = ((x >> 16) ^ x) * 0x45d9f3b;
        x = ((x >> 16) ^ x) * 0x45d9f3b;
        x = (x >> 16) ^ x;
        const rand01 = (x >>> 0) / 0xffffffff;

        const minRatio = 0.5;
        const maxRatio = 1.4;
        const aspectRatio = +(
          minRatio +
          rand01 * (maxRatio - minRatio)
        ).toFixed(3);

        return {
          fileId,
          id: fileId,
          aspectRatio,
        };
      }),
    [fileIds],
  );

  const parentRef = React.useRef<HTMLDivElement>(null);

  const [lanes, setLanes] = useState(0);

  const rowVirtualizer = useWindowVirtualizer({
    count: items.length,
    estimateSize: (i) => items[i].aspectRatio * dimensions.width,
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
        Math.floor(entry.contentRect.width / (dimensions.width + 4)),
      );
      setLanes(newLanes);
      rowVirtualizer.measure();
    });

    observer.observe(parentRef.current);

    return () => observer.disconnect();
  }, [dimensions.width, rowVirtualizer]);

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
                  width: `${dimensions.width}px`,
                  height: `${items[virtualRow.index].aspectRatio * dimensions.width}px`,
                  transform: `translateY(${virtualRow.start - rowVirtualizer.options.scrollMargin}px)`,
                  transition: "transform 150ms ease-out, left 150ms ease-out",
                  willChange: "transform,left",
                }}
                className="absolute top-0"
              >
                <Thumbnail fileId={items[virtualRow.index].fileId} />
              </div>
            ))}
        </div>
      </div>
    </>
  );
}
