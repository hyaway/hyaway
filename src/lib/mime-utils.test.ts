// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from "vitest";
import { getVideoPlayerMimeType } from "./mime-utils";

describe("getVideoPlayerMimeType", () => {
  it("aliases QuickTime MOV to MP4 so the player accepts it", () => {
    expect(getVideoPlayerMimeType("video/quicktime")).toBe("video/mp4");
  });

  it("aliases Matroska MKV to WebM so the player accepts it", () => {
    expect(getVideoPlayerMimeType("video/x-matroska")).toBe("video/webm");
  });

  it("passes through types the player already accepts", () => {
    expect(getVideoPlayerMimeType("video/mp4")).toBe("video/mp4");
    expect(getVideoPlayerMimeType("video/webm")).toBe("video/webm");
  });

  it("passes through types browsers cannot play", () => {
    expect(getVideoPlayerMimeType("video/x-ms-wmv")).toBe("video/x-ms-wmv");
  });
});
