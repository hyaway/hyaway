import { useVirtualizer } from "@tanstack/react-virtual";
import React, { memo, useDeferredValue, useMemo } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
} from "../ui-primitives/sidebar";
import { ScrollArea } from "../ui-primitives/scroll-area";
import type { FileMetadata } from "@/integrations/hydrus-api/models";
import { Badge } from "@/components/ui-primitives/badge";
import { Heading } from "@/components/ui-primitives/heading";
import { TagStatus } from "@/integrations/hydrus-api/models";
import { useAllKnownTagsServiceQuery } from "@/integrations/hydrus-api/queries/services";
import { cn } from "@/lib/utils";
import { RightSidebarPortal } from "@/components/right-sidebar-portal";

interface TagItem {
  tag: string;
  count: number;
  namespace: string;
}

// Memoized row component to prevent re-renders
const TagRow = memo(function TagRow({
  tagItem,
  index,
  style,
}: {
  tagItem: TagItem;
  index: number;
  style: React.CSSProperties;
}) {
  return (
    <li
      data-index={index}
      style={style}
      className="absolute top-0 left-0 flex w-full min-w-0 flex-row flex-nowrap items-baseline gap-1 font-mono uppercase"
    >
      <span
        aria-hidden="true"
        className="text-muted-foreground shrink-0 text-right tabular-nums"
      >
        {index + 1}.
      </span>
      <Badge
        variant="outline"
        className="h-auto shrink items-start justify-start overflow-visible text-left break-normal wrap-anywhere whitespace-normal select-all"
      >
        {tagItem.namespace ? `${tagItem.namespace}: ` : ""}
        {tagItem.tag}
      </Badge>
      <Badge variant="outline" className="shrink-0 select-all">
        {tagItem.count}
      </Badge>
    </li>
  );
});

function TagsSidebarInternal({
  items,
  className,
  style,
}: {
  items: Array<FileMetadata>;
  className?: string;
  style?: React.CSSProperties;
}) {
  const allTagsServiceId = useAllKnownTagsServiceQuery().data;

  // Defer heavy computation so UI stays responsive
  const deferredItems = useDeferredValue(items);

  const tags = useMemo((): Array<TagItem> => {
    if (!allTagsServiceId || deferredItems.length === 0) return [];

    const counts = new Map<string, number>();

    for (const item of deferredItems) {
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
  }, [deferredItems, allTagsServiceId]);

  const parentRef = React.useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: tags.length,
    estimateSize: () => 32, // Fixed height - no dynamic measurement
    overscan: 5,
    gap: 8,
    getScrollElement: () => parentRef.current,
  });

  // Cache virtual items
  const virtualItems = rowVirtualizer.getVirtualItems();

  if (tags.length === 0) {
    return null;
  }
  return (
    <RightSidebarPortal>
      <Sidebar
        side="right"
        collapsible="none"
        className="sticky top-0 h-svh border-l"
      >
        <SidebarHeader>
          <Heading level={3} className="text-lg font-semibold">
            Tags
          </Heading>
        </SidebarHeader>
        <SidebarContent className="p-1">
          <ScrollArea className="h-full pe-2">
            <SidebarGroup
              ref={parentRef}
              className={cn(className)}
              style={style}
            >
              <ol
                style={{
                  height: `${rowVirtualizer.getTotalSize()}px`,
                }}
                className="relative"
              >
                {virtualItems.map((virtualRow) => (
                  <TagRow
                    key={virtualRow.index}
                    tagItem={tags[virtualRow.index]}
                    index={virtualRow.index}
                    style={{
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  />
                ))}
              </ol>
            </SidebarGroup>
          </ScrollArea>
        </SidebarContent>
        <SidebarFooter>
          <span className="text-muted-foreground text-sm">
            {tags.length} unique tags for {deferredItems.length} loaded files
          </span>
        </SidebarFooter>
      </Sidebar>
    </RightSidebarPortal>
  );
}

export const TagsSidebar = memo(TagsSidebarInternal);
