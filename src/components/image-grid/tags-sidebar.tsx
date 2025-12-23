import { useVirtualizer } from "@tanstack/react-virtual";
import React, {
  forwardRef,
  memo,
  useDeferredValue,
  useMemo,
  useState,
} from "react";
import type { FileMetadata } from "@/integrations/hydrus-api/models";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarInput,
} from "@/components/ui-primitives/sidebar";
import { ScrollArea } from "@/components/ui-primitives/scroll-area";
import { Heading } from "@/components/ui-primitives/heading";
import { TagStatus } from "@/integrations/hydrus-api/models";
import { useAllKnownTagsServiceQuery } from "@/integrations/hydrus-api/queries/services";
import { RightSidebarPortal } from "@/components/app-shell/right-sidebar-portal";
import { TagBadge } from "@/components/tag-badge";
import { compareTags, parseTag } from "@/lib/tag-utils";

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
      showCount: boolean;
    }
  >(function TagRow({ tagItem, index, style, showCount }, ref) {
    return (
      <li
        ref={ref}
        data-index={index}
        style={style}
        className="absolute top-0 left-0 flex w-full min-w-0 flex-row flex-nowrap items-center gap-1 font-mono text-sm"
      >
        <span
          aria-hidden="true"
          className="text-muted-foreground shrink-0 text-right tabular-nums"
        >
          {index + 1}.
        </span>
        <TagBadge
          tag={tagItem.tag}
          namespace={tagItem.namespace}
          size="xs"
          className="h-auto min-h-8 shrink items-center justify-start overflow-visible text-left break-normal wrap-anywhere whitespace-normal"
        >
          {showCount && <TagBadge.Count>{tagItem.count}</TagBadge.Count>}
        </TagBadge>
      </li>
    );
  }),
);

export const TagsSidebar = memo(function TagsSidebar({
  items,
}: {
  items: Array<FileMetadata>;
}) {
  const allTagsServiceId = useAllKnownTagsServiceQuery().data;
  const [search, setSearch] = useState("");

  // Defer heavy computation so UI stays responsive
  const deferredItems = useDeferredValue(items);
  const deferredSearch = useDeferredValue(search);

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
      const { namespace, tag } = parseTag(displayTag);
      result[i] = { tag, count, namespace };
    }

    // Sort in place
    result.sort((a, b) => {
      // Count comparison (descending)
      if (b.count !== a.count) return b.count - a.count;

      // Then by namespace and tag
      return compareTags(a, b);
    });

    return result;
  }, [deferredItems, allTagsServiceId]);

  // Filter tags based on search
  const filteredTags = useMemo(() => {
    if (!deferredSearch.trim()) return tags;
    const searchLower = deferredSearch.toLowerCase();
    return tags.filter(
      (item) =>
        item.tag.toLowerCase().includes(searchLower) ||
        item.namespace.toLowerCase().includes(searchLower),
    );
  }, [tags, deferredSearch]);

  const parentRef = React.useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: filteredTags.length,
    estimateSize: (i) => {
      const tag = filteredTags[i];
      const length = tag.namespace.length + tag.tag.length;
      return length > 14 ? 40 : 24;
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
        className="sticky top-0 h-svh border-l p-1"
      >
        <SidebarHeader className="gap-4">
          <Heading level={3} className="text-lg font-semibold">
            Tags
          </Heading>
          <SidebarInput
            type="search"
            placeholder="Filter tags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 text-sm"
          />
        </SidebarHeader>
        <SidebarContent>
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
                    ref={rowVirtualizer.measureElement}
                    tagItem={filteredTags[virtualRow.index]}
                    index={virtualRow.index}
                    showCount={deferredItems.length > 1}
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
            {deferredSearch.trim()
              ? `${filteredTags.length} of ${tags.length} tags`
              : deferredItems.length === 1
                ? `${tags.length} tags`
                : `${tags.length} unique tags for ${deferredItems.length} loaded files`}
          </span>
        </SidebarFooter>
      </Sidebar>
    </RightSidebarPortal>
  );
});
