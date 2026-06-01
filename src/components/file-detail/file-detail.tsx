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
import { SectionHeading } from "@/components/page-shell/section-heading";
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
  return (
    <>
      {/* Isolated side-effect trackers — re-renders here don't affect the rest */}
      <FileDetailTrackers
        fileId={fileId}
        trackLocalWatchHistory={trackLocalWatchHistory}
      />

      <div className="flex min-w-0 flex-1 flex-col gap-2 pb-12 sm:pb-16">
        <div className="relative -mx-4 sm:-mx-6">
          <FileViewer data={data} />
          {/* Ratings overlay on file viewer */}
          <div className="pointer-events-none absolute top-2 right-2 z-10 sm:top-3 sm:right-3">
            <RatingsOverlay item={data} size="lg" />
          </div>
        </div>
        <FilePageHeader fileId={fileId} />
        <Separator className="my-2" />
        <div className="flex items-center justify-between gap-2">
          <FileStatusBadges data={data} />
        </div>
        <Separator className="my-2" />

        <div className="@container flex flex-col gap-2">
          <SectionHeading title="File metadata" />
          <div className="grid gap-2 @lg:grid-cols-2">
            <ContentDetailsTable data={data} />
            <FileInfoTable data={data} />
          </div>
        </div>
        <Separator className="my-2" />
        <FileRatingsSection data={data} />
        <Separator className="my-2" />
        <FileNotesSection data={data} />
        <FileUrlsSection data={data} />
        {data.known_urls && data.known_urls.length > 0 && (
          <Separator className="my-2" />
        )}
        <div className="@container flex flex-col gap-2">
          <SectionHeading title="Viewing statistics" />
          <ViewingStatisticsTable statistics={data.file_viewing_statistics} />
        </div>
        <Separator className="my-2" />
        <InlineTagsList data={data} />
      </div>

      <PageHeaderActions>
        <FileViewerSettingsPopover mimeType={data.mime} />
      </PageHeaderActions>
      {/* Isolated footer — mutation isPending re-renders stay here */}
      <FileDetailFooter
        data={data}
        fileId={fileId}
        prependActions={prependActions}
      />
    </>
  );
}

/**
 * Isolates watch history tracking hooks so their store/query subscriptions
 * don't cause re-renders in the main content tree.
 */
function FileDetailTrackers({
  fileId,
  trackLocalWatchHistory,
}: {
  fileId: number;
  trackLocalWatchHistory: boolean;
}) {
  useLocalWatchHistoryTracker(fileId, trackLocalWatchHistory);
  useRemoteFileViewTimeTracker(fileId);
  return null;
}

/**
 * Isolates file action hooks (mutations, permissions, refetch) so that
 * isPending state changes only re-render the footer, not the entire page.
 */
function FileDetailFooter({
  data,
  fileId,
  prependActions,
}: {
  data: FileMetadata;
  fileId: number;
  prependActions?: Array<FloatingFooterAction>;
}) {
  const queryClient = useQueryClient();

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

  const combinedActions = prependActions
    ? [...prependActions, ...allActions]
    : allActions;

  return <PageFloatingFooter actions={combinedActions} />;
}
