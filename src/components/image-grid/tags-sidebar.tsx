import { useVirtualizer } from "@tanstack/react-virtual";
import React, { useMemo } from "react";
import { he } from "zod/v4/locales";
import { Badge } from "../ui/badge";
import type { FileMetadata } from "@/integrations/hydrus-api/models";
import { TagStatus } from "@/integrations/hydrus-api/models";
import { useAllKnownTagsServiceQuery } from "@/integrations/hydrus-api/queries/services";
import { cn } from "@/lib/utils";

export function TagsSidebar({
  items,
  className,
  style,
}: {
  items: Array<FileMetadata>;
  className?: string;
  style?: React.CSSProperties;
}) {
  const allTagsServiceId = useAllKnownTagsServiceQuery().data;

  const tags = useMemo(
    () =>
      allTagsServiceId && items.length
        ? items.flatMap(
            (d) =>
              d.tags?.[allTagsServiceId].display_tags[
                TagStatus.CURRENT
              ]?.filter((x) => !!x) ?? [],
          )
        : [],
    [items, allTagsServiceId],
  );

  const parentRef = React.useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: tags.length,
    estimateSize: () => 40,
    overscan: 3,
    gap: 8,
    getScrollElement: () => parentRef.current,
  });

  const rows = rowVirtualizer.getVirtualItems();

  return (
    <div
      ref={parentRef}
      className={cn("w-72 overflow-auto", className)}
      style={style}
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
        }}
        className="relative w-full"
      >
        {rows.map((virtualRow) => {
          const tag = tags[virtualRow.index];

          return (
            <div
              key={virtualRow.index}
              data-index={virtualRow.index}
              style={{
                transform: `translateY(${virtualRow.start}px)`,
              }}
              ref={rowVirtualizer.measureElement}
              className="absolute top-0 left-0 flex w-full flex-row gap-1"
            >
              <Badge intent="primary" isCircle={false}>
                {tag}
              </Badge>
              <Badge intent="secondary" isCircle={false}>
                5
              </Badge>
            </div>
          );
        })}
      </div>
    </div>
  );
}
