// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useDeferredValue, useMemo } from "react";
import type { ReactNode } from "react";

import type { FileMetadata } from "@/integrations/hydrus-api/models";
import type { TagItem } from "@/lib/tag-sidebar-types";
import { SectionHeading } from "@/components/page-shell/section-heading";
import { Input } from "@/components/ui-primitives/input";
import { Skeleton } from "@/components/ui-primitives/skeleton";
import { useAllKnownTagsServiceQuery } from "@/integrations/hydrus-api/queries/services";
import { TagActionBadge } from "@/components/tag/tag-badge";
import { TagActionMenu, isSystemTag } from "@/components/tag/tag-actions";
import { useRovingTagActionTriggers } from "@/components/tag/tag-list-focus";
import { useFileTagsDisplaySortMode } from "@/components/settings/file-tags-settings";
import { useTagFilterSearchParam } from "@/hooks/use-tag-filter-search-param";
import { createTagItems } from "@/lib/tag-sidebar-items";
import { sortTagItems } from "@/lib/tag-sidebar-sort";
import { cn } from "@/lib/utils";

function fullTag(item: TagItem): string {
  return item.namespace ? `${item.namespace}:${item.tag}` : item.tag;
}

export function InlineTagsList({ data }: { data: FileMetadata }) {
  const allTagsServiceId = useAllKnownTagsServiceQuery().data;
  const fileSortMode = useFileTagsDisplaySortMode();
  const [search, setSearch] = useTagFilterSearchParam();
  const deferredSearch = useDeferredValue(search);

  const tags = useMemo(() => {
    return sortTagItems(
      createTagItems([data], allTagsServiceId),
      fileSortMode,
    ).map(fullTag);
  }, [allTagsServiceId, data, fileSortMode]);

  const filteredTagsSet = useMemo(() => {
    if (!deferredSearch.trim()) return null;
    const searchLower = deferredSearch.toLowerCase();
    return new Set(
      tags.filter((tag) => tag.toLowerCase().includes(searchLower)),
    );
  }, [tags, deferredSearch]);

  const filteredCount = filteredTagsSet?.size ?? tags.length;
  const enabledTagIndices = useMemo(
    () =>
      tags.flatMap((tag, index) => {
        const isVisible = !filteredTagsSet || filteredTagsSet.has(tag);
        return isVisible && !isSystemTag(tag) ? [index] : [];
      }),
    [filteredTagsSet, tags],
  );
  const rovingTriggers = useRovingTagActionTriggers({
    itemCount: tags.length,
    enabledIndices: enabledTagIndices,
  });

  if (tags.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">No tags for this file.</p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <SectionHeading
        title={
          deferredSearch.trim()
            ? `Tags (${filteredCount} of ${tags.length})`
            : `Tags (${tags.length})`
        }
        right={
          <Input
            type="search"
            placeholder="Filter tags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-48 text-sm"
          />
        }
      />
      <TagActionMenu>
        <div className="flex flex-wrap gap-0.5">
          {tags.map((tag, index) => {
            const isVisible = !filteredTagsSet || filteredTagsSet.has(tag);
            return (
              <TagActionBadge
                key={tag}
                displayTag={tag}
                className={cn(
                  "transition-opacity",
                  !isVisible && "pointer-events-none opacity-10",
                )}
                size="compact-mobile-wrap"
                triggerProps={rovingTriggers.getTriggerProps(index)}
              />
            );
          })}
        </div>
      </TagActionMenu>
    </div>
  );
}

export function InlineTagsListSkeleton({
  tagCount = 8,
  heading,
}: {
  tagCount?: number;
  heading?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4">
      {heading ?? <SectionHeading title="Tags" />}
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: tagCount }).map((_, i) => (
          <Skeleton
            key={i}
            className="h-6 rounded-4xl"
            style={{ width: `${60 + ((i * 17) % 60)}px` }}
          />
        ))}
      </div>
    </div>
  );
}
