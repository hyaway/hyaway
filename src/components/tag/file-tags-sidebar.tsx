// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useMemo } from "react";
import { FileTagsSidebarSortControls } from "./file-tags-sidebar-sort-controls";
import { useFileTagsDisplaySortMode } from "@/components/settings/file-tags-settings";
import { RightSidebarPortal } from "@/components/app-shell/right-sidebar-portal";
import { TagsSidebar } from "@/components/tag/tags-sidebar";
import { useGetSingleFileMetadata } from "@/integrations/hydrus-api/queries/manage-files";
import { useAllKnownTagsServiceQuery } from "@/integrations/hydrus-api/queries/services";
import { useFileTagsFilter } from "@/components/tag/file-tags-filter-context";
import { createTagItems } from "@/lib/tag-sidebar-items";
import { sortTagItems } from "@/lib/tag-sidebar-sort";

interface FileTagsSidebarProps {
  fileId: number;
}

/**
 * Mounts the current file's tags into the app's right sidebar
 * (read-only).
 */
export function FileTagsSidebar({ fileId }: FileTagsSidebarProps) {
  const { data: currentMetadata } = useGetSingleFileMetadata(fileId);
  const allTagsServiceId = useAllKnownTagsServiceQuery().data;
  const fileSortMode = useFileTagsDisplaySortMode();
  const { filterValue, setFilterValue } = useFileTagsFilter();

  const tags = useMemo(() => {
    if (!currentMetadata) return [];

    return sortTagItems(
      createTagItems([currentMetadata], allTagsServiceId),
      fileSortMode,
    );
  }, [allTagsServiceId, currentMetadata, fileSortMode]);

  const itemsCount = currentMetadata ? 1 : 0;

  return (
    <RightSidebarPortal>
      <TagsSidebar
        tags={tags}
        itemsCount={itemsCount}
        title="File tags"
        showIndex={false}
        headerControls={<FileTagsSidebarSortControls />}
        searchValue={filterValue}
        onSearchChange={setFilterValue}
      />
    </RightSidebarPortal>
  );
}
