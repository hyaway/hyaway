import { useMemo, useState } from "react";

import type { FileMetadata } from "@/integrations/hydrus-api/models";
import { Heading } from "@/components/ui-primitives/heading";
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
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Heading level={2}>
          Tags{" "}
          {search.trim()
            ? `(${filteredCount} of ${tags.length})`
            : `(${tags.length})`}
        </Heading>
        <Input
          type="search"
          placeholder="Filter tags..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 w-48 text-sm"
        />
      </div>
      <div className="flex flex-wrap">
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
}: {
  tagCount?: number;
}) {
  return (
    <div className="space-y-4">
      <Heading level={2}>Tags</Heading>
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
