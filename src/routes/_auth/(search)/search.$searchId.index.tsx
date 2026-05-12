// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { IconCopy, IconEraser, IconPin, IconTrash } from "@tabler/icons-react";
import {
  createFileRoute,
  linkOptions,
  useNavigate,
} from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { SearchQueryBuilder } from "./-components/system-predicate-builder";
import {
  committedSearchQueryKey,
  useCommittedSearchFilesQuery,
} from "./-hooks/use-committed-search-query";
import { queryToHydrusSearch } from "./-lib/query-to-hydrus-search";
import { getSortLabel } from "./-lib/query-builder-fields";
import { SearchSettingsPopover } from "./-components/search-settings-popover";
import type { FileLinkBuilder } from "@/components/thumbnail-gallery/thumbnail-gallery-item";
import type { FloatingFooterAction } from "@/components/page-shell/page-floating-footer";
import { copySearchCache, generateSearchId } from "@/lib/search-entry-utils";
import { EmptyState } from "@/components/page-shell/empty-state";
import { PageError } from "@/components/page-shell/page-error";
import { PageFloatingFooter } from "@/components/page-shell/page-floating-footer";
import { PageHeaderActions } from "@/components/page-shell/page-header-actions";
import { PageHeading } from "@/components/page-shell/page-heading";
import { RefetchButton } from "@/components/page-shell/refetch-button";
import { ThumbnailGallery } from "@/components/thumbnail-gallery/thumbnail-gallery";
import { ThumbnailGalleryProvider } from "@/components/thumbnail-gallery/thumbnail-gallery-context";
import { ThumbnailGallerySkeleton } from "@/components/thumbnail-gallery/thumbnail-gallery-skeleton";
import { useReviewActions } from "@/hooks/use-review-actions";
import { SearchTagList } from "@/components/tag/tag-badge";
import {
  useCommittedSearch,
  useSearchDisplayName,
  useSearchQueriesActions,
  useSearchQueryEntry,
} from "@/stores/search-queries-store";
import { useSearchSettingsActions } from "@/stores/search-settings-store";

export const Route = createFileRoute("/_auth/(search)/search/$searchId/")({
  component: SearchPage,
});

function SearchPage() {
  const { searchId } = Route.useParams();
  const displayName = useSearchDisplayName(searchId);
  const committed = useCommittedSearch(searchId);
  const { saveAs, remove } = useSearchQueriesActions();
  const entry = useSearchQueryEntry(searchId);
  const { setDefaultQuery } = useSearchSettingsActions();
  const navigate = useNavigate();
  const [preserveCurrentScroll, setPreserveCurrentScroll] = useState(false);

  const searchTags = useMemo(
    () => (committed ? queryToHydrusSearch(committed.query) : []),
    [committed],
  );

  const { data, isLoading, isFetching, isError, error } =
    useCommittedSearchFilesQuery(searchId);
  const queryClient = useQueryClient();

  const fileIds = data?.file_ids ?? [];
  const hasFiles = fileIds.length > 0;
  const reviewActions = useReviewActions({ fileIds });

  const handleCommit = () => {
    setPreserveCurrentScroll(true);
  };

  const getFileLink: FileLinkBuilder = (fileId) =>
    linkOptions({
      to: "/search/$searchId/$fileId",
      params: { searchId, fileId: String(fileId) },
    });

  const refetchButton = (
    <RefetchButton
      isFetching={isFetching}
      onRefetch={() =>
        queryClient.invalidateQueries({
          queryKey: committedSearchQueryKey(searchId),
        })
      }
    />
  );

  const handleSaveAsNew = useCallback(() => {
    const newId = generateSearchId(displayName);
    saveAs(searchId, newId);
    copySearchCache(queryClient, searchId, newId);
    navigate({ to: "/search/$searchId", params: { searchId: newId } });
  }, [searchId, saveAs, navigate, queryClient]);

  const handleDelete = useCallback(() => {
    remove(searchId);
    navigate({ to: "/search" });
  }, [searchId, remove, navigate]);

  const handleSavePendingAsDefault = useCallback(() => {
    setDefaultQuery(entry.staged);
  }, [entry.staged, setDefaultQuery]);

  const handleSaveActiveAsDefault = useCallback(() => {
    if (committed) setDefaultQuery(committed);
  }, [committed, setDefaultQuery]);

  const searchActions = useMemo((): Array<FloatingFooterAction> => {
    return [
      {
        id: "save-pending-as-default",
        label: "Save next as default",
        icon: IconPin,
        onClick: handleSavePendingAsDefault,
        overflowOnly: true,
      },
      {
        id: "save-active-as-default",
        label: "Save current as default",
        icon: IconPin,
        onClick: handleSaveActiveAsDefault,
        disabled: !committed,
        overflowOnly: true,
      },
      {
        id: "clone-search",
        label: "Clone",
        icon: IconCopy,
        onClick: handleSaveAsNew,
        overflowOnly: true,
      },
      {
        id: "delete-search",
        label: "Delete",
        icon: IconTrash,
        onClick: handleDelete,
        variant: "destructive" as const,
        overflowOnly: true,
      },
    ];
  }, [
    handleSavePendingAsDefault,
    handleSaveActiveAsDefault,
    handleSaveAsNew,
    handleDelete,
  ]);

  const fileCount = data?.file_ids?.length ?? 0;

  const activeLabel = isLoading
    ? "Current search (loading)"
    : isError
      ? "Current search"
      : `Current search (found ${fileCount} files)`;

  return (
    <>
      <>
        <PageHeading title={displayName} />
        <div className="flex flex-col gap-2 pb-2">
          <SearchQueryBuilder entryKey={searchId} onCommit={handleCommit} />
        </div>
        {searchTags.length > 0 && (
          <div className="flex flex-col gap-1.5 pt-3 pb-3">
            <span className="text-muted-foreground text-sm font-medium">
              {activeLabel}
            </span>
            <SearchTagList
              tags={searchTags}
              sortLabel={
                committed
                  ? getSortLabel(
                      committed.sort.sortType,
                      committed.sort.sortAsc,
                    )
                  : undefined
              }
            />
          </div>
        )}
        {isLoading && searchTags.length > 0 && <ThumbnailGallerySkeleton />}
        {isError && committed && (
          <PageError
            error={error}
            fallbackMessage="An unknown error occurred while searching."
          />
        )}
        {!isLoading && !isError && hasFiles && (
          <ThumbnailGalleryProvider fileIds={fileIds}>
            <ThumbnailGallery
              fileIds={fileIds}
              getFileLink={getFileLink}
              preserveCurrentScroll={preserveCurrentScroll}
            />
          </ThumbnailGalleryProvider>
        )}
        {!isLoading && !isError && !hasFiles && searchTags.length > 0 && (
          <EmptyState message="No files found for the current search." />
        )}
        {!isLoading && !isError && !hasFiles && searchTags.length === 0 && (
          <EmptyState message="Add filters above and click Search." />
        )}
      </>
      <PageHeaderActions>
        <SearchSettingsPopover />
      </PageHeaderActions>
      <PageFloatingFooter
        leftContent={refetchButton}
        actions={[...reviewActions, ...searchActions]}
      />
    </>
  );
}
