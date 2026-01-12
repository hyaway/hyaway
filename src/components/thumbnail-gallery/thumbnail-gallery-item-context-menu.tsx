import { useNavigate } from "@tanstack/react-router";
import { IconCards, IconExternalLink } from "@tabler/icons-react";

import { useThumbnailGalleryContext } from "./thumbnail-gallery-context";
import type { FileMetadata } from "@/integrations/hydrus-api/models";

import {
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
} from "@/components/ui-primitives/context-menu";
import { useFileActions } from "@/hooks/use-file-actions";
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
  >;
  /** Index of this item in the gallery (for review from here) */
  itemIndex?: number;
}

export function ThumbnailGalleryItemContextMenu({
  item,
  itemIndex,
}: ThumbnailGalleryItemContextMenuProps) {
  const navigate = useNavigate();
  const { setQueue, addToQueue } = useReviewQueueActions();
  const queueRemaining = useReviewQueueRemaining();
  const { fileIds } = useThumbnailGalleryContext();

  const actionGroups = useFileActions(item, {
    includeOpen: true,
    includeExternal: true,
  });

  // Get file IDs from this item onward
  const fileIdsFromHere =
    fileIds && itemIndex !== undefined
      ? fileIds.slice(itemIndex)
      : [item.file_id];

  const handleNewReview = () => {
    setQueue(fileIdsFromHere);
    navigate({ to: "/review" });
  };

  const handleAddToReview = () => {
    addToQueue(fileIdsFromHere);
    navigate({ to: "/review" });
  };

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
