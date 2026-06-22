// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it, vi } from "vitest";
import {
  executeSecondaryTagActions,
  getReverseContentUpdateAction,
} from "./review-tag-actions";
import type {
  FileMetadata,
  UpdateFileTagsOptions,
} from "@/integrations/hydrus-api/models";
import type { ValidSecondarySwipeAction } from "@/stores/review-settings-store";
import {
  ContentUpdateAction,
  TagStatus,
} from "@/integrations/hydrus-api/models";

const addReviewedAction = {
  id: "tag-add-reviewed-1",
  actionType: "tag",
  type: "add",
  serviceKey: "localTags",
  tag: "reviewed",
} satisfies ValidSecondarySwipeAction;

const addExistingAction = {
  id: "tag-add-existing-1",
  actionType: "tag",
  type: "add",
  serviceKey: "localTags",
  tag: "series:example",
} satisfies ValidSecondarySwipeAction;

const removeExistingAction = {
  id: "tag-remove-existing-1",
  actionType: "tag",
  type: "remove",
  serviceKey: "localTags",
  tag: "series:example",
} satisfies ValidSecondarySwipeAction;

const removeAbsentAction = {
  id: "tag-remove-absent-1",
  actionType: "tag",
  type: "remove",
  serviceKey: "localTags",
  tag: "missing",
} satisfies ValidSecondarySwipeAction;

const missingServiceAction = {
  id: "tag-add-missing-service-1",
  actionType: "tag",
  type: "add",
  serviceKey: "missingTags",
  tag: "reviewed",
} satisfies ValidSecondarySwipeAction;

const ratingAction = {
  id: "rating-like-1",
  actionType: "rating",
  type: "setLike",
  serviceKey: "favorite",
  value: true,
} satisfies ValidSecondarySwipeAction;

function metadata(currentTags?: Array<string>): FileMetadata {
  return {
    file_id: 123,
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

describe("executeSecondaryTagActions", () => {
  it("executes add actions when the tag is absent", () => {
    const updateTags = vi.fn<(args: UpdateFileTagsOptions) => void>();

    const restoreEntries = executeSecondaryTagActions(
      [addReviewedAction],
      123,
      metadata(["series:example"]),
      new Set(["localTags"]),
      true,
      updateTags,
    );

    expect(restoreEntries).toEqual([
      {
        serviceKey: "localTags",
        tag: "reviewed",
        actionType: "add",
      },
    ]);
    expect(updateTags).toHaveBeenCalledWith({
      file_id: 123,
      changes: [
        {
          serviceKey: "localTags",
          tag: "reviewed",
          action: ContentUpdateAction.ADD,
        },
      ],
    });
  });

  it("skips add actions when the tag already exists", () => {
    const updateTags = vi.fn<(args: UpdateFileTagsOptions) => void>();

    const restoreEntries = executeSecondaryTagActions(
      [addExistingAction],
      123,
      metadata(["series:example"]),
      new Set(["localTags"]),
      true,
      updateTags,
    );

    expect(restoreEntries).toEqual([]);
    expect(updateTags).not.toHaveBeenCalled();
  });

  it("executes remove actions when the tag exists", () => {
    const updateTags = vi.fn<(args: UpdateFileTagsOptions) => void>();

    const restoreEntries = executeSecondaryTagActions(
      [removeExistingAction],
      123,
      metadata(["series:example", "reviewed"]),
      new Set(["localTags"]),
      true,
      updateTags,
    );

    expect(restoreEntries).toEqual([
      {
        serviceKey: "localTags",
        tag: "series:example",
        actionType: "remove",
      },
    ]);
    expect(updateTags).toHaveBeenCalledWith({
      file_id: 123,
      changes: [
        {
          serviceKey: "localTags",
          tag: "series:example",
          action: ContentUpdateAction.DELETE,
        },
      ],
    });
  });

  it("skips remove actions when the tag is absent", () => {
    const updateTags = vi.fn<(args: UpdateFileTagsOptions) => void>();

    const restoreEntries = executeSecondaryTagActions(
      [removeAbsentAction],
      123,
      metadata(["series:example"]),
      new Set(["localTags"]),
      true,
      updateTags,
    );

    expect(restoreEntries).toEqual([]);
    expect(updateTags).not.toHaveBeenCalled();
  });

  it("skips tag actions when tag editing is unavailable", () => {
    const updateTags = vi.fn<(args: UpdateFileTagsOptions) => void>();

    const restoreEntries = executeSecondaryTagActions(
      [addReviewedAction],
      123,
      metadata(["series:example"]),
      new Set(["localTags"]),
      false,
      updateTags,
    );

    expect(restoreEntries).toEqual([]);
    expect(updateTags).not.toHaveBeenCalled();
  });

  it("skips tag actions when metadata is unavailable", () => {
    const updateTags = vi.fn<(args: UpdateFileTagsOptions) => void>();

    const restoreEntries = executeSecondaryTagActions(
      [addReviewedAction],
      123,
      undefined,
      new Set(["localTags"]),
      true,
      updateTags,
    );

    expect(restoreEntries).toEqual([]);
    expect(updateTags).not.toHaveBeenCalled();
  });

  it("skips tag actions for unavailable services", () => {
    const updateTags = vi.fn<(args: UpdateFileTagsOptions) => void>();

    const restoreEntries = executeSecondaryTagActions(
      [missingServiceAction],
      123,
      metadata(["series:example"]),
      new Set(["localTags"]),
      true,
      updateTags,
    );

    expect(restoreEntries).toEqual([]);
    expect(updateTags).not.toHaveBeenCalled();
  });

  it("ignores non-tag secondary actions", () => {
    const updateTags = vi.fn<(args: UpdateFileTagsOptions) => void>();

    const restoreEntries = executeSecondaryTagActions(
      [ratingAction],
      123,
      metadata(["series:example"]),
      new Set(["localTags"]),
      true,
      updateTags,
    );

    expect(restoreEntries).toEqual([]);
    expect(updateTags).not.toHaveBeenCalled();
  });

  it("records only changed tag actions in mixed batches", () => {
    const updateTags = vi.fn<(args: UpdateFileTagsOptions) => void>();

    const restoreEntries = executeSecondaryTagActions(
      [
        addReviewedAction,
        addExistingAction,
        removeExistingAction,
        removeAbsentAction,
        missingServiceAction,
        ratingAction,
      ],
      123,
      metadata(["series:example"]),
      new Set(["localTags"]),
      true,
      updateTags,
    );

    expect(restoreEntries).toEqual([
      {
        serviceKey: "localTags",
        tag: "reviewed",
        actionType: "add",
      },
      {
        serviceKey: "localTags",
        tag: "series:example",
        actionType: "remove",
      },
    ]);
    expect(updateTags).toHaveBeenCalledTimes(1);
    expect(updateTags).toHaveBeenCalledWith({
      file_id: 123,
      changes: [
        {
          serviceKey: "localTags",
          tag: "reviewed",
          action: ContentUpdateAction.ADD,
        },
        {
          serviceKey: "localTags",
          tag: "series:example",
          action: ContentUpdateAction.DELETE,
        },
      ],
    });
  });
});

describe("getReverseContentUpdateAction", () => {
  it("maps add tag actions to delete updates", () => {
    expect(getReverseContentUpdateAction("add")).toBe(
      ContentUpdateAction.DELETE,
    );
  });

  it("maps remove tag actions to add updates", () => {
    expect(getReverseContentUpdateAction("remove")).toBe(
      ContentUpdateAction.ADD,
    );
  });
});
