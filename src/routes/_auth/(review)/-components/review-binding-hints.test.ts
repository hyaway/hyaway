// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from "vitest";
import { buildDirectionHint } from "./review-binding-hints";
import type { ReviewSwipeBinding } from "@/stores/review-settings-store";

describe("buildDirectionHint", () => {
  it("returns null when the binding has no tags", () => {
    expect(buildDirectionHint({ fileAction: "trash" })).toBeNull();
  });

  it("returns null for an undo binding (no secondary actions)", () => {
    expect(buildDirectionHint({ fileAction: "undo" })).toBeNull();
  });

  it("includes the action label and split add/remove lists", () => {
    const binding: ReviewSwipeBinding = {
      fileAction: "archive",
      secondaryActions: [
        { actionType: "addTag", tag: "reviewed" },
        { actionType: "addTag", tag: "keeper" },
        { actionType: "removeTag", tag: "unsorted" },
      ],
    };
    expect(buildDirectionHint(binding)).toEqual({
      actionLabel: "Archive",
      addTags: ["reviewed", "keeper"],
      removeTags: ["unsorted"],
      overflow: false,
    });
  });

  it("omits the action label for skip", () => {
    const binding: ReviewSwipeBinding = {
      fileAction: "skip",
      secondaryActions: [{ actionType: "addTag", tag: "later" }],
    };
    expect(buildDirectionHint(binding)).toEqual({
      actionLabel: null,
      addTags: ["later"],
      removeTags: [],
      overflow: false,
    });
  });

  it("overflows when the combined add+remove count exceeds the max", () => {
    const binding: ReviewSwipeBinding = {
      fileAction: "archive",
      secondaryActions: [
        ...["a", "b", "c"].map((tag) => ({
          actionType: "addTag" as const,
          tag,
        })),
        ...["d", "e", "f"].map((tag) => ({
          actionType: "removeTag" as const,
          tag,
        })),
      ],
    };
    const hint = buildDirectionHint(binding, 5);
    expect(hint?.overflow).toBe(true);
    expect(hint?.addTags).toHaveLength(3);
    expect(hint?.removeTags).toHaveLength(3);
  });

  it("does not overflow at exactly the max", () => {
    const binding: ReviewSwipeBinding = {
      fileAction: "archive",
      secondaryActions: ["a", "b", "c", "d", "e"].map((tag) => ({
        actionType: "addTag" as const,
        tag,
      })),
    };
    expect(buildDirectionHint(binding, 5)?.overflow).toBe(false);
  });
});
