// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { IconCopy, IconEraser, IconTrash } from "@tabler/icons-react";
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
import { copySearchCache, generateCloneId } from "./-lib/search-entry-utils";
import { SearchSettingsPopover } from "./-components/search-settings-popover";
import type { FileLinkBuilder } from "@/components/thumbnail-gallery/thumbnail-gallery-item";
import type { FloatingFooterAction } from "@/components/page-shell/page-floating-footer";
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
  useSearchQueriesActions,
} from "@/stores/search-queries-store";

export const Route = createFileRoute("/_auth/(search)/search/$searchId/")({
  component: SearchPage,
});

function SearchPage() {
  const { searchId } = Route.useParams();
  const committed = useCommittedSearch(searchId);
  const { saveAs, remove } = useSearchQueriesActions();
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
    const newId = generateCloneId(searchId);
    saveAs(searchId, newId);
    copySearchCache(queryClient, searchId, newId);
    navigate({ to: "/search/$searchId", params: { searchId: newId } });
  }, [searchId, saveAs, navigate, queryClient]);

  const handleDelete = useCallback(() => {
    remove(searchId);
    navigate({ to: "/search" });
  }, [searchId, remove, navigate]);

  const handleErase = useCallback(() => {
    remove(searchId);
  }, [searchId, remove]);

  const searchActions = useMemo((): Array<FloatingFooterAction> => {
    return [
      {
        id: "clone-search",
        label: "Clone",
        icon: IconCopy,
        onClick: handleSaveAsNew,
        overflowOnly: true,
      },
      {
        id: "erase-search",
        label: "Erase",
        icon: IconEraser,
        onClick: handleErase,
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
  }, [handleSaveAsNew, handleErase, handleDelete]);

  const pageTitle = `Search ${searchId}`;

  const title = isLoading
    ? pageTitle
    : isError
      ? pageTitle
      : `${pageTitle} (${data?.file_ids?.length ?? 0} files)`;

  return (
    <>
      <>
        <PageHeading title={title} />
        <div className="flex flex-col gap-2 pb-2">
          <SearchQueryBuilder entryKey={searchId} onCommit={handleCommit} />
        </div>
        {searchTags.length > 0 && (
          <div className="flex flex-col gap-1.5 pt-3 pb-3">
            <span className="text-muted-foreground text-sm font-medium">
              Active search
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
