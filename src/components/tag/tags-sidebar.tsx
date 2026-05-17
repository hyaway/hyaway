// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useVirtualizer } from "@tanstack/react-virtual";
import React, { memo, useDeferredValue, useMemo, useState } from "react";
import type { FileMetadata } from "@/integrations/hydrus-api/models";
import type { TagsSortMode } from "@/stores/tags-settings-store";
import {
  useTagsSettingsActions,
  useTagsSortMode,
} from "@/stores/tags-settings-store";
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
import { TagActionMenu, TagActionTrigger } from "@/components/tag/tag-actions";
import { compareTags, parseTag } from "@/lib/tag-utils";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui-primitives/toggle-group";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface TagItem {
  tag: string;
  count: number;
  namespace: string;
}

/** Reconstruct the full display tag string from namespace + tag. */
function fullTag(item: TagItem): string {
  return item.namespace ? `${item.namespace}:${item.tag}` : item.tag;
}

export const TagsSidebar = memo(function TagsSidebarMemo({
  items,
}: {
  items: Array<FileMetadata>;
}) {
  const isMobile = useIsMobile();
  const allTagsServiceId = useAllKnownTagsServiceQuery().data;
  const [search, setSearch] = useState("");
  const sortMode = useTagsSortMode();
  const { setSortMode } = useTagsSettingsActions();

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
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const triggerRefs = React.useRef<Map<number, HTMLButtonElement>>(new Map());
  const pendingFocusRef = React.useRef<number | null>(null);
  const scrollOffset = rowVirtualizer.scrollOffset ?? 0;
  const viewportEnd = scrollOffset + (rowVirtualizer.scrollRect?.height ?? 0);
  const visibleIndices = virtualItems
    .filter((item) => item.end > scrollOffset && item.start < viewportEnd)
    .map((item) => item.index);
  const firstVisibleIndex =
    visibleIndices.length > 0
      ? visibleIndices[0]
      : (virtualItems[0]?.index ?? 0);
  const tabbableIndex =
    focusedIndex !== null && visibleIndices.includes(focusedIndex)
      ? focusedIndex
      : firstVisibleIndex;

  React.useEffect(() => {
    if (focusedIndex !== null && focusedIndex >= filteredTags.length) {
      setFocusedIndex(null);
    }
  }, [filteredTags.length, focusedIndex]);

  const setTriggerRef = React.useCallback(
    (element: HTMLButtonElement | null, index: number) => {
      if (element) {
        triggerRefs.current.set(index, element);
        if (pendingFocusRef.current === index) {
          pendingFocusRef.current = null;
          element.scrollIntoView({ block: "nearest", inline: "nearest" });
          element.focus({ preventScroll: true });
        }
      } else {
        triggerRefs.current.delete(index);
      }
    },
    [],
  );

  const focusTagAtIndex = React.useCallback(
    (nextIndex: number) => {
      if (filteredTags.length === 0) return;

      const boundedIndex = Math.max(
        0,
        Math.min(filteredTags.length - 1, nextIndex),
      );
      setFocusedIndex(boundedIndex);

      if (!visibleIndices.includes(boundedIndex)) {
        pendingFocusRef.current = boundedIndex;
        rowVirtualizer.scrollToIndex(boundedIndex, { align: "auto" });
        return;
      }

      const trigger = triggerRefs.current.get(boundedIndex);
      trigger?.scrollIntoView({ block: "nearest", inline: "nearest" });
      trigger?.focus({ preventScroll: true });
    },
    [filteredTags.length, rowVirtualizer, visibleIndices],
  );

  const handleTagKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
      switch (event.key) {
        case "ArrowDown":
        case "ArrowRight":
          event.preventDefault();
          event.stopPropagation();
          event.nativeEvent.stopImmediatePropagation();
          focusTagAtIndex(index + 1);
          break;
        case "ArrowUp":
        case "ArrowLeft":
          event.preventDefault();
          event.stopPropagation();
          event.nativeEvent.stopImmediatePropagation();
          focusTagAtIndex(index - 1);
          break;
        case "Home":
          event.preventDefault();
          event.stopPropagation();
          event.nativeEvent.stopImmediatePropagation();
          focusTagAtIndex(0);
          break;
        case "End":
          event.preventDefault();
          event.stopPropagation();
          event.nativeEvent.stopImmediatePropagation();
          focusTagAtIndex(filteredTags.length - 1);
          break;
      }
    },
    [filteredTags.length, focusTagAtIndex],
  );

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
          tabIndex={isMobile ? -1 : undefined}
        />
        <ToggleGroup
          value={[sortMode]}
          onValueChange={(value) => {
            const newValue = value[0] as TagsSortMode | undefined;
            if (newValue) setSortMode(newValue);
          }}
          variant="outline-muted"
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
            <TagActionMenu side={isMobile ? "bottom" : "left"}>
              <ol
                style={{
                  height: `${rowVirtualizer.getTotalSize()}px`,
                }}
                className="relative"
              >
                {virtualItems.map((virtualRow) => {
                  const tagItem = filteredTags[virtualRow.index];
                  return (
                    <li
                      key={virtualRow.index}
                      ref={rowVirtualizer.measureElement}
                      data-index={virtualRow.index}
                      style={{
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                      className="absolute top-0 left-0 w-full"
                    >
                      <div className="flex min-w-0 flex-row flex-nowrap items-center justify-start gap-1 font-mono">
                        <span
                          aria-hidden="true"
                          className="text-muted-foreground shrink-0 text-right tabular-nums"
                        >
                          {virtualRow.index + 1}.
                        </span>
                        <TagActionTrigger
                          tag={fullTag(tagItem)}
                          className="max-w-full min-w-0 text-left"
                          tabIndex={virtualRow.index === tabbableIndex ? 0 : -1}
                          triggerRef={(element) =>
                            setTriggerRef(element, virtualRow.index)
                          }
                          onFocus={() => setFocusedIndex(virtualRow.index)}
                          onKeyDownCapture={(event) =>
                            handleTagKeyDown(event, virtualRow.index)
                          }
                        >
                          <TagRowBadge
                            tagItem={tagItem}
                            showCount={deferredItems.length > 1}
                          />
                        </TagActionTrigger>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </TagActionMenu>
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

// Row badge component - stable props enable compiler memoization
const TagRowBadge = memo(function TagRowBadgeMemo({
  tagItem,
  showCount,
}: {
  tagItem: TagItem;
  showCount: boolean;
}) {
  return (
    <TagBadge
      tag={tagItem.tag}
      namespace={tagItem.namespace}
      className="h-auto min-h-6 shrink flex-wrap items-center justify-start gap-y-0.5 overflow-visible px-2 py-1.5 text-left break-normal wrap-anywhere whitespace-normal"
      labelClassName={cn("min-w-[5ch] flex-1 basis-0 wrap-anywhere")}
    >
      {showCount && (
        <TagBadge.Count className="h-5">{tagItem.count}</TagBadge.Count>
      )}
    </TagBadge>
  );
});
