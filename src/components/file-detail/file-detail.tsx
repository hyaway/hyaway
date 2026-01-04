import { useEffect } from "react";
import { IconAlertCircle } from "@tabler/icons-react";

import { ContentDetailsTable } from "./content-details-table";
import { FileDetailSkeleton } from "./file-detail-skeleton";
import { FileInfoTable } from "./file-info-table";
import { FilePageHeader } from "./file-page-header";
import { FileStatusBadges } from "./file-status-badges";
import { FileViewer } from "./file-viewer";
import { FileViewerSettingsPopover } from "./file-viewer-settings-popover";
import type { FloatingFooterAction } from "@/components/page-shell/page-floating-footer";
import type { FileMetadata } from "@/integrations/hydrus-api/models";
import { Alert, AlertTitle } from "@/components/ui-primitives/alert";
import { PageError } from "@/components/page-shell/page-error";
import { PageFloatingFooter } from "@/components/page-shell/page-floating-footer";
import { Heading } from "@/components/ui-primitives/heading";
import { Separator } from "@/components/ui-primitives/separator";
import { LOADING_ACTIONS, useFileActions } from "@/hooks/use-file-actions";
import { useRemoteFileViewTimeTracker } from "@/hooks/use-file-view-time-tracker";
import { useGetSingleFileMetadata } from "@/integrations/hydrus-api/queries/manage-files";
import {
  useWatchHistoryActions,
  useWatchHistoryEnabled,
} from "@/stores/watch-history-store";
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
        <PageFloatingFooter
          actions={[...(prependActions ?? []), ...LOADING_ACTIONS]}
          rightContent={<FileViewerSettingsPopover />}
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
        <PageFloatingFooter
          actions={[...(prependActions ?? []), ...LOADING_ACTIONS]}
          rightContent={<FileViewerSettingsPopover />}
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
  const { addViewedFile } = useWatchHistoryActions();
  const historyEnabled = useWatchHistoryEnabled();

  // Track file view when component mounts with valid data
  // Respects both the page-level trackLocalWatchHistory prop and global enabled setting
  useEffect(() => {
    if (trackLocalWatchHistory && historyEnabled) {
      addViewedFile(fileId);
    }
  }, [fileId, addViewedFile, trackLocalWatchHistory, historyEnabled]);

  // Track view time and sync to Hydrus (respects user settings internally)
  useRemoteFileViewTimeTracker(fileId);

  const actionGroups = useFileActions(data, {
    includeExternal: true,
    includeThumbnail: false,
  });
  const allActions = actionGroups.flatMap((g) => g.actions);

  // Combine prepended actions with file actions
  const combinedActions = prependActions
    ? [...prependActions, ...allActions]
    : allActions;

  return (
    <>
      <div className="flex min-w-0 flex-1 flex-col gap-2 pb-12 sm:pb-16">
        <FileViewer data={data} />
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
        <InlineTagsList data={data} />
      </div>

      <PageFloatingFooter
        actions={combinedActions}
        rightContent={<FileViewerSettingsPopover />}
      />
    </>
  );
}
