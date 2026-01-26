// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useMemo, useState } from "react";
import type { ReactNode } from "react";

import type { FileMetadata } from "@/integrations/hydrus-api/models";
import { SectionHeading } from "@/components/page-shell/section-heading";
import { Input } from "@/components/ui-primitives/input";
import { Skeleton } from "@/components/ui-primitives/skeleton";
import { useAllKnownTagsServiceQuery } from "@/integrations/hydrus-api/queries/services";
import { TagStatus } from "@/integrations/hydrus-api/models";
import { TagBadgeFromString } from "@/components/tag/tag-badge";
import { compareTagStrings } from "@/lib/tag-utils";
import { cn } from "@/lib/utils";

export function InlineTagsList({ data }: { data: FileMetadata }) {
  const allTagsServiceId = useAllKnownTagsServiceQuery().data;
  const [search, setSearch] = useState("");

  const tags = useMemo(() => {
    if (!allTagsServiceId) return [];

    const displayTags =
      data.tags?.[allTagsServiceId]?.display_tags[TagStatus.CURRENT];

    if (!displayTags) return [];

    return [...displayTags].sort(compareTagStrings);
  }, [data, allTagsServiceId]);

  const filteredTagsSet = useMemo(() => {
    if (!search.trim()) return null;
    const searchLower = search.toLowerCase();
    return new Set(
      tags.filter((tag) => tag.toLowerCase().includes(searchLower)),
    );
  }, [tags, search]);

  const filteredCount = filteredTagsSet?.size ?? tags.length;

  if (tags.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">No tags for this file.</p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <SectionHeading
        title={
          search.trim()
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
      <div className="flex flex-wrap gap-0.5">
        {tags.map((tag) => {
          const isVisible = !filteredTagsSet || filteredTagsSet.has(tag);
          return (
            <TagBadgeFromString
              key={tag}
              displayTag={tag}
              className={cn(
                "transition-opacity",
                !isVisible && "pointer-events-none opacity-10",
              )}
            />
          );
        })}
      </div>
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
