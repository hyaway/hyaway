// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from "vitest";
import {
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
  ReviewSwipeBinding,
  SecondarySwipeAction,
  SwipeBindings,
} from "./review-settings-store";
import { ServiceType } from "@/integrations/hydrus-api/models";

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
} satisfies SecondarySwipeAction;

const tagAction = {
  actionType: "tag",
  type: "add",
  serviceKey: "localTags",
  tag: "series:example",
} satisfies SecondarySwipeAction;

function bindingWithSecondaryActions(
  secondaryActions?: Array<SecondarySwipeAction>,
): ReviewSwipeBinding {
  return {
    fileAction: "archive",
    secondaryActions,
  };
}

function bindingsWithSecondaryActions(
  secondaryActions?: Array<SecondarySwipeAction>,
): SwipeBindings {
  return {
    left: {
      fileAction: "archive",
      secondaryActions,
    },
    right: { fileAction: "trash" },
    up: { fileAction: "skip" },
    down: { fileAction: "undo" },
  };
}

describe("review settings action stripping helpers", () => {
  describe("normalizeReviewSwipeBinding", () => {
    it("keeps the first rating action for each rating service", () => {
      const duplicateRatingAction = {
        ...ratingAction,
        value: false,
      } satisfies SecondarySwipeAction;
      const binding = bindingWithSecondaryActions([
        ratingAction,
        duplicateRatingAction,
        tagAction,
      ]);

      const next = normalizeReviewSwipeBinding(binding);

      expect(next.secondaryActions).toEqual([ratingAction, tagAction]);
    });

    it("keeps the first tag action for each local tag service and tag", () => {
      const duplicateTagAction = {
        ...tagAction,
        type: "remove",
      } satisfies SecondarySwipeAction;
      const otherServiceTagAction = {
        ...tagAction,
        serviceKey: "otherLocalTags",
      } satisfies SecondarySwipeAction;
      const binding = bindingWithSecondaryActions([
        tagAction,
        duplicateTagAction,
        otherServiceTagAction,
      ]);

      const next = normalizeReviewSwipeBinding(binding);

      expect(next.secondaryActions).toEqual([tagAction, otherServiceTagAction]);
    });

    it("removes secondary actions from undo bindings", () => {
      const binding: ReviewSwipeBinding = {
        fileAction: "undo",
        secondaryActions: [ratingAction, tagAction],
      };

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
      expect(next.left.secondaryActions).toEqual([ratingAction]);
      expect(next.right).toBe(bindings.right);
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
