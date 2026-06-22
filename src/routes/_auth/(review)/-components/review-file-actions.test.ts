// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it, vi } from "vitest";
import {
  executeFileAction,
  reverseFileAction,
  shouldHideFromViewAfterReviewAction,
} from "./review-file-actions";
import type { ReviewFileMutationAction } from "@/stores/review-settings-store";

type FileMutateArgs = { file_ids: Array<number> };

function fileMutations() {
  return {
    archive: vi.fn<(args: FileMutateArgs) => void>(),
    trash: vi.fn<(args: FileMutateArgs) => void>(),
  } satisfies Record<ReviewFileMutationAction, (args: FileMutateArgs) => void>;
}

describe("executeFileAction", () => {
  it("executes archive and trash actions that change state", () => {
    const mutations = fileMutations();

    executeFileAction("archive", 123, "inbox", mutations);
    executeFileAction("trash", 456, "archived", mutations);

    expect(mutations.archive).toHaveBeenCalledWith({ file_ids: [123] });
    expect(mutations.trash).toHaveBeenCalledWith({ file_ids: [456] });
  });

  it("skips archive and trash actions that would not change state", () => {
    const mutations = fileMutations();

    executeFileAction("archive", 123, "archived", mutations);
    executeFileAction("trash", 456, "trashed", mutations);

    expect(mutations.archive).not.toHaveBeenCalled();
    expect(mutations.trash).not.toHaveBeenCalled();
  });

  it("treats skip and undo as file mutation no-ops", () => {
    const mutations = fileMutations();

    executeFileAction("skip", 123, "inbox", mutations);
    executeFileAction("undo", 456, "archived", mutations);

    expect(mutations.archive).not.toHaveBeenCalled();
    expect(mutations.trash).not.toHaveBeenCalled();
  });
});

describe("reverseFileAction", () => {
  it("executes reverse archive and trash actions when original actions changed state", () => {
    const undoMutations = fileMutations();

    reverseFileAction("archive", 123, "inbox", undoMutations);
    reverseFileAction("trash", 456, "archived", undoMutations);

    expect(undoMutations.archive).toHaveBeenCalledWith({ file_ids: [123] });
    expect(undoMutations.trash).toHaveBeenCalledWith({ file_ids: [456] });
  });

  it("skips reverse archive and trash actions when original actions were unchanged", () => {
    const undoMutations = fileMutations();

    reverseFileAction("archive", 123, "archived", undoMutations);
    reverseFileAction("trash", 456, "trashed", undoMutations);

    expect(undoMutations.archive).not.toHaveBeenCalled();
    expect(undoMutations.trash).not.toHaveBeenCalled();
  });

  it("treats skip and undo as reverse mutation no-ops", () => {
    const undoMutations = fileMutations();

    reverseFileAction("skip", 123, "inbox", undoMutations);
    reverseFileAction("undo", 456, "archived", undoMutations);

    expect(undoMutations.archive).not.toHaveBeenCalled();
    expect(undoMutations.trash).not.toHaveBeenCalled();
  });
});

describe("shouldHideFromViewAfterReviewAction", () => {
  it("does not hide any action when hiding filtered files is disabled", () => {
    const options = {
      hideFilteredFiles: false,
      hideFilteredFilesEvenWhenSkipped: true,
    };

    expect(shouldHideFromViewAfterReviewAction("archive", options)).toBe(false);
    expect(shouldHideFromViewAfterReviewAction("trash", options)).toBe(false);
    expect(shouldHideFromViewAfterReviewAction("skip", options)).toBe(false);
    expect(shouldHideFromViewAfterReviewAction("undo", options)).toBe(false);
  });

  it("hides archive and trash actions when hiding filtered files is enabled", () => {
    const options = {
      hideFilteredFiles: true,
      hideFilteredFilesEvenWhenSkipped: false,
    };

    expect(shouldHideFromViewAfterReviewAction("archive", options)).toBe(true);
    expect(shouldHideFromViewAfterReviewAction("trash", options)).toBe(true);
  });

  it("uses the skip-specific option for skip actions", () => {
    expect(
      shouldHideFromViewAfterReviewAction("skip", {
        hideFilteredFiles: true,
        hideFilteredFilesEvenWhenSkipped: false,
      }),
    ).toBe(false);
    expect(
      shouldHideFromViewAfterReviewAction("skip", {
        hideFilteredFiles: true,
        hideFilteredFilesEvenWhenSkipped: true,
      }),
    ).toBe(true);
  });

  it("does not hide undo actions", () => {
    expect(
      shouldHideFromViewAfterReviewAction("undo", {
        hideFilteredFiles: true,
        hideFilteredFilesEvenWhenSkipped: true,
      }),
    ).toBe(false);
  });
});
