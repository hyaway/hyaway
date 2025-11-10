import { createFileRoute } from "@tanstack/react-router";
import { AxiosError } from "axios";
import { useMemo } from "react";
import { Heading } from "@/components/ui/heading";
import { Loader } from "@/components/ui/loader";
import { Note } from "@/components/ui/note";
import { Separator } from "@/components/ui/separator";
import { useThumbnailFileIdUrl } from "@/hooks/use-url-with-api-key";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import {
  useGetPageInfoQuery,
  useThumbnailDimensions,
} from "@/integrations/hydrus-api/queries";
import { cn } from "@/lib/utils";
import React, { useLayoutEffect, useState } from "react";

export const Route = createFileRoute("/_auth/pages/$pageId")({
  component: RouteComponent,
});

function RouteComponent() {
  const { pageId } = Route.useParams();
  const { data, isLoading, isError, error } = useGetPageInfoQuery(pageId, true);

  if (isLoading) {
    return <Loader />;
  }

  if (isError) {
    return (
      <Note intent="danger">
        {error instanceof Error
          ? error.message
          : "An unknown error occurred while fetching pages."}
        <br />
        {error instanceof AxiosError && error.response?.data?.error && (
          <span>{error.response.data.error}</span>
        )}
      </Note>
    );
  }

  return (
    <div>
      <Heading>Page: {data?.page_info.name}</Heading>
      <Separator className="my-2" />
      {data?.page_info.media ? (
        <div>
          <p>Number of files: {data.page_info.media.num_files}</p>
          {/* <div className="flex flex-row flex-wrap gap-x-2 gap-y-2 ps-1">
            {data.page_info.media.hash_ids.map((fileId) => (
              <Thumbnail key={fileId} fileId={fileId} />
            ))}
          </div> */}
          {/* <ImageGrid fileIds={data.page_info.media.hash_ids} /> */}
          <ImageGrid fileIds={data.page_info.media.hash_ids} />
        </div>
      ) : (
        <p>This page has no media.</p>
      )}
    </div>
  );
}

interface ThumbnailProps extends React.HTMLAttributes<HTMLDivElement> {
  fileId: number;
}

function Thumbnail({ fileId, className, ...props }: ThumbnailProps) {
  const url = useThumbnailFileIdUrl(fileId);
  return (
    <div
      {...props}
      className={cn(`h-full w-full overflow-hidden rounded border`, className)}
    >
      <img
        src={url}
        alt={`Thumbnail for file ID ${fileId}`}
        className="h-full w-full object-cover"
        loading="lazy"
      />
    </div>
  );
}

function ImageGrid({ fileIds }: { fileIds: Array<number> }) {
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

  const [lanes, setLanes] = useState(4);

  useLayoutEffect(() => {
    if (!parentRef.current) {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        const newLanes = Math.max(
          1,
          Math.floor(entry.contentRect.width / (dimensions.width + 4)),
        );
        setLanes(newLanes);
        rowVirtualizer.measure();
      }
    });

    observer.observe(parentRef.current);

    return () => observer.disconnect();
  }, [dimensions.width]);

  const rowVirtualizer = useWindowVirtualizer({
    count: items.length,
    estimateSize: (i) => items[i].aspectRatio * dimensions.width,
    overscan: 1,
    gap: 8,
    lanes,
    scrollMargin: parentRef.current?.offsetTop ?? 0,
  });

  return (
    <>
      <div ref={parentRef}>
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => (
            <div
              key={virtualRow.index}
              style={{
                position: "absolute",
                top: 0,
                left: `${(virtualRow.lane * 100) / lanes}%`,
                width: `${dimensions.width}px`,
                height: `${items[virtualRow.index].aspectRatio * dimensions.width}px`,
                transform: `translateY(${virtualRow.start - rowVirtualizer.options.scrollMargin}px)`,
              }}
            >
              <Thumbnail fileId={items[virtualRow.index].fileId} />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
