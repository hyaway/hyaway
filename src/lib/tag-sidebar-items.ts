// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import type { TagItem } from "@/lib/tag-sidebar-types";
import type { FileMetadata } from "@/integrations/hydrus-api/models";
import { parseTag } from "@/lib/tag-utils";

export function createTagSidebarItems(
  items: ReadonlyArray<FileMetadata>,
  allTagsServiceId: string | undefined,
): Array<TagItem> {
  if (!allTagsServiceId || items.length === 0) return [];

  const counts: Record<string, number> = Object.create(null);

  // eslint-disable-next-line @typescript-eslint/prefer-for-of
  for (let i = 0; i < items.length; i++) {
    const displayTags =
      items[i].tags?.[allTagsServiceId]?.];

    if (!displayTags) continue;

    // eslint-disable-next-line @typescript-eslint/prefer-for-of
    for (let j = 0; j < displayTags.length; j++) {
      const displayTag = displayTags[j];
      if (displayTag) {
        counts[displayTag] = (counts[displayTag] || 0) + 1;
      }
    }
  }

  const keys = Object.keys(counts);
  const result: Array<TagItem> = new Array(keys.length);

  for (let i = 0; i < keys.length; i++) {
    const displayTag = keys[i];
    const count = counts[displayTag];
    const { namespace, tag } = parseTag(displayTag);
    result[i] = { tag, count, namespace };
  }

  return result;
}
