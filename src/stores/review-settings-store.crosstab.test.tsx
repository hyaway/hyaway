// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0
// @vitest-environment jsdom

import { act, renderHook } from "@testing-library/react";
import { expect, test } from "vitest";

const KEY = "hyaway-review-queue";

// Seed an UPGRADED (store version 4) persisted state BEFORE importing the store,
// mimicking a user who had the tag-actions build (no `savedConfigs` key yet).
const v4Snapshot = {
  state: {
    shortcutsEnabled: true,
    gesturesEnabled: true,
    showGestureThresholds: false,
    thresholds: { left: 80, right: 80, up: 80, down: 80 },
    trackWatchHistory: true,
    imageLoadMode: "optimized",
    renderQuality: "high",
    optimizeSizeThresholdMB: 5,
    immersiveMode: false,
    bindings: {
      left: { fileAction: "archive" },
      right: { fileAction: "delete" },
      up: { fileAction: "skip" },
      down: { fileAction: "undo" },
    },
    tagServiceKey: null,
  },
  version: 4,
};
localStorage.setItem(KEY, JSON.stringify(v4Snapshot));

// Regression: a cross-tab `storage` event carrying an older (v4) snapshot — what
// a second tab/window still running the pre-saved-configs build persists — must
// NOT wipe configs saved in this tab. Before the custom persist `merge`, the
// rehydrate re-ran the v4->v5 migrate, defaulted `savedConfigs` to `{}`, and the
// just-saved config vanished (the flash-then-revert users saw).
test("cross-tab rehydrate of a stale v4 snapshot does not wipe saved configs", async () => {
  const store = await import("./review-settings-store");

  const { result } = renderHook(() => ({
    actions: store.useReviewSettingsActions(),
    configs: store.useSavedReviewConfigs(),
    activeName: store.useActiveReviewConfigName(),
  }));

  act(() => {
    result.current.actions.saveConfigAs("My Config");
  });
  expect(result.current.configs).toHaveLength(1);
  expect(result.current.activeName).toBe("My Config");

  // A stale tab re-persists the old v4 shape and fires the storage event that
  // cross-tab-sync listens for.
  act(() => {
    const stale = JSON.stringify(v4Snapshot);
    localStorage.setItem(KEY, stale);
    window.dispatchEvent(
      new StorageEvent("storage", { key: KEY, newValue: stale }),
    );
  });

  // The saved config and active selection survive the stale rehydrate.
  expect(result.current.configs).toHaveLength(1);
  expect(result.current.activeName).toBe("My Config");
});
