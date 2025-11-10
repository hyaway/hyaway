import { useVirtualizer } from "@tanstack/react-virtual";
import React, { useMemo } from "react";
import { Text } from "../ui/text";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
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

  const tags = useMemo((): Array<{ displayTag: string; count: number }> => {
    if (!allTagsServiceId || items.length === 0) return [];

    const counts = new Map<string, number>();

    for (const item of items) {
      const displayTags =
        item.tags?.[allTagsServiceId]?.display_tags[TagStatus.CURRENT];

      if (!displayTags) continue;

      for (const displayTag of displayTags) {
        if (!displayTag) continue;
        counts.set(displayTag, (counts.get(displayTag) ?? 0) + 1);
      }
    }

    const resultWithNs = Array.from(counts.entries()).map(
      ([displayTag, count]) => {
        const idx = displayTag.indexOf(":");
        const namespace = idx === -1 ? "" : displayTag.slice(0, idx);
        return { displayTag, count, namespace };
      },
    );

    resultWithNs.sort((a, b) => {
      const nsCompare = b.namespace.localeCompare(a.namespace);
      if (nsCompare !== 0) return nsCompare;
      if (b.count !== a.count) return b.count - a.count;
      return a.displayTag.localeCompare(b.displayTag);
    });

    return resultWithNs;
  }, [items, allTagsServiceId]);

  const parentRef = React.useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: tags.length,
    estimateSize: () => 40,
    overscan: 1,
    gap: 8,
    getScrollElement: () => parentRef.current,
  });

  const rows = rowVirtualizer.getVirtualItems();

  if (tags.length === 0) {
    return null;
  }

  return (
    <div
      ref={parentRef}
      className={cn("hidden w-72 overflow-auto ps-4 lg:block", className)}
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
              className="absolute top-0 left-0 flex w-full flex-row items-center gap-1"
            >
              <Badge intent="primary" isCircle={false}>
                {tag.displayTag}
              </Badge>
              <Text>:</Text>
              <Badge intent="secondary" isCircle={false}>
                {tag.count}
              </Badge>
            </div>
          );
        })}
      </div>
    </div>
  );
}
