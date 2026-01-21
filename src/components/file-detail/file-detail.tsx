// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useCallback } from "react";
import { IconAlertCircle } from "@tabler/icons-react";
import { useQueryClient } from "@tanstack/react-query";

import { ContentDetailsTable } from "./content-details-table";
import { FileDetailSkeleton } from "./file-detail-skeleton";
import { FileInfoTable } from "./file-info-table";
import { FileNotesSection } from "./file-notes-section";
import { FilePageHeader } from "./file-page-header";
import { FileRatingsSection } from "./file-ratings-section";
import { FileStatusBadges } from "./file-status-badges";
import { FileUrlsSection } from "./file-urls-section";
import { FileViewer } from "./file-viewer";
import { FileViewerSettingsPopover } from "./file-viewer-settings-popover";
import { RatingsOverlay } from "./ratings-overlay";
import { ViewingStatisticsTable } from "./viewing-statistics-table";
import type { FloatingFooterAction } from "@/components/page-shell/page-floating-footer";
import type { FileMetadata } from "@/integrations/hydrus-api/models";
import { Alert, AlertTitle } from "@/components/ui-primitives/alert";
import { PageError } from "@/components/page-shell/page-error";
import { PageFloatingFooter } from "@/components/page-shell/page-floating-footer";
import { PageHeaderActions } from "@/components/page-shell/page-header-actions";
import { Heading } from "@/components/ui-primitives/heading";
import { Separator } from "@/components/ui-primitives/separator";
import { LOADING_ACTIONS, useFileActions } from "@/hooks/use-file-actions";
import {
  useLocalWatchHistoryTracker,
  useRemoteFileViewTimeTracker,
} from "@/hooks/use-watch-history-tracking";
import { useGetSingleFileMetadata } from "@/integrations/hydrus-api/queries/manage-files";
import { InlineTagsList } from "@/components/tag/inline-tags-list";

export interface FileDetailProps {
  fileId: number;
  /** Additional actions to prepend (e.g., prev/next navigation) */
  prependActions?: Array<FloatingFooterAction>;
  /** Whether to track this file view in history (default: true) */
  trackLocalWatchHistory?: boolean;
}

export function FileDetail({
  fileId,
  prependActions,
  trackLocalWatchHistory = true,
}: FileDetailProps) {
  const { data, isLoading, isError, error } = useGetSingleFileMetadata(fileId);

  if (isLoading) {
    return (
      <FileDetailSkeleton fileId={fileId} prependActions={prependActions} />
    );
  }

  if (isError) {
    return (
      <>
        <FilePageHeader fileId={fileId} />
        <PageError
          error={error}
          fallbackMessage="An unknown error occurred while fetching file."
        />
        <PageHeaderActions>
          <FileViewerSettingsPopover />
        </PageHeaderActions>
        <PageFloatingFooter
          actions={[...(prependActions ?? []), ...LOADING_ACTIONS]}
        />
      </>
    );
  }

  if (!data) {
    return (
      <>
        <FilePageHeader fileId={fileId} />
        <Alert variant="destructive">
          <IconAlertCircle />
          <AlertTitle>File not found</AlertTitle>
        </Alert>
        <PageHeaderActions>
          <FileViewerSettingsPopover />
        </PageHeaderActions>
        <PageFloatingFooter
          actions={[...(prependActions ?? []), ...LOADING_ACTIONS]}
        />
      </>
    );
  }

  return (
    <FileDetailContent
      data={data}
      fileId={fileId}
      prependActions={prependActions}
      trackLocalWatchHistory={trackLocalWatchHistory}
    />
  );
}

function FileDetailContent({
  data,
  fileId,
  prependActions,
  trackLocalWatchHistory,
}: {
  data: FileMetadata;
  fileId: number;
  prependActions?: Array<FloatingFooterAction>;
  trackLocalWatchHistory: boolean;
}) {
  const queryClient = useQueryClient();

  // Track file view in local watch history when component mounts
  // Respects both the page-level trackLocalWatchHistory prop and global enabled setting
  useLocalWatchHistoryTracker(fileId, trackLocalWatchHistory);

  // Track view time and sync to Hydrus (respects user settings internally)
  useRemoteFileViewTimeTracker(fileId);

  const handleRefetch = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: ["getSingleFileMetadata", fileId],
    });
  }, [queryClient, fileId]);

  const actionGroups = useFileActions(data, {
    includeExternal: true,
    includeThumbnail: false,
    onRefetch: handleRefetch,
  });
  const allActions = actionGroups.flatMap((g) => g.actions);

  // Combine prepended actions with file actions
  const combinedActions = prependActions
    ? [...prependActions, ...allActions]
    : allActions;

  return (
    <>
      <div className="flex min-w-0 flex-1 flex-col gap-2 pb-12 sm:pb-16">
        <div className="relative -mx-4 sm:-mx-6">
          <FileViewer data={data} />
          {/* Ratings overlay on file viewer */}
          <div className="pointer-events-none absolute top-2 right-2 z-10 sm:top-3 sm:right-3">
            <RatingsOverlay item={data} size="lg" />
          </div>
        </div>
        <FilePageHeader fileId={fileId} />
        <Separator className={"mt-4"} />
        <div className="flex items-center justify-between gap-2">
          <FileStatusBadges data={data} />
        </div>
        <Separator className={"mb-4"} />

        <div className="@container space-y-4">
          <Heading level={2}>File metadata</Heading>
          <div className="grid gap-4 @lg:grid-cols-2">
            <ContentDetailsTable data={data} />
            <FileInfoTable data={data} />
          </div>
        </div>
        <Separator className={"mt-2 mb-4"} />
        <FileRatingsSection data={data} />
        <Separator className={"mt-2 mb-4"} />
        <FileNotesSection data={data} />
        {data.notes && Object.keys(data.notes).length > 0 && (
          <Separator className={"mt-2 mb-4"} />
        )}
        <FileUrlsSection data={data} />
        {data.known_urls && data.known_urls.length > 0 && (
          <Separator className={"mt-2 mb-4"} />
        )}
        <div className="@container space-y-4">
          <Heading level={2}>Viewing statistics</Heading>
          <ViewingStatisticsTable statistics={data.file_viewing_statistics} />
        </div>
        <Separator className={"mt-2 mb-4"} />
        <InlineTagsList data={data} />
      </div>

      <PageHeaderActions>
        <FileViewerSettingsPopover mimeType={data.mime} />
      </PageHeaderActions>
      <PageFloatingFooter actions={combinedActions} />
    </>
  );
}
