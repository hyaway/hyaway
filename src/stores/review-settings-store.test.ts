// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from "vitest";
import {
  DEFAULT_BINDING_PROFILE_ID,
  DEFAULT_SWIPE_BINDINGS,
  MAX_SWIPE_THRESHOLD,
  MIN_SWIPE_THRESHOLD,
  cloneSwipeBindings,
  getAllSecondarySwipeActions,
  getSortedBindingProfiles,
  getValidSecondarySwipeActions,
  getValidSwipeBindings,
  migrateReviewSettingsState,
  normalizeReviewSwipeBinding,
  normalizeSwipeBindings,
  stripInvalidRatingActions,
  stripInvalidRatingActionsFromBindings,
  stripInvalidTagActions,
  stripInvalidTagActionsFromBindings,
  stripRatingActionsForMissingPermission,
  stripRatingActionsForServices,
  stripRatingActionsForServicesFromBindings,
  stripTagActionsForMissingPermission,
} from "./review-settings-store";
import type {
  LocalTagServiceInfo,
  RatingServiceInfo,
} from "@/integrations/hydrus-api/models";
import type {
  LooseRatingSwipeAction,
  LooseSecondarySwipeAction,
  LooseTagSwipeAction,
  ReviewSwipeBinding,
  SwipeBindings,
} from "./review-settings-store";
import { ServiceType } from "@/integrations/hydrus-api/models";

type LegacyLooseSecondarySwipeAction =
  | LooseSecondarySwipeAction
  | ({ id?: string; actionType: "rating" } & LooseRatingSwipeAction)
  | ({ id?: string; actionType: "tag" } & LooseTagSwipeAction);

const localTagService = {
  name: "my tags",
  type: ServiceType.LOCAL_TAG_DOMAIN,
  type_pretty: "local tag domain",
} as LocalTagServiceInfo;

const ratingService = {
  name: "stars",
  type: ServiceType.RATING_LIKE,
  type_pretty: "like/dislike rating",
} as RatingServiceInfo;

const ratingAction = {
  actionType: "rating",
  type: "setLike",
  serviceKey: "stars",
  value: true,
} satisfies LegacyLooseSecondarySwipeAction;

const tagAction = {
  actionType: "tag",
  type: "add",
  serviceKey: "localTags",
  tag: "series:example",
} satisfies LegacyLooseSecondarySwipeAction;

function expectGeneratedActionId(
  action: LegacyLooseSecondarySwipeAction | undefined,
  actionType: LooseSecondarySwipeAction["actionType"],
) {
  expect(action?.id).toEqual(expect.stringMatching(`^${actionType}:`));
}

function bindingWithSecondaryActions(
  secondaryActions?: Array<LegacyLooseSecondarySwipeAction>,
): ReviewSwipeBinding {
  return {
    fileAction: "archive",
    secondaryActions: secondaryActions as Array<LooseSecondarySwipeAction>,
  };
}

function bindingsWithSecondaryActions(
  secondaryActions?: Array<LegacyLooseSecondarySwipeAction>,
): SwipeBindings {
  return {
    left: {
      fileAction: "archive",
      secondaryActions: secondaryActions as Array<LooseSecondarySwipeAction>,
    },
    right: { fileAction: "trash" },
    up: { fileAction: "skip" },
    down: { fileAction: "undo" },
  };
}

