import { useVirtualizer } from "@tanstack/react-virtual";
import React, { forwardRef, memo, useDeferredValue, useMemo } from "react";
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
import { RightSidebarPortal } from "@/components/right-sidebar-portal";

interface TagItem {
  tag: string;
  count: number;
  namespace: string;
}

// Memoized row component to prevent re-renders
const TagRow = memo(
  forwardRef<
    HTMLLIElement,
    {
      tagItem: TagItem;
      index: number;
      style: React.CSSProperties;
    }
  >(function TagRow({ tagItem, index, style }, ref) {
    console.log("Rendering tag row:", index);
    return (
      <li
        ref={ref}
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
  }),
);

function TagsSidebarInternal({ items }: { items: Array<FileMetadata> }) {
  const allTagsServiceId = useAllKnownTagsServiceQuery().data;

  // Defer heavy computation so UI stays responsive
  const deferredItems = useDeferredValue(items);

  const tags = useMemo((): Array<TagItem> => {
    if (!allTagsServiceId || deferredItems.length === 0) return [];

    // Use object for faster string key lookup than Map
    const counts: Record<string, number> = Object.create(null);

    // eslint-disable-next-line @typescript-eslint/prefer-for-of
    for (let i = 0; i < deferredItems.length; i++) {
      const displayTags =
        deferredItems[i].tags?.[allTagsServiceId]?.display_tags[
          TagStatus.CURRENT
        ];

      if (!displayTags) continue;

      // eslint-disable-next-line @typescript-eslint/prefer-for-of
      for (let j = 0; j < displayTags.length; j++) {
        const displayTag = displayTags[j];
        if (displayTag) {
          counts[displayTag] = (counts[displayTag] || 0) + 1;
        }
      }
    }

    // Get keys once and pre-allocate result array
    const keys = Object.keys(counts);
    const result: Array<TagItem> = new Array(keys.length);

    for (let i = 0; i < keys.length; i++) {
      const displayTag = keys[i];
      const count = counts[displayTag];
      const idx = displayTag.indexOf(":");

      if (idx === -1) {
        result[i] = { tag: displayTag, count, namespace: "" };
      } else {
        result[i] = {
          tag: displayTag.slice(idx + 1),
          count,
          namespace: displayTag.slice(0, idx),
        };
      }
    }

    // Sort in place
    result.sort((a, b) => {
      // Count comparison (descending)
      if (b.count !== a.count) return b.count - a.count;

      // Namespace comparison: empty namespaces go last
      const aHasNamespace = a.namespace !== "";
      const bHasNamespace = b.namespace !== "";
      if (aHasNamespace !== bHasNamespace) return aHasNamespace ? -1 : 1;
      if (aHasNamespace) {
        const nsCompare = a.namespace.localeCompare(b.namespace);
        if (nsCompare !== 0) return nsCompare;
      }

      // Tag comparison (localeCompare for non-ASCII support)
      return a.tag.localeCompare(b.tag);
    });

    return result;
  }, [deferredItems, allTagsServiceId]);

  const parentRef = React.useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: tags.length,
    estimateSize: (i) => {
      const tag = tags[i];
      const length = tag.namespace.length + tag.tag.length;
      return length > 18 ? 40 : 24;
    },
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
          <ScrollArea className="h-full pe-2" ref={parentRef}>
            <SidebarGroup>
              <ol
                style={{
                  height: `${rowVirtualizer.getTotalSize()}px`,
                }}
                className="relative"
              >
                {virtualItems.map((virtualRow) => (
                  <TagRow
                    key={virtualRow.index}
                    ref={
                      virtualRow.size > 24
                        ? rowVirtualizer.measureElement
                        : undefined
                    }
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
