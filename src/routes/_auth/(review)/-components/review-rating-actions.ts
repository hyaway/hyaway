// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import type { RatingRestoreEntry } from "@/stores/review-queue-store";
import type { ValidSecondarySwipeAction } from "@/stores/review-settings-store";
import type { RatingValue } from "@/integrations/hydrus-api/models";

/** Mutation function signature for rating operations */
type RatingMutate = (args: {
  file_id: number;
  rating_service_key: string;
  rating: RatingValue;
}) => void;

/**
 * Execute secondary rating actions and build restore entries for undo.
 * Returns the restore entries so the caller can record them in history.
 */
export function executeSecondaryRatingActions(
  secondaryActions: Array<ValidSecondarySwipeAction>,
  fileId: number,
  ratings: Record<string, RatingValue> | undefined,
  validRatingServiceKeys: Set<string>,
  setRating: RatingMutate,
): Array<RatingRestoreEntry> {
  const restoreEntries: Array<RatingRestoreEntry> = [];

  for (const action of secondaryActions) {
    if (action.actionType !== "rating") continue;

    const { serviceKey } = action;

    if (!validRatingServiceKeys.has(serviceKey)) continue;

    const currentRating = ratings?.[serviceKey] ?? null;

    switch (action.type) {
      case "setLike":
        if (currentRating === action.value) continue;

        restoreEntries.push({
          serviceKey,
          actionType: "setLike",
          previousValue: currentRating,
        });
        setRating({
          file_id: fileId,
          rating_service_key: serviceKey,
          rating: action.value,
        });
        continue;
      case "setNumerical":
        if (currentRating === action.value) continue;

        restoreEntries.push({
          serviceKey,
          actionType: "setNumerical",
          previousValue: currentRating,
        });
        setRating({
          file_id: fileId,
          rating_service_key: serviceKey,
          rating: action.value,
        });
        continue;
      case "incDecDelta": {
        const prevValue = (currentRating as number | null) ?? 0;
        const nextValue = Math.max(0, prevValue + action.delta);
        if (nextValue === prevValue) continue;

        restoreEntries.push({
          serviceKey,
          actionType: "incDecDelta",
          previousValue: prevValue,
        });
        setRating({
          file_id: fileId,
          rating_service_key: serviceKey,
          rating: nextValue,
        });
        continue;
      }
      default:
        action satisfies never;
    }
  }

  return restoreEntries;
}
