// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { createFileRoute, linkOptions } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { IconArrowsShuffle, IconEye } from "@tabler/icons-react";
import { useRandomInboxSearchFooterAction } from "./-components/predefined-search-footer-action";
import { RandomInboxSettingsPopover } from "./-components/random-inbox-settings-popover";
import type { FileLinkBuilder } from "@/components/thumbnail-gallery/thumbnail-gallery-item";
import type { FloatingFooterAction } from "@/components/page-shell/page-floating-footer";
import { EmptyState } from "@/components/page-shell/empty-state";
import { PageError } from "@/components/page-shell/page-error";
import { PageFloatingFooter } from "@/components/page-shell/page-floating-footer";
import { PageHeaderActions } from "@/components/page-shell/page-header-actions";
import { PageHeading } from "@/components/page-shell/page-heading";
import { PageLoading } from "@/components/page-shell/page-loading";
import { ThumbnailGallery } from "@/components/thumbnail-gallery/thumbnail-gallery";
import { ThumbnailGalleryProvider } from "@/components/thumbnail-gallery/thumbnail-gallery-context";
import { BottomNavButton } from "@/components/ui-primitives/bottom-nav-button";
import { useReviewActions } from "@/hooks/use-review-actions";
import {
  clearHiddenFileIdsInViewCaches,
  formatHiddenFileCount,
  getHiddenFileCount,
  getHiddenFileIds,
  getVisibleFileIds,
} from "@/integrations/hydrus-api/queries/file-metadata-cache";
import { useRandomInboxFilesQuery } from "@/integrations/hydrus-api/queries/search";

export const Route = createFileRoute("/_auth/(galleries)/random-inbox/")({
  component: RouteComponent,
});

const PAGE_TITLE = "Random inbox";

function RouteComponent() {
  const { data, isLoading, isError, error } = useRandomInboxFilesQuery();
  const queryClient = useQueryClient();

  const fileIds = data?.file_ids ?? [];
  const hiddenFileIds = getHiddenFileIds(data);
  const visibleFileIds = getVisibleFileIds(fileIds, data);
  const hasFiles = visibleFileIds.length > 0;
  const hiddenLabel = formatHiddenFileCount(getHiddenFileCount(data));
  const reviewActions = useReviewActions({
    fileIds: visibleFileIds,
    source: { type: "predefinedSearch", key: "randomInbox" },
  });
  const openSearchAction = useRandomInboxSearchFooterAction();
  const unhideAction: FloatingFooterAction | null =
    hiddenFileIds.length > 0
      ? {
          id: "unhide-files",
          label: "Unhide files",
          icon: IconEye,
          onClick: () =>
            clearHiddenFileIdsInViewCaches(queryClient, {
              type: "predefinedSearch",
              key: "randomInbox",
            }),
          overflowOnly: true,
        }
      : null;

  // Link builder for contextual navigation
  const getFileLink: FileLinkBuilder = (fileId) =>
    linkOptions({
      to: "/random-inbox/$fileId",
      params: { fileId: String(fileId) },
    });

  const handleShuffle = () => {
    queryClient.resetQueries({
      queryKey: ["searchFiles", "randomInbox"],
    });
  };

  const shuffleButton = (
    <BottomNavButton
      key="shuffle"
      label="Shuffle"
      icon={<IconArrowsShuffle className="size-6" />}
      onClick={handleShuffle}
      isLoading={isLoading}
      disabled={isError}
    />
  );

  if (isLoading) {
    return (
      <>
        <PageLoading title={PAGE_TITLE} />
        <PageHeaderActions>
          <RandomInboxSettingsPopover />
        </PageHeaderActions>
        <PageFloatingFooter
          leftContent={shuffleButton}
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
            fallbackMessage="An unknown error occurred while fetching random inbox files."
          />
        </>
        <PageHeaderActions>
          <RandomInboxSettingsPopover />
        </PageHeaderActions>
        <PageFloatingFooter
          leftContent={shuffleButton}
          actions={[openSearchAction]}
        />
      </>
    );
  }

  return (
    <>
      <>
        <PageHeading
          title={`Random inbox (${visibleFileIds.length} files${hiddenLabel ? `, ${hiddenLabel}` : ""})`}
        />
        {hasFiles ? (
          <ThumbnailGalleryProvider
            fileIds={visibleFileIds}
            reviewSource={{ type: "predefinedSearch", key: "randomInbox" }}
          >
            <ThumbnailGallery
              fileIds={fileIds}
              hiddenFileIds={hiddenFileIds}
              getFileLink={getFileLink}
            />
          </ThumbnailGalleryProvider>
        ) : (
          <EmptyState message="No inbox files found." />
        )}
      </>
      <PageHeaderActions>
        <RandomInboxSettingsPopover />
      </PageHeaderActions>
      <PageFloatingFooter
        leftContent={shuffleButton}
        actions={[
          ...reviewActions,
          ...(unhideAction ? [unhideAction] : []),
          openSearchAction,
        ]}
      />
    </>
  );
}
