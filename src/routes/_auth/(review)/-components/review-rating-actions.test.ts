// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it, vi } from "vitest";
import { executeSecondaryRatingActions } from "./review-rating-actions";
import type { RatingValue } from "@/integrations/hydrus-api/models";
import type { ValidSecondarySwipeAction } from "@/stores/review-settings-store";

type RatingMutateArgs = {
  file_id: number;
  rating_service_key: string;
  rating: RatingValue;
};

const decrementScoreAction = {
  id: "rating-decrement-1",
  actionType: "rating",
  type: "incDecDelta",
  serviceKey: "score",
  delta: -1,
} satisfies ValidSecondarySwipeAction;

const incrementScoreAction = {
  id: "rating-increment-1",
  actionType: "rating",
  type: "incDecDelta",
  serviceKey: "score",
  delta: 1,
} satisfies ValidSecondarySwipeAction;

const setLikeAction = {
  id: "rating-like-1",
  actionType: "rating",
  type: "setLike",
  serviceKey: "favorite",
  value: true,
} satisfies ValidSecondarySwipeAction;

const clearStarsAction = {
  id: "rating-clear-stars-1",
  actionType: "rating",
  type: "setNumerical",
  serviceKey: "stars",
  value: null,
} satisfies ValidSecondarySwipeAction;

const tagAction = {
  id: "tag-add-1",
  actionType: "tag",
  type: "add",
  serviceKey: "localTags",
  tag: "reviewed",
} satisfies ValidSecondarySwipeAction;

describe("executeSecondaryRatingActions", () => {
  it("skips inc/dec decrements at the lower bound", () => {
    const setRating = vi.fn<(args: RatingMutateArgs) => void>();

    const restoreEntries = executeSecondaryRatingActions(
      [decrementScoreAction],
      123,
      { score: 0 },
      new Set(["score"]),
      setRating,
    );

    expect(restoreEntries).toEqual([]);
    expect(setRating).not.toHaveBeenCalled();
  });

  it("treats unset inc/dec ratings as the lower bound when decrementing", () => {
    const setRating = vi.fn<(args: RatingMutateArgs) => void>();

    const restoreEntries = executeSecondaryRatingActions(
      [decrementScoreAction],
      123,
      undefined,
      new Set(["score"]),
      setRating,
    );

    expect(restoreEntries).toEqual([]);
    expect(setRating).not.toHaveBeenCalled();
  });

  it("executes inc/dec decrements above the lower bound", () => {
    const setRating = vi.fn<(args: RatingMutateArgs) => void>();

    const restoreEntries = executeSecondaryRatingActions(
      [decrementScoreAction],
      123,
      { score: 2 },
      new Set(["score"]),
      setRating,
    );

    expect(restoreEntries).toEqual([
      {
        serviceKey: "score",
        actionType: "incDecDelta",
        previousValue: 2,
      },
    ]);
    expect(setRating).toHaveBeenCalledWith({
      file_id: 123,
      rating_service_key: "score",
      rating: 1,
    });
  });

  it("executes inc/dec increments from an unset rating", () => {
    const setRating = vi.fn<(args: RatingMutateArgs) => void>();

    const restoreEntries = executeSecondaryRatingActions(
      [incrementScoreAction],
      123,
      undefined,
      new Set(["score"]),
      setRating,
    );

    expect(restoreEntries).toEqual([
      {
        serviceKey: "score",
        actionType: "incDecDelta",
        previousValue: 0,
      },
    ]);
    expect(setRating).toHaveBeenCalledWith({
      file_id: 123,
      rating_service_key: "score",
      rating: 1,
    });
  });

  it("skips set actions that already match the current rating", () => {
    const setRating = vi.fn<(args: RatingMutateArgs) => void>();

    const restoreEntries = executeSecondaryRatingActions(
      [setLikeAction],
      123,
      { favorite: true },
      new Set(["favorite"]),
      setRating,
    );

    expect(restoreEntries).toEqual([]);
    expect(setRating).not.toHaveBeenCalled();
  });

  it("executes set actions that change the current rating", () => {
    const setRating = vi.fn<(args: RatingMutateArgs) => void>();

    const restoreEntries = executeSecondaryRatingActions(
      [setLikeAction, clearStarsAction],
      123,
      { favorite: null, stars: 4 },
      new Set(["favorite", "stars"]),
      setRating,
    );

    expect(restoreEntries).toEqual([
      {
        serviceKey: "favorite",
        actionType: "setLike",
        previousValue: null,
      },
      {
        serviceKey: "stars",
        actionType: "setNumerical",
        previousValue: 4,
      },
    ]);
    expect(setRating).toHaveBeenCalledTimes(2);
    expect(setRating).toHaveBeenNthCalledWith(1, {
      file_id: 123,
      rating_service_key: "favorite",
      rating: true,
    });
    expect(setRating).toHaveBeenNthCalledWith(2, {
      file_id: 123,
      rating_service_key: "stars",
      rating: null,
    });
  });

  it("skips numerical clears when the rating is already unset", () => {
    const setRating = vi.fn<(args: RatingMutateArgs) => void>();

    const restoreEntries = executeSecondaryRatingActions(
      [clearStarsAction],
      123,
      { stars: null },
      new Set(["stars"]),
      setRating,
    );

    expect(restoreEntries).toEqual([]);
    expect(setRating).not.toHaveBeenCalled();
  });

  it("skips rating actions for unavailable services", () => {
    const setRating = vi.fn<(args: RatingMutateArgs) => void>();

    const restoreEntries = executeSecondaryRatingActions(
      [incrementScoreAction],
      123,
      { score: 2 },
      new Set(["favorite"]),
      setRating,
    );

    expect(restoreEntries).toEqual([]);
    expect(setRating).not.toHaveBeenCalled();
  });

  it("ignores non-rating secondary actions", () => {
    const setRating = vi.fn<(args: RatingMutateArgs) => void>();

    const restoreEntries = executeSecondaryRatingActions(
      [tagAction],
      123,
      undefined,
      new Set(["score"]),
      setRating,
    );

    expect(restoreEntries).toEqual([]);
    expect(setRating).not.toHaveBeenCalled();
  });

  it("records only changed rating actions in mixed batches", () => {
    const setRating = vi.fn<(args: RatingMutateArgs) => void>();

    const restoreEntries = executeSecondaryRatingActions(
      [
        decrementScoreAction,
        incrementScoreAction,
        setLikeAction,
        clearStarsAction,
        tagAction,
      ],
      123,
      { score: 0, favorite: true, stars: 3 },
      new Set(["score", "favorite", "stars"]),
      setRating,
    );

    expect(restoreEntries).toEqual([
      {
        serviceKey: "score",
        actionType: "incDecDelta",
        previousValue: 0,
      },
      {
        serviceKey: "stars",
        actionType: "setNumerical",
        previousValue: 3,
      },
    ]);
    expect(setRating).toHaveBeenCalledTimes(2);
    expect(setRating).toHaveBeenNthCalledWith(1, {
      file_id: 123,
      rating_service_key: "score",
      rating: 1,
    });
    expect(setRating).toHaveBeenNthCalledWith(2, {
      file_id: 123,
      rating_service_key: "stars",
      rating: null,
    });
  });
});
