// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0
// @vitest-environment jsdom

import { act, renderHook } from "@testing-library/react";
import { beforeEach, expect, test } from "vitest";

beforeEach(() => {
  localStorage.clear();
});

test("fileSortMode defaults to namespace and updates", async () => {
  const store = await import("./tags-settings-store");
  const { result } = renderHook(() => ({
    mode: store.useFileTagsSortMode(),
    actions: store.useTagsSettingsActions(),
  }));

  expect(result.current.mode).toBe("namespace");
  act(() => {
    result.current.actions.setFileSortMode("hydrus");
  });
  expect(result.current.mode).toBe("hydrus");
});
