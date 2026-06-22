// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from "vitest";
import { getNextUniqueName } from "./unique-name";

describe("getNextUniqueName", () => {
  it("returns the base name when no existing name matches", () => {
    expect(getNextUniqueName("Review", ["Default", "Review queue"])).toBe(
      "Review",
    );
  });

  it("starts duplicate names at a one-based suffix", () => {
    expect(getNextUniqueName("Review", ["Review"])).toBe("Review (1)");
  });

  it("increments past the highest numeric suffix", () => {
    expect(
      getNextUniqueName("Review", ["Review", "Review (1)", "Review (4)"]),
    ).toBe("Review (5)");
  });

  it("ignores names that only partially match the suffix pattern", () => {
    expect(
      getNextUniqueName("Review", [
        "Review copy",
        "Review (draft)",
        "Review (2",
        "Review (3) extra",
      ]),
    ).toBe("Review");
  });
});
