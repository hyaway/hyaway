// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { memo, useDeferredValue, useMemo } from "react";
import type { FileMetadata } from "@/integrations/hydrus-api/models";
import type { TagItem } from "@/lib/tag-sidebar-types";
import {
  ThumbnailGalleryTagsSidebarSortControls,
  useThumbnailGalleryTagsSidebarSortMode,
} from "@/components/tag/thumbnail-gallery-tags-sidebar-sort-controls";
import { TagsSidebar } from "@/components/tag/tags-sidebar";
import { useAllKnownTagsServiceQuery } from "@/integrations/hydrus-api/queries/services";
import { createTagSidebarItems } from "@/lib/tag-sidebar-items";
import { sortTagItems } from "@/lib/tag-sidebar-sort";

export const ThumbnailGalleryTagsSidebar = memo(
  function ThumbnailGalleryTagsSidebarMemo({
    items,
    title = "Tags",
    showIndex = true,
  }: {
    items: Array<FileMetadata>;
    title?: string;
    showIndex?: boolean;
  }) {
    const allTagsServiceId = useAllKnownTagsServiceQuery().data;
    const sortMode = useThumbnailGalleryTagsSidebarSortMode();

    // Defer heavy computation so UI stays responsive
    const deferredItems = useDeferredValue(items);
    const deferredSortMode = useDeferredValue(sortMode);

    const tags = useMemo((): Array<TagItem> => {
      const result = createTagSidebarItems(deferredItems, allTagsServiceId);
      return sortTagItems(result, deferredSortMode);
    }, [deferredItems, allTagsServiceId, deferredSortMode]);

    return (
      <TagsSidebar
        tags={tags}
        itemsCount={deferredItems.length}
        title={title}
        showIndex={showIndex}
        headerControls={<ThumbnailGalleryTagsSidebarSortControls />}
      />
    );
  },
);
