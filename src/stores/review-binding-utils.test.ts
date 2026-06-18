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

  it("extracts addTag actions without actionType", () => {
    const actions: Array<SecondarySwipeAction> = [
      ratingAction,
      { actionType: "addTag", tag: "cat" },
      { actionType: "addTag", tag: "blue" },
    ];
    expect(getTagActions(actions)).toEqual([{ tag: "cat" }, { tag: "blue" }]);
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
});
