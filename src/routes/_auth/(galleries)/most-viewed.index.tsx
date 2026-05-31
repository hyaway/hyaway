// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { createFileRoute, linkOptions } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useMostViewedSearchFooterAction } from "./-components/predefined-search-footer-action";
import { MostViewedSettingsPopover } from "./-components/most-viewed-settings-popover";
import type { FileLinkBuilder } from "@/components/thumbnail-gallery/thumbnail-gallery-item";
import { EmptyState } from "@/components/page-shell/empty-state";
import { PageError } from "@/components/page-shell/page-error";
import { PageFloatingFooter } from "@/components/page-shell/page-floating-footer";
import { PageHeaderActions } from "@/components/page-shell/page-header-actions";
import { PageHeading } from "@/components/page-shell/page-heading";
import { PageLoading } from "@/components/page-shell/page-loading";
import { RefetchButton } from "@/components/page-shell/refetch-button";
import { ThumbnailGalleryProvider } from "@/components/thumbnail-gallery/thumbnail-gallery-context";
import { ThumbnailGallery } from "@/components/thumbnail-gallery/thumbnail-gallery";
import { useHiddenFileView } from "@/hooks/use-hidden-file-view";
import { useMostViewedFilesQuery } from "@/integrations/hydrus-api/queries/search";

export const Route = createFileRoute("/_auth/(galleries)/most-viewed/")({
  component: RouteComponent,
});

const PAGE_TITLE = "Most viewed";

function RouteComponent() {
  const { data, isLoading, isFetching, isError, error } =
    useMostViewedFilesQuery();
  const queryClient = useQueryClient();
  const openSearchAction = useMostViewedSearchFooterAction();
  const fileIds = data?.file_ids ?? [];
  const reviewSource = { type: "predefinedSearch", key: "mostViewed" } as const;
  const { hiddenFileIds, visibleFileIds, hiddenLabel, showHiddenFilesAction } =
    useHiddenFileView({ data, fileIds, source: reviewSource });

  // Link builder for contextual navigation
  const getFileLink: FileLinkBuilder = (fileId) =>
    linkOptions({
      to: "/most-viewed/$fileId",
      params: { fileId: String(fileId) },
    });

  const refetchButton = (
    <RefetchButton
      isFetching={isFetching}
      onRefetch={() =>
        queryClient.invalidateQueries({
          queryKey: ["searchFiles", "mostViewed"],
        })
      }
    />
  );

  if (isLoading) {
    return (
      <>
        <PageLoading title={PAGE_TITLE} />
        <PageHeaderActions>
          <MostViewedSettingsPopover />
        </PageHeaderActions>
        <PageFloatingFooter
          leftContent={refetchButton}
          actions={[openSearchAction]}
        />
      </>
    );
  }

  if (isError) {
    return (
      <>
        <>
          <PageHeading title={PAGE_TITLE} />
          <PageError
            error={error}
            fallbackMessage="An unknown error occurred while fetching most viewed files."
          />
        </>
        <PageHeaderActions>
          <MostViewedSettingsPopover />
        </PageHeaderActions>
        <PageFloatingFooter
          leftContent={refetchButton}
          actions={[openSearchAction]}
        />
      </>
    );
  }

  return (
    <>
      <>
        <PageHeading
          title={`Most viewed (${visibleFileIds.length} files${hiddenLabel ? `, ${hiddenLabel}` : ""})`}
        />
        {visibleFileIds.length > 0 ? (
          <ThumbnailGalleryProvider
            infoMode="views"
            fileIds={visibleFileIds}
            reviewSource={reviewSource}
          >
            <ThumbnailGallery
              fileIds={fileIds}
              hiddenFileIds={hiddenFileIds}
              getFileLink={getFileLink}
            />
          </ThumbnailGalleryProvider>
        ) : (
          <EmptyState message="No files with view counts found." />
        )}
      </>
      <PageHeaderActions>
        <MostViewedSettingsPopover />
      </PageHeaderActions>
      <PageFloatingFooter
        leftContent={refetchButton}
        actions={[
          ...(showHiddenFilesAction ? [showHiddenFilesAction] : []),
          openSearchAction,
        ]}
      />
    </>
  );
}
