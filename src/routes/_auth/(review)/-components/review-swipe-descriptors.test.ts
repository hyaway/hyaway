// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from "vitest";
import { getSwipeBindingDescriptor } from "./review-swipe-descriptors";
import type { ReviewSwipeBinding } from "@/stores/review-settings-store";

describe("getSwipeBindingDescriptor with tags", () => {
  it("lists tag names in the long label; short label is action-only", () => {
    const binding: ReviewSwipeBinding = {
      fileAction: "archive",
      secondaryActions: [
        { actionType: "addTag", tag: "reviewed" },
        { actionType: "addTag", tag: "keeper" },
      ],
    };
    const d = getSwipeBindingDescriptor(binding);
    expect(d.label).toBe("Archive + reviewed, keeper");
    // Tag counts are rendered separately (coloured) in the stats bar.
    expect(d.shortLabel).toBe("Archive");
  });

  it("drops the 'Skip' word for a tag-only skip", () => {
    const binding: ReviewSwipeBinding = {
      fileAction: "skip",
      secondaryActions: [{ actionType: "addTag", tag: "later" }],
    };
    const d = getSwipeBindingDescriptor(binding);
    expect(d.label).toBe("later");
    expect(d.shortLabel).toBe("");
  });

  it("keeps the action word (short) for a non-skip tag binding", () => {
    const binding: ReviewSwipeBinding = {
      fileAction: "archive",
      secondaryActions: [{ actionType: "addTag", tag: "later" }],
    };
    expect(getSwipeBindingDescriptor(binding).shortLabel).toBe("Archive");
  });

  it("renders just the file label with no secondary actions", () => {
    const binding: ReviewSwipeBinding = { fileAction: "trash" };
    expect(getSwipeBindingDescriptor(binding).label).toBe("Trash");
  });

  it("shows removed tags with a minus and combined counts", () => {
    const binding: ReviewSwipeBinding = {
      fileAction: "archive",
      secondaryActions: [
        { actionType: "addTag", tag: "reviewed" },
        { actionType: "removeTag", tag: "unsorted" },
      ],
    };
    const d = getSwipeBindingDescriptor(binding);
    expect(d.label).toBe("Archive + reviewed + −unsorted");
    expect(d.shortLabel).toBe("Archive");
  });

  it("handles a remove-only tag-skip in the long label", () => {
    const binding: ReviewSwipeBinding = {
      fileAction: "skip",
      secondaryActions: [{ actionType: "removeTag", tag: "unsorted" }],
    };
    const d = getSwipeBindingDescriptor(binding);
    expect(d.label).toBe("−unsorted");
    expect(d.shortLabel).toBe("");
  });
});
