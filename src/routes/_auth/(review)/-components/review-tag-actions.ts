// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import type { TagRestoreEntry } from "@/stores/review-queue-store";
import type {
  TagSwipeActionType,
  ValidSecondarySwipeAction,
} from "@/stores/review-settings-store";
import type {
  FileMetadata,
  FileTagUpdate,
  UpdateFileTagsOptions,
} from "@/integrations/hydrus-api/models";
import { ContentUpdateAction } from "@/integrations/hydrus-api/models";
import { getTagActionStateChange } from "@/integrations/hydrus-api/queries/tags";

/** Mutation function signature for tag operations */
type TagMutate = (args: UpdateFileTagsOptions) => void;

function getContentUpdateAction(actionType: TagSwipeActionType) {
  switch (actionType) {
    case "add":
      return ContentUpdateAction.ADD;
    case "remove":
      return ContentUpdateAction.DELETE;
    default:
      actionType satisfies never;
      return ContentUpdateAction.ADD;
  }
}

export function getReverseContentUpdateAction(actionType: TagSwipeActionType) {
  switch (actionType) {
    case "add":
      return ContentUpdateAction.DELETE;
    case "remove":
      return ContentUpdateAction.ADD;
    default:
      actionType satisfies never;
      return ContentUpdateAction.ADD;
  }
}

export function executeSecondaryTagActions(
  secondaryActions: Array<ValidSecondarySwipeAction>,
  fileId: number,
  metadata: FileMetadata | undefined,
  validLocalTagServiceKeys: Set<string>,
  canEditTags: boolean,
  updateTags: TagMutate,
): Array<TagRestoreEntry> {
  const restoreEntries: Array<TagRestoreEntry> = [];
  const tagUpdates: Array<FileTagUpdate> = [];
  if (!canEditTags || !metadata) return restoreEntries;

  for (const action of secondaryActions) {
    switch (action.actionType) {
      case "rating":
        continue;
      case "tag":
        break;
      default:
        action satisfies never;
    }

    if (!validLocalTagServiceKeys.has(action.serviceKey)) continue;

    const contentAction = getContentUpdateAction(action.type);
    const { changed } = getTagActionStateChange(
      metadata,
      action.serviceKey,
      action.tag,
      contentAction,
    );
    if (!changed) continue;

    restoreEntries.push({
      serviceKey: action.serviceKey,
      tag: action.tag,
      actionType: action.type,
    });
    tagUpdates.push({
      serviceKey: action.serviceKey,
      tag: action.tag,
      action: contentAction,
    });
  }

  if (tagUpdates.length > 0) {
    updateTags({
      file_id: fileId,
      changes: tagUpdates,
    });
  }

  return restoreEntries;
}