describe("review settings action stripping helpers", () => {
  describe("binding profile helpers", () => {
    it("sorts binding profiles alphabetically by display name", () => {
      expect(
        getSortedBindingProfiles({
          second: {
            id: "second",
            name: "Review",
            bindings: DEFAULT_SWIPE_BINDINGS,
          },
          first: {
            id: "first",
            name: "Default",
            bindings: DEFAULT_SWIPE_BINDINGS,
          },
        }).map((profile) => profile.id),
      ).toEqual(["first", "second"]);
    });

    it("clones secondary swipe actions when cloning bindings", () => {
      const bindings = bindingsWithSecondaryActions([
        { ...ratingAction, id: "rating-action-1" },
      ]);

      const cloned = cloneSwipeBindings(bindings);

      expect(cloned).toEqual(bindings);
      expect(cloned).not.toBe(bindings);
      expect(cloned.left).not.toBe(bindings.left);
      expect(cloned.left.secondaryActions).not.toBe(
        bindings.left.secondaryActions,
      );
      expect(cloned.left.secondaryActions?.[0]).not.toBe(
        bindings.left.secondaryActions?.[0],
      );
    });
  });

  describe("migrateReviewSettingsState", () => {
    it("migrates legacy thresholds and bindings into the current profile shape", () => {
      const legacyBindings = {
        ...DEFAULT_SWIPE_BINDINGS,
        down: { fileAction: "skip" },
      } satisfies SwipeBindings;

      const migrated = migrateReviewSettingsState(
        {
          horizontalThreshold: 0,
          verticalThreshold: 50,
          bindings: legacyBindings,
        },
        0,
      );

      expect(migrated.thresholds).toEqual({
        left: MIN_SWIPE_THRESHOLD,
        right: MIN_SWIPE_THRESHOLD,
        up: MAX_SWIPE_THRESHOLD,
        down: MAX_SWIPE_THRESHOLD,
      });
      expect(migrated.activeBindingProfileId).toBe(DEFAULT_BINDING_PROFILE_ID);
      expect(
        migrated.bindingProfiles[DEFAULT_BINDING_PROFILE_ID].bindings.down,
      ).toEqual({ fileAction: "undo" });
      expect(migrated).not.toHaveProperty("bindings");
    });

    it("normalizes persisted binding profiles in the current version", () => {
      const profileWithGeneratedActionIds = bindingsWithSecondaryActions([
        ratingAction,
      ]);
      const profileWithUndoSecondaryActions = {
        ...DEFAULT_SWIPE_BINDINGS,
        down: {
          fileAction: "undo",
          secondaryActions: [ratingAction as LooseSecondarySwipeAction],
        },
      } satisfies SwipeBindings;

      const migrated = migrateReviewSettingsState(
        {
          activeBindingProfileId: "missing-profile",
          bindingProfiles: {
            first: {
              id: "first",
              name: "Review",
              bindings: profileWithGeneratedActionIds,
            },
            second: {
              id: "second",
              name: "Review",
              bindings: profileWithUndoSecondaryActions,
            },
          },
        },
        5,
      );

      expect(migrated.activeBindingProfileId).toBe("first");
      expect(migrated.bindingProfiles.first.name).toBe("Review");
      expect(migrated.bindingProfiles.second.name).toBe("Review (2)");
      expect(
        migrated.bindingProfiles.first.bindings.left.secondaryActions,
      ).toHaveLength(1);
      expectGeneratedActionId(
        migrated.bindingProfiles.first.bindings.left.secondaryActions?.[0],
        "rating",
      );
      expect(
        migrated.bindingProfiles.second.bindings.down.secondaryActions,
      ).toBeUndefined();
    });

    it("recovers from non-object persisted state", () => {
      const migrated = migrateReviewSettingsState(null, 5);

      expect(migrated.activeBindingProfileId).toBe(DEFAULT_BINDING_PROFILE_ID);
      expect(Object.keys(migrated.bindingProfiles)).toEqual([
        DEFAULT_BINDING_PROFILE_ID,
      ]);
    });
  });

  describe("normalizeReviewSwipeBinding", () => {
    it("preserves duplicate rating actions during normalization", () => {
      const duplicateRatingAction = {
        ...ratingAction,
        value: false,
      } satisfies LegacyLooseSecondarySwipeAction;
      const binding = bindingWithSecondaryActions([
        ratingAction,
        duplicateRatingAction,
        tagAction,
      ]);

      const next = normalizeReviewSwipeBinding(binding);

      expect(next.secondaryActions).toHaveLength(3);
      expect(next.secondaryActions?.[0]).toMatchObject(ratingAction);
      expectGeneratedActionId(next.secondaryActions?.[0], "rating");
      expect(next.secondaryActions?.[1]).toMatchObject(duplicateRatingAction);
      expectGeneratedActionId(next.secondaryActions?.[1], "rating");
      expect(next.secondaryActions?.[2]).toMatchObject(tagAction);
      expectGeneratedActionId(next.secondaryActions?.[2], "tag");
    });

    it("preserves duplicate tag actions during normalization", () => {
      const duplicateTagAction = {
        ...tagAction,
        type: "remove",
      } satisfies LegacyLooseSecondarySwipeAction;
      const otherServiceTagAction = {
        ...tagAction,
        serviceKey: "otherLocalTags",
      } satisfies LegacyLooseSecondarySwipeAction;
      const binding = bindingWithSecondaryActions([
        tagAction,
        duplicateTagAction,
        otherServiceTagAction,
      ]);

      const next = normalizeReviewSwipeBinding(binding);

      expect(next.secondaryActions).toHaveLength(3);
      expect(next.secondaryActions?.[0]).toMatchObject(tagAction);
      expectGeneratedActionId(next.secondaryActions?.[0], "tag");
      expect(next.secondaryActions?.[1]).toMatchObject(duplicateTagAction);
      expectGeneratedActionId(next.secondaryActions?.[1], "tag");
      expect(next.secondaryActions?.[2]).toMatchObject(otherServiceTagAction);
      expectGeneratedActionId(next.secondaryActions?.[2], "tag");
    });

    it("removes secondary actions from undo bindings", () => {
      const binding = bindingWithSecondaryActions([ratingAction, tagAction]);
      binding.fileAction = "undo";

      const next = normalizeReviewSwipeBinding(binding);

      expect(next.secondaryActions).toBeUndefined();
    });

    it("normalizes every binding in a bindings map", () => {
      const bindings = bindingsWithSecondaryActions([
        ratingAction,
        ratingAction,
      ]);

      const next = normalizeSwipeBindings(bindings);

      expect(next).not.toBe(bindings);
      expect(next.left.secondaryActions).toHaveLength(2);
      expect(next.left.secondaryActions?.[0]).toMatchObject(ratingAction);
      expectGeneratedActionId(next.left.secondaryActions?.[0], "rating");
      expect(next.left.secondaryActions?.[1]).toMatchObject(ratingAction);
      expectGeneratedActionId(next.left.secondaryActions?.[1], "rating");
      expect(next.right).toBe(bindings.right);
    });

    it("preserves existing secondary action ids during normalization", () => {
      const ratingActionWithId = {
        ...ratingAction,
        id: "rating-action-1",
      } satisfies LegacyLooseSecondarySwipeAction;
      const tagActionWithId = {
        ...tagAction,
        id: "tag-action-1",
      } satisfies LegacyLooseSecondarySwipeAction;
      const binding = bindingWithSecondaryActions([
        ratingActionWithId,
        tagActionWithId,
      ]);

      const next = normalizeReviewSwipeBinding(binding);

      expect(next.secondaryActions).toEqual([
        ratingActionWithId,
        tagActionWithId,
      ]);
    });

    it("preserves incomplete secondary actions during normalization", () => {
      const incompleteRatingAction = {
        actionType: "rating",
      } satisfies LegacyLooseSecondarySwipeAction;
      const incompleteTagAction = {
        actionType: "tag",
      } satisfies LegacyLooseSecondarySwipeAction;
      const binding = bindingWithSecondaryActions([
        incompleteRatingAction,
        incompleteTagAction,
      ]);

      const next = normalizeReviewSwipeBinding(binding);

      expect(next.secondaryActions).toHaveLength(2);
      expect(next.secondaryActions?.[0]).toMatchObject(incompleteRatingAction);
      expectGeneratedActionId(next.secondaryActions?.[0], "rating");
      expect(next.secondaryActions?.[1]).toMatchObject(incompleteTagAction);
      expectGeneratedActionId(next.secondaryActions?.[1], "tag");
    });
  });

  describe("secondary action selectors", () => {
    it("returns all persisted secondary actions", () => {
      const binding = bindingWithSecondaryActions([ratingAction, tagAction]);

      expect(getAllSecondarySwipeActions(binding)).toEqual([
        ratingAction,
        tagAction,
      ]);
    });

    it("filters invalid rating and tag actions without mutating persisted rows", () => {
      const validRatingAction = {
        ...ratingAction,
        id: "rating-action-1",
      } satisfies LegacyLooseSecondarySwipeAction;
      const validTagAction = {
        ...tagAction,
        id: "tag-action-1",
      } satisfies LegacyLooseSecondarySwipeAction;
      const incompleteRatingAction = {
        actionType: "rating",
      } satisfies LegacyLooseSecondarySwipeAction;
      const incompleteTagAction = {
        actionType: "tag",
      } satisfies LegacyLooseSecondarySwipeAction;
      const binding = bindingWithSecondaryActions([
        validRatingAction,
        incompleteRatingAction,
        validTagAction,
        incompleteTagAction,
      ]);

      const validActions = getValidSecondarySwipeActions(binding, {
        ratingServicesByKey: new Map([["stars", ratingService]]),
        localTagServicesByKey: new Map([["localTags", localTagService]]),
      });

      expect(getAllSecondarySwipeActions(binding)).toHaveLength(4);
      expect(validActions).toEqual([validRatingAction, validTagAction]);
    });

    it("filters invalid secondary actions across bindings", () => {
      const validRatingAction = {
        ...ratingAction,
        id: "rating-action-1",
      } satisfies LegacyLooseSecondarySwipeAction;
      const incompleteRatingAction = {
        actionType: "rating",
      } satisfies LegacyLooseSecondarySwipeAction;
      const bindings = bindingsWithSecondaryActions([
        validRatingAction,
        incompleteRatingAction,
      ]);

      const next = getValidSwipeBindings(bindings, {
        ratingServicesByKey: new Map([["stars", ratingService]]),
      });

      expect(next).not.toBe(bindings);
      expect(next.left.secondaryActions).toEqual([validRatingAction]);
      expect(bindings.left.secondaryActions).toHaveLength(2);
    });
  });

  describe("stripRatingActionsForServices", () => {
    it("strips matching rating actions from a binding", () => {
      const binding = bindingWithSecondaryActions([ratingAction, tagAction]);

      const next = stripRatingActionsForServices(binding, new Set(["stars"]));

      expect(next).not.toBe(binding);
      expect(next.secondaryActions).toEqual([tagAction]);
    });

    it("keeps a binding reference when no rating actions match", () => {
      const binding = bindingWithSecondaryActions([ratingAction, tagAction]);

      const next = stripRatingActionsForServices(
        binding,
        new Set(["otherRating"]),
      );

      expect(next).toBe(binding);
    });

    it("strips matching rating actions across bindings", () => {
      const bindings = bindingsWithSecondaryActions([ratingAction, tagAction]);

      const next = stripRatingActionsForServicesFromBindings(
        bindings,
        new Set(["stars"]),
      );

      expect(next).not.toBe(bindings);
      expect(next.left).not.toBe(bindings.left);
      expect(next.left.secondaryActions).toEqual([tagAction]);
      expect(next.right).toBe(bindings.right);
    });

    it("keeps a bindings reference when service keys are empty", () => {
      const bindings = bindingsWithSecondaryActions([ratingAction]);

      const next = stripRatingActionsForServicesFromBindings(
        bindings,
        new Set(),
      );

      expect(next).toBe(bindings);
    });
  });

  describe("stripInvalidRatingActions", () => {
    it("strips rating actions for missing rating services", () => {
      const bindings = bindingsWithSecondaryActions([ratingAction]);

      const next = stripInvalidRatingActionsFromBindings(
        bindings,
        new Map([["otherRating", ratingService]]),
      );

      expect(next.left.secondaryActions).toBeUndefined();
    });

    it("keeps rating actions for available rating services", () => {
      const bindings = bindingsWithSecondaryActions([ratingAction]);

      const next = stripInvalidRatingActionsFromBindings(
        bindings,
        new Map([["stars", ratingService]]),
      );

      expect(next).toBe(bindings);
    });

    it("preserves other secondary actions when stripping invalid rating actions", () => {
      const binding = bindingWithSecondaryActions([ratingAction, tagAction]);

      const next = stripInvalidRatingActions(
        binding,
        new Map([["otherRating", ratingService]]),
      );

      expect(next.secondaryActions).toEqual([tagAction]);
    });
  });

  describe("stripRatingActionsForMissingPermission", () => {
    it("strips rating actions when Edit File Ratings permission is missing", () => {
      const bindings = bindingsWithSecondaryActions([ratingAction]);

      const next = stripRatingActionsForMissingPermission(bindings, false);

      expect(next.left.secondaryActions).toBeUndefined();
    });

    it("preserves tag actions when Edit File Ratings permission is missing", () => {
      const bindings = bindingsWithSecondaryActions([ratingAction, tagAction]);

      const next = stripRatingActionsForMissingPermission(bindings, false);

      expect(next.left.secondaryActions).toEqual([tagAction]);
    });

    it("keeps bindings unchanged when Edit File Ratings permission is present", () => {
      const bindings = bindingsWithSecondaryActions([ratingAction]);

      const next = stripRatingActionsForMissingPermission(bindings, true);

      expect(next).toBe(bindings);
    });
  });

  describe("stripInvalidTagActions", () => {
    it("strips tag actions for missing local tag services", () => {
      const bindings = bindingsWithSecondaryActions([
        {
          actionType: "tag",
          type: "add",
          serviceKey: "missingTags",
          tag: "series:example",
        },
      ]);

      const next = stripInvalidTagActionsFromBindings(
        bindings,
        new Map([["localTags", localTagService]]),
      );

      expect(next.left.secondaryActions).toBeUndefined();
    });

    it("strips tag actions for keys absent from local tag services", () => {
      const bindings = bindingsWithSecondaryActions([
        {
          actionType: "tag",
          type: "add",
          serviceKey: "stars",
          tag: "series:example",
        },
      ]);

      const next = stripInvalidTagActionsFromBindings(
        bindings,
        new Map([["localTags", localTagService]]),
      );

      expect(next.left.secondaryActions).toBeUndefined();
    });

    it("keeps tag actions for available local tag services", () => {
      const bindings = bindingsWithSecondaryActions([
        {
          actionType: "tag",
          type: "remove",
          serviceKey: "localTags",
          tag: "series:example",
        },
      ]);

      const next = stripInvalidTagActionsFromBindings(
        bindings,
        new Map([["localTags", localTagService]]),
      );

      expect(next).toBe(bindings);
    });

    it("preserves other secondary actions when stripping invalid tag actions", () => {
      const binding = bindingWithSecondaryActions([
        ratingAction,
        {
          actionType: "tag",
          type: "remove",
          serviceKey: "missingTags",
          tag: "series:example",
        },
      ]);

      const next = stripInvalidTagActions(
        binding,
        new Map([["localTags", localTagService]]),
      );

      expect(next.secondaryActions).toEqual([ratingAction]);
    });
  });

  describe("stripTagActionsForMissingPermission", () => {
    it("strips tag actions when Edit File Tags permission is missing", () => {
      const bindings = bindingsWithSecondaryActions([tagAction]);

      const next = stripTagActionsForMissingPermission(bindings, false);

      expect(next.left.secondaryActions).toBeUndefined();
    });

    it("preserves rating actions when Edit File Tags permission is missing", () => {
      const bindings = bindingsWithSecondaryActions([ratingAction, tagAction]);

      const next = stripTagActionsForMissingPermission(bindings, false);

      expect(next.left.secondaryActions).toEqual([ratingAction]);
    });

    it("keeps bindings unchanged when Edit File Tags permission is present", () => {
      const bindings = bindingsWithSecondaryActions([tagAction]);

      const next = stripTagActionsForMissingPermission(bindings, true);

      expect(next).toBe(bindings);
    });
  });
});
