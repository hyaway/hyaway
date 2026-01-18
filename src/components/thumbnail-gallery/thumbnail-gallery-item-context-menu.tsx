// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useNavigate } from "@tanstack/react-router";
import { IconCards, IconClockX, IconExternalLink } from "@tabler/icons-react";

import { useThumbnailGalleryContext } from "./thumbnail-gallery-context";

import type { FileMetadata } from "@/integrations/hydrus-api/models";

import { CanvasType } from "@/integrations/hydrus-api/models";

import {
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
} from "@/components/ui-primitives/context-menu";
import { useFileActions } from "@/hooks/use-file-actions";
import {
  useClearFileViewsMutation,
  useClearFileViewtimeMutation,
} from "@/integrations/hydrus-api/queries/manage-files";
import {
  useReviewQueueActions,
  useReviewQueueRemaining,
} from "@/stores/review-queue-store";

interface ThumbnailGalleryItemContextMenuProps {
  item: Pick<
    FileMetadata,
    | "file_id"
    | "is_inbox"
    | "is_trashed"
    | "is_deleted"
    | "ext"
    | "filetype_human"
    | "mime"
    | "file_viewing_statistics"
  >;
  /** Index of this item in the gallery (for review from here) */
  itemIndex?: number;
}

/** Get Client API viewing statistics from file metadata */
function getClientApiStats(item: ThumbnailGalleryItemContextMenuProps["item"]) {
  return item.file_viewing_statistics?.find(
    (stat) => stat.canvas_type === CanvasType.CLIENT_API,
  );
}

export function ThumbnailGalleryItemContextMenu({
  item,
  itemIndex,
}: ThumbnailGalleryItemContextMenuProps) {
  const navigate = useNavigate();
  const { setQueue, addToQueue } = useReviewQueueActions();
  const queueRemaining = useReviewQueueRemaining();
  const { fileIds, infoMode } = useThumbnailGalleryContext();

  const clearViewtimeMutation = useClearFileViewtimeMutation();
  const clearViewsMutation = useClearFileViewsMutation();

  const actionGroups = useFileActions(item, {
    includeOpen: true,
    includeExternal: true,
  });

  // Get file IDs from this item onward
  const fileIdsFromHere =
    fileIds && itemIndex !== undefined
      ? fileIds.slice(itemIndex)
      : [item.file_id];

  // Get current Client API stats for preserving values
  const clientApiStats = getClientApiStats(item);

  const handleNewReview = () => {
    setQueue(fileIdsFromHere);
    navigate({ to: "/review" });
  };

  const handleAddToReview = () => {
    addToQueue(fileIdsFromHere);
    navigate({ to: "/review" });
  };

  const handleClearViewtime = () => {
    clearViewtimeMutation.mutate({
      fileId: item.file_id,
      currentViews: clientApiStats?.views ?? 0,
    });
  };

  const handleClearViews = () => {
    clearViewsMutation.mutate({
      fileId: item.file_id,
      currentViewtime: clientApiStats?.viewtime ?? 0,
    });
  };

  // Show clear actions based on infoMode
  const showClearViewtime = infoMode === "viewtime";
  const showClearViews = infoMode === "views";

  return (
    <ContextMenuContent
      className={
        "bg-popover/95 supports-backdrop-filter:bg-popover/75 backdrop-blur-sm"
      }
    >
      {/* Review actions */}
      <ContextMenuItem onClick={handleNewReview}>
        <IconCards />
        {fileIdsFromHere.length > 1 ? "New review from here" : "New review"}
      </ContextMenuItem>
      {queueRemaining > 0 && (
        <ContextMenuItem onClick={handleAddToReview}>
          <IconCards />
          {fileIdsFromHere.length > 1
            ? "Add to review from here"
            : "Add to review"}
        </ContextMenuItem>
      )}

      {/* Clear viewtime/views actions based on infoMode */}
      {(showClearViewtime || showClearViews) && <ContextMenuSeparator />}
      {showClearViewtime && (
        <ContextMenuItem
          onClick={handleClearViewtime}
          variant="destructive"
          disabled={clearViewtimeMutation.isPending}
        >
          <IconClockX />
          Clear API viewtime
        </ContextMenuItem>
      )}
      {showClearViews && (
        <ContextMenuItem
          onClick={handleClearViews}
          variant="destructive"
          disabled={clearViewsMutation.isPending}
        >
          <IconClockX />
          Clear API views
        </ContextMenuItem>
      )}

      {actionGroups.length > 0 && <ContextMenuSeparator />}

      {actionGroups.map((group, groupIndex) => (
        <div key={group.id}>
          {groupIndex > 0 && <ContextMenuSeparator />}
          {group.actions.map((action) => (
            <ContextMenuItem
              key={action.id}
              onClick={action.disabled ? undefined : action.onClick}
              variant={action.variant}
              disabled={action.disabled}
            >
              <action.icon />
              {action.label}
              {action.external && (
                <IconExternalLink className="ml-auto opacity-50" />
              )}
            </ContextMenuItem>
          ))}
        </div>
      ))}
    </ContextMenuContent>
  );
}
