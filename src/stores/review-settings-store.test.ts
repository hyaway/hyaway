// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from "vitest";
import {
  stripInvalidTagActions,
  stripInvalidTagActionsFromBindings,
  stripRatingActionsForServices,
  stripRatingActionsForServicesFromBindings,
  stripTagActionsForMissingPermission,
} from "./review-settings-store";
import type { LocalTagServiceInfo } from "@/integrations/hydrus-api/models";
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
