// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import type { PreviousFileState } from "@/stores/review-queue-store";
import type {
  ReviewFileAction,
  ReviewFileMutationAction,
} from "@/stores/review-settings-store";

/** Mutation function signature for file management operations */
type FileMutate = (args: { file_ids: Array<number> }) => void;

function assertNever(value: never): never {
  throw new Error(`Unhandled review file action: ${String(value)}`);
}

/** Check if a mutation action didn't change the file state (e.g., archiving already archived) */
function wasMutationUnchanged(
  action: ReviewFileMutationAction,
  fileState: PreviousFileState,
): boolean {
  return (
    (action === "archive" && fileState === "archived") ||
    (action === "trash" && fileState === "trashed")
  );
}

/**
 * Execute the primary file action if it would change state.
 * "skip" and "undo" are explicit no-ops. Mutation actions use a complete
 * (non-Partial) map so adding a new mutation action forces a compile error
 * until handled.
 */
export function executeFileAction(
  fileAction: ReviewFileAction,
  fileId: number,
  fileState: PreviousFileState,
  mutations: Record<ReviewFileMutationAction, FileMutate>,
): void {
  if (fileAction === "skip" || fileAction === "undo") return;
  if (wasMutationUnchanged(fileAction, fileState)) return;
  mutations[fileAction]({ file_ids: [fileId] });
}

/**
 * Reverse a previously-applied file action for undo.
 * Maps each forward action to its inverse mutation.
 */
export function reverseFileAction(
  fileAction: ReviewFileAction,
  fileId: number,
  fileState: PreviousFileState,
  undoMutations: Record<ReviewFileMutationAction, FileMutate>,
): void {
  if (fileAction === "skip" || fileAction === "undo") return;
  if (wasMutationUnchanged(fileAction, fileState)) return;
  undoMutations[fileAction]({ file_ids: [fileId] });
}

export function shouldHideFromViewAfterReviewAction(
  fileAction: ReviewFileAction,
  options: {
    hideFilteredFiles: boolean;
    hideFilteredFilesEvenWhenSkipped: boolean;
  },
) {
  if (!options.hideFilteredFiles) return false;

  switch (fileAction) {
    case "archive":
    case "trash":
      return true;
    case "skip":
      return options.hideFilteredFilesEvenWhenSkipped;
    case "undo":
      return false;
    default:
      return assertNever(fileAction);
  }
}
