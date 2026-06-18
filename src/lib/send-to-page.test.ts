// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from "vitest";
import { resolveSendToPageState } from "./send-to-page";

const pages = [
  { page_key: "a", name: "Alpha" },
  { page_key: "b", name: "Beta" },
];

describe("resolveSendToPageState", () => {
  it("is 'unset' when no page key is configured", () => {
    expect(resolveSendToPageState(null, null, pages)).toEqual({
      status: "unset",
    });
  });

  it("is 'closed' when the configured key is not among open pages", () => {
    expect(resolveSendToPageState("zzz", "Gone", pages)).toEqual({
      status: "closed",
      name: "Gone",
    });
  });

  it("is 'ok' when the page is open, using its current name", () => {
    expect(resolveSendToPageState("a", "Stale name", pages)).toEqual({
      status: "ok",
      pageKey: "a",
      name: "Alpha",
    });
  });

  it("is 'closed' (not crashing) when there are no open pages", () => {
    expect(resolveSendToPageState("a", "Alpha", [])).toEqual({
      status: "closed",
      name: "Alpha",
    });
  });
});
