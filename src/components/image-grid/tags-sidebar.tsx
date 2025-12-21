import { useVirtualizer } from "@tanstack/react-virtual";
import React, { useMemo } from "react";
import { Sidebar } from "../ui-primitives/sidebar";
import type { FileMetadata } from "@/integrations/hydrus-api/models";
import { Badge } from "@/components/ui-primitives/badge";
import { Heading } from "@/components/ui-primitives/heading";
import { TagStatus } from "@/integrations/hydrus-api/models";
import { useAllKnownTagsServiceQuery } from "@/integrations/hydrus-api/queries/services";
import { cn } from "@/lib/utils";
import { RightSidebarPortal } from "@/components/right-sidebar-portal";

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

  const tags = useMemo((): Array<{
    tag: string;
    count: number;
    namespace: string;
  }> => {
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
        if (idx === -1) {
          return { tag: displayTag, count, namespace: "" };
        }
        const namespace = displayTag.slice(0, idx);
        const tag = displayTag.slice(idx + 1);
        return { tag, count, namespace };
      },
    );

    resultWithNs.sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      const nsCompare =
        a.namespace === "" && b.namespace !== ""
          ? 1
          : a.namespace !== "" && b.namespace === ""
            ? -1
            : a.namespace.localeCompare(b.namespace);
      if (nsCompare !== 0) return nsCompare;
      return a.tag.localeCompare(b.tag);
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

  const combinedStyle: React.CSSProperties = {
    ...style,
    overflow: "auto",
  };
  if (tags.length === 0) {
    return null;
  }
  return (
    <RightSidebarPortal>
      <Sidebar
        side="right"
        collapsible="none"
        className="sticky top-0 hidden h-svh border-l lg:flex"
      >
        <div
          ref={parentRef}
          className={cn("hidden w-72 ps-4 lg:block", className)}
          style={combinedStyle}
        >
          <Heading level={3} className="mb-4 text-lg font-semibold">
            Tags
          </Heading>
          <ol
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
            }}
            className="relative"
          >
            {rows.map((virtualRow) => {
              const tagItem = tags[virtualRow.index];

              return (
                <li
                  key={virtualRow.index}
                  data-index={virtualRow.index}
                  style={{
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                  ref={rowVirtualizer.measureElement}
                  className="absolute top-0 left-0 flex w-full min-w-0 flex-row flex-nowrap items-baseline gap-1 font-mono uppercase"
                >
                  <span
                    aria-hidden="true"
                    className="text-muted-foreground shrink-0 text-right tabular-nums"
                  >
                    {virtualRow.index + 1}.
                  </span>
                  <Badge
                    variant={"outline"}
                    className="h-auto shrink items-start justify-start overflow-visible text-left break-normal wrap-anywhere whitespace-normal"
                  >
                    {tagItem.namespace ? `${tagItem.namespace}: ` : ""}
                    {tagItem.tag}
                  </Badge>
                  <Badge variant={"outline"} className="shrink-0">
                    {tagItem.count}
                  </Badge>
                </li>
              );
            })}
          </ol>
        </div>
      </Sidebar>
    </RightSidebarPortal>
  );
}
