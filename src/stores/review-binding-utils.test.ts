// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from "vitest";
import { getTagActions, withTagActions } from "./review-binding-utils";
import type { SecondarySwipeAction } from "./review-settings-store";

const ratingAction: SecondarySwipeAction = {
  actionType: "rating",
  type: "setLike",
  serviceKey: "r",
  value: true,
};

describe("getTagActions", () => {
  it("returns [] when no secondary actions", () => {
    expect(getTagActions(undefined)).toEqual([]);
  });

  it("extracts addTag actions without actionType (default kind)", () => {
    const actions: Array<SecondarySwipeAction> = [
      ratingAction,
      { actionType: "addTag", tag: "cat" },
      { actionType: "removeTag", tag: "nope" },
      { actionType: "addTag", tag: "blue" },
    ];
    expect(getTagActions(actions)).toEqual([{ tag: "cat" }, { tag: "blue" }]);
  });

  it("extracts removeTag actions when kind is removeTag", () => {
    const actions: Array<SecondarySwipeAction> = [
      { actionType: "addTag", tag: "cat" },
      { actionType: "removeTag", tag: "nope" },
      { actionType: "removeTag", tag: "old" },
    ];
    expect(getTagActions(actions, "removeTag")).toEqual([
      { tag: "nope" },
      { tag: "old" },
    ]);
  });
});

describe("withTagActions", () => {
  it("returns undefined when result is empty", () => {
    expect(withTagActions(undefined, [])).toBeUndefined();
  });

  it("preserves rating actions and replaces tags", () => {
    const existing: Array<SecondarySwipeAction> = [
      ratingAction,
      { actionType: "addTag", tag: "old" },
    ];
    expect(withTagActions(existing, ["new1", "new2"])).toEqual([
      ratingAction,
      { actionType: "addTag", tag: "new1" },
      { actionType: "addTag", tag: "new2" },
    ]);
  });

  it("clears tags but keeps ratings", () => {
    const existing: Array<SecondarySwipeAction> = [
      ratingAction,
      { actionType: "addTag", tag: "old" },
    ];
    expect(withTagActions(existing, [])).toEqual([ratingAction]);
  });

  it("writes removeTag actions while preserving addTag + ratings", () => {
    const existing: Array<SecondarySwipeAction> = [
      ratingAction,
      { actionType: "addTag", tag: "keep" },
      { actionType: "removeTag", tag: "old" },
    ];
    expect(withTagActions(existing, ["gone"], "removeTag")).toEqual([
      ratingAction,
      { actionType: "addTag", tag: "keep" },
      { actionType: "removeTag", tag: "gone" },
    ]);
  });
});
