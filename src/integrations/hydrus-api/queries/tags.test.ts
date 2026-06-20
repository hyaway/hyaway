// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from "vitest";
import { ContentUpdateAction, TagStatus } from "../models";
import { applyStorageTagChange, getTagActionStateChange } from "./tags";
import type { FileMetadata } from "../models";

function metadata(currentTags?: Array<string>): FileMetadata {
  return {
    file_id: 1,
    tags:
      currentTags == null
        ? undefined
        : {
            localTags: {
              display_tags: {},
              storage_tags: {
                [TagStatus.CURRENT]: currentTags,
              },
            },
          },
  } as FileMetadata;
}

describe("tag metadata helpers", () => {
  it("marks add missing tag as a state change", () => {
    const result = getTagActionStateChange(
      metadata(["creator:alice"]),
      "localTags",
      "series:example",
      ContentUpdateAction.ADD,
    );

    expect(result).toEqual({ hasTag: false, changed: true });
  });

  it("marks add existing tag as a no-op", () => {
    const result = getTagActionStateChange(
      metadata(["series:example"]),
      "localTags",
      "series:example",
      ContentUpdateAction.ADD,
    );

    expect(result).toEqual({ hasTag: true, changed: false });
  });

  it("marks remove existing tag as a state change", () => {
    const result = getTagActionStateChange(
      metadata(["series:example"]),
      "localTags",
      "series:example",
      ContentUpdateAction.DELETE,
    );

    expect(result).toEqual({ hasTag: true, changed: true });
  });

  it("marks remove absent tag as a no-op", () => {
    const result = getTagActionStateChange(
      metadata(["creator:alice"]),
      "localTags",
      "series:example",
      ContentUpdateAction.DELETE,
    );

    expect(result).toEqual({ hasTag: false, changed: false });
  });

  it("handles missing tag metadata without throwing", () => {
    const result = getTagActionStateChange(
      metadata(),
      "localTags",
      "series:example",
      ContentUpdateAction.DELETE,
    );

    expect(result).toEqual({ hasTag: false, changed: false });
  });

  it("applies add changes to current storage tags", () => {
    const original = metadata(["creator:alice"]);

    const next = applyStorageTagChange(
      original,
      "localTags",
      "series:example",
      ContentUpdateAction.ADD,
    );

    expect(next).not.toBe(original);
    expect(next.tags?.localTags.storage_tags[TagStatus.CURRENT]).toEqual([
      "creator:alice",
      "series:example",
    ]);
  });

  it("applies remove changes to current storage tags", () => {
    const original = metadata(["creator:alice", "series:example"]);

    const next = applyStorageTagChange(
      original,
      "localTags",
      "series:example",
      ContentUpdateAction.DELETE,
    );

    expect(next).not.toBe(original);
    expect(next.tags?.localTags.storage_tags[TagStatus.CURRENT]).toEqual([
      "creator:alice",
    ]);
  });

  it("returns original metadata for no-op changes", () => {
    const original = metadata(["series:example"]);

    const next = applyStorageTagChange(
      original,
      "localTags",
      "series:example",
      ContentUpdateAction.ADD,
    );

    expect(next).toBe(original);
  });
});
