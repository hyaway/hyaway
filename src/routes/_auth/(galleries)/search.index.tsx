// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { createFileRoute, linkOptions } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { SearchQueryBuilder } from "./-components/system-predicate-builder";
import {
  committedSearchQueryKey,
  useCommittedSearchFilesQuery,
} from "./-hooks/use-committed-search-query";
import { queryToHydrusSearch } from "./-lib/query-to-hydrus-search";
import { SearchSettingsPopover } from "./-components/search-settings-popover";
import type { FileLinkBuilder } from "@/components/thumbnail-gallery/thumbnail-gallery-item";
import { EmptyState } from "@/components/page-shell/empty-state";
import { PageError } from "@/components/page-shell/page-error";
import { PageFloatingFooter } from "@/components/page-shell/page-floating-footer";
import { PageHeaderActions } from "@/components/page-shell/page-header-actions";
import { PageHeading } from "@/components/page-shell/page-heading";
import { PageLoading } from "@/components/page-shell/page-loading";
import { RefetchButton } from "@/components/page-shell/refetch-button";
import { ThumbnailGallery } from "@/components/thumbnail-gallery/thumbnail-gallery";
import { ThumbnailGalleryProvider } from "@/components/thumbnail-gallery/thumbnail-gallery-context";
import { useReviewActions } from "@/hooks/use-review-actions";
import { SearchTagList } from "@/components/tag/tag-badge";

import {
  PRIMARY_SEARCH_KEY,
  useCommittedSearch,
} from "@/stores/search-queries-store";

export const Route = createFileRoute("/_auth/(galleries)/search/")({
  component: SearchIndex,
});

function SearchIndex() {
  const committed = useCommittedSearch(PRIMARY_SEARCH_KEY);
  const [preserveCurrentScroll, setPreserveCurrentScroll] = useState(false);

  const searchTags = useMemo(
    () => (committed ? queryToHydrusSearch(committed.query) : []),
    [committed],
  );

  const { data, isLoading, isFetching, isError, error } =
    useCommittedSearchFilesQuery(PRIMARY_SEARCH_KEY);
  const queryClient = useQueryClient();

  const fileIds = data?.file_ids ?? [];
  const hasFiles = fileIds.length > 0;
  const reviewActions = useReviewActions({ fileIds });

  const handleCommit = () => {
    setPreserveCurrentScroll(true);
  };

  const getFileLink: FileLinkBuilder = (fileId) =>
    linkOptions({
      to: "/search/$fileId",
      params: { fileId: String(fileId) },
    });

  const refetchButton = (
    <RefetchButton
      isFetching={isFetching}
      onRefetch={() =>
        queryClient.invalidateQueries({
          queryKey: committedSearchQueryKey(PRIMARY_SEARCH_KEY),
        })
      }
    />
  );

  const pageTitle = "Search";

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
          <SearchQueryBuilder
            entryKey={PRIMARY_SEARCH_KEY}
            onCommit={handleCommit}
          />
        </div>
        {searchTags.length > 0 && (
          <div className="flex flex-col gap-1.5 pt-3 pb-3">
            <span className="text-muted-foreground text-sm font-medium">
              Active search
            </span>
            <SearchTagList tags={searchTags} />
          </div>
        )}
        {isLoading && searchTags.length > 0 && <PageLoading title={title} />}
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
      <PageFloatingFooter leftContent={refetchButton} actions={reviewActions} />
    </>
  );
}
