// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0
// @vitest-environment jsdom

import { act, renderHook } from "@testing-library/react";
import { beforeEach, expect, test } from "vitest";

const SWIPE_DIRECTIONS = ["left", "right", "up", "down"] as const;

beforeEach(() => {
  localStorage.clear();
});

test("newConfig clears all swipe actions, goes unsaved, keeps saved configs", async () => {
  const store = await import("./review-settings-store");

  const { result } = renderHook(() => ({
    actions: store.useReviewSettingsActions(),
    bindings: store.useReviewSwipeBindings(),
    configs: store.useSavedReviewConfigs(),
    activeName: store.useActiveReviewConfigName(),
  }));

  // Save a config and give a direction a non-trivial binding (file action + tag).
  act(() => {
    result.current.actions.saveConfigAs("Tagging pass");
  });
  act(() => {
    result.current.actions.setBinding("left", {
      fileAction: "archive",
      secondaryActions: [{ actionType: "addTag", tag: "good" }],
    });
  });
  expect(result.current.configs).toHaveLength(1);
  expect(result.current.activeName).toBe("Tagging pass");

  act(() => {
    result.current.actions.newConfig();
  });

  // Every direction is cleared to "skip" with no secondary actions.
  for (const dir of SWIPE_DIRECTIONS) {
    expect(result.current.bindings[dir].fileAction).toBe("skip");
    expect(result.current.bindings[dir].secondaryActions).toBeUndefined();
  }
  // Back to an unsaved config...
  expect(result.current.activeName).toBeNull();
  // ...but the previously-saved config is untouched.
  expect(result.current.configs).toHaveLength(1);
});
