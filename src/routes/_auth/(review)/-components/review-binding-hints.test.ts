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

  it("includes the action label for non-skip actions", () => {
    const binding: ReviewSwipeBinding = {
      fileAction: "archive",
      secondaryActions: [
        { actionType: "addTag", tag: "reviewed" },
        { actionType: "addTag", tag: "keeper" },
      ],
    };
    expect(buildDirectionHint(binding)).toEqual({
      actionLabel: "Archive",
      tags: ["reviewed", "keeper"],
      overflowCount: null,
    });
  });

  it("omits the action label for skip (just the tags)", () => {
    const binding: ReviewSwipeBinding = {
      fileAction: "skip",
      secondaryActions: [{ actionType: "addTag", tag: "later" }],
    };
    expect(buildDirectionHint(binding)).toEqual({
      actionLabel: null,
      tags: ["later"],
      overflowCount: null,
    });
  });

  it("collapses to a count when tags exceed the max", () => {
    const binding: ReviewSwipeBinding = {
      fileAction: "archive",
      secondaryActions: ["a", "b", "c", "d", "e", "f"].map((tag) => ({
        actionType: "addTag" as const,
        tag,
      })),
    };
    expect(buildDirectionHint(binding, 5)).toEqual({
      actionLabel: "Archive",
      tags: [],
      overflowCount: 6,
    });
  });

  it("lists exactly the max without collapsing", () => {
    const binding: ReviewSwipeBinding = {
      fileAction: "archive",
      secondaryActions: ["a", "b", "c", "d", "e"].map((tag) => ({
        actionType: "addTag" as const,
        tag,
      })),
    };
    const hint = buildDirectionHint(binding, 5);
    expect(hint?.overflowCount).toBeNull();
    expect(hint?.tags).toHaveLength(5);
  });
});
