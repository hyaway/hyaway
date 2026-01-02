import { useVirtualizer } from "@tanstack/react-virtual";
import React, { memo, useDeferredValue, useMemo, useState } from "react";
import type { FileMetadata } from "@/integrations/hydrus-api/models";
import type { TagsSortMode } from "@/lib/settings-store";
import { useSettingsActions, useTagsSortMode } from "@/lib/settings-store";
import {
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
import { TagBadge } from "@/components/tag/tag-badge";
import { compareTags, parseTag } from "@/lib/tag-utils";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui-primitives/toggle-group";

interface TagItem {
  tag: string;
  count: number;
  namespace: string;
}

export const TagsSidebar = memo(function TagsSidebar({
  items,
}: {
  items: Array<FileMetadata>;
}) {
  const allTagsServiceId = useAllKnownTagsServiceQuery().data;
  const [search, setSearch] = useState("");
  const sortMode = useTagsSortMode();
  const { setTagsSortMode } = useSettingsActions();

  // Defer heavy computation so UI stays responsive
  const deferredItems = useDeferredValue(items);
  const deferredSearch = useDeferredValue(search);
  const deferredSortMode = useDeferredValue(sortMode);

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

    // Sort based on mode
    if (deferredSortMode === "namespace") {
      // Group by namespace first, then by count within each namespace
      result.sort((a, b) => {
        // Namespace comparison
        const nsCompare = compareTags(a, b);
        if (a.namespace !== b.namespace) return nsCompare;

        // Within same namespace, sort by count descending
        if (b.count !== a.count) return b.count - a.count;

        // Then by tag name
        return a.tag.localeCompare(b.tag);
      });
    } else {
      // Sort by count (default)
      result.sort((a, b) => {
        // Count comparison (descending)
        if (b.count !== a.count) return b.count - a.count;

        // Then by namespace and tag
        return compareTags(a, b);
      });
    }

    return result;
  }, [deferredItems, allTagsServiceId, deferredSortMode]);

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
    gap: 6,
    getScrollElement: () => parentRef.current,
  });

  // Cache virtual items
  const virtualItems = rowVirtualizer.getVirtualItems();

  return (
    <>
      <SidebarHeader className="gap-4">
        <Heading level={3} className="text-lg font-semibold">
          Tags
        </Heading>
        <SidebarInput
          type="search"
          placeholder="Filter tags..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <ToggleGroup
          value={[sortMode]}
          onValueChange={(value) => {
            const newValue = value[0] as TagsSortMode | undefined;
            if (newValue) setTagsSortMode(newValue);
          }}
          variant="outline"
          size="sm"
          className="w-full"
        >
          <ToggleGroupItem value="count" className="flex-1">
            Count
          </ToggleGroupItem>
          <ToggleGroupItem value="namespace" className="flex-1">
            Namespace
          </ToggleGroupItem>
        </ToggleGroup>
      </SidebarHeader>
      <SidebarContent className="min-h-0 flex-1 pe-1">
        <ScrollArea viewportClassName="h-full max-h-svh pe-2.5" ref={parentRef}>
          <SidebarGroup>
            <ol
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
              }}
              className="relative"
            >
              {virtualItems.map((virtualRow) => (
                <li
                  key={virtualRow.index}
                  ref={rowVirtualizer.measureElement}
                  data-index={virtualRow.index}
                  style={{ transform: `translateY(${virtualRow.start}px)` }}
                  className="absolute top-0 left-0 w-full"
                >
                  <TagRowContent
                    tagItem={filteredTags[virtualRow.index]}
                    index={virtualRow.index}
                    showCount={deferredItems.length > 1}
                  />
                </li>
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
    </>
  );
});

// Row content component - stable props enable compiler memoization
const TagRowContent = memo(function TagRowContent({
  tagItem,
  index,
  showCount,
}: {
  tagItem: TagItem;
  index: number;
  showCount: boolean;
}) {
  return (
    <div className="flex min-w-0 flex-row flex-nowrap items-center justify-start gap-1 font-mono">
      <span
        aria-hidden="true"
        className="text-muted-foreground shrink-0 text-right tabular-nums"
      >
        {index + 1}.
      </span>
      <TagBadge
        tag={tagItem.tag}
        namespace={tagItem.namespace}
        className="h-auto min-h-6 shrink items-center justify-start overflow-visible px-2 py-1 text-left break-normal wrap-anywhere whitespace-normal"
      >
        {showCount && (
          <TagBadge.Count className="h-5">{tagItem.count}</TagBadge.Count>
        )}
      </TagBadge>
    </div>
  );
});
