// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from "vitest";
import { getSwipeBindingDescriptor } from "./review-swipe-descriptors";
import type { ReviewSwipeBinding } from "@/stores/review-settings-store";
import type {
  LocalTagServiceInfo,
  RatingServiceInfo,
} from "@/integrations/hydrus-api/models";
import { ServiceType } from "@/integrations/hydrus-api/models";

const localTagService = {
  name: "my tags",
  type: ServiceType.LOCAL_TAG_DOMAIN,
  type_pretty: "local tag domain",
} as LocalTagServiceInfo;

const ratingServices = new Map<string, RatingServiceInfo>([
  [
    "favorites",
    {
      name: "Favorite",
      type: ServiceType.RATING_LIKE,
      type_pretty: "local like/dislike rating service",
    } as RatingServiceInfo,
  ],
  [
    "stars",
    {
      name: "star rating",
      type: ServiceType.RATING_NUMERICAL,
      type_pretty: "local numerical rating service",
      min_stars: 0,
      max_stars: 10,
    } as RatingServiceInfo,
  ],
]);

describe("review swipe descriptors tag actions", () => {
  it("includes add tag actions in swipe descriptors", () => {
    const binding: ReviewSwipeBinding = {
      fileAction: "archive",
      secondaryActions: [
        {
          id: "tag-add-1",
          actionType: "tag",
          type: "add",
          serviceKey: "localTags",
          tag: "series:example",
        },
      ],
    };

    const descriptor = getSwipeBindingDescriptor(
      binding,
      undefined,
      new Map([["localTags", localTagService]]),
    );

    expect(descriptor.label).toBe("Archive\n+series:example");
    expect(descriptor.secondaryActionCount).toBe(1);
  });

  it("keeps full rating service names in swipe descriptor labels", () => {
    const binding: ReviewSwipeBinding = {
      fileAction: "archive",
      secondaryActions: [
        {
          id: "rating-like-1",
          actionType: "rating",
          type: "setLike",
          serviceKey: "favorites",
          value: true,
        },
      ],
    };

    const descriptor = getSwipeBindingDescriptor(binding, ratingServices);

    expect(descriptor.label).toBe("Archive\nFavorite like");
    expect(descriptor.secondaryActionCount).toBe(1);
  });

  it("includes remove tag actions in swipe descriptors", () => {
    const binding: ReviewSwipeBinding = {
      fileAction: "trash",
      secondaryActions: [
        {
          id: "tag-remove-1",
          actionType: "tag",
          type: "remove",
          serviceKey: "localTags",
          tag: "series:example",
        },
      ],
    };

    const descriptor = getSwipeBindingDescriptor(
      binding,
      undefined,
      new Map([["localTags", localTagService]]),
    );

    expect(descriptor.label).toBe("Trash\n-series:example");
  });

  it("formats multiple secondary actions with compact ordered labels", () => {
    const binding: ReviewSwipeBinding = {
      fileAction: "archive",
      secondaryActions: [
        {
          id: "rating-like-1",
          actionType: "rating",
          type: "setLike",
          serviceKey: "favorites",
          value: true,
        },
        {
          id: "rating-inc-1",
          actionType: "rating",
          type: "setNumerical",
          serviceKey: "stars",
          value: 7,
        },
        {
          id: "tag-add-1",
          actionType: "tag",
          type: "add",
          serviceKey: "localTags",
          tag: "series:example",
        },
      ],
    };

    const descriptor = getSwipeBindingDescriptor(
      binding,
      ratingServices,
      new Map([["localTags", localTagService]]),
    );

    expect(descriptor.label).toBe(
      "Archive\nFavorite like\nstar rating 7/10\n+series:example",
    );
    expect(descriptor.secondaryActionCount).toBe(3);
  });

  it("omits skip labels when skip has valid secondary actions", () => {
    const binding: ReviewSwipeBinding = {
      fileAction: "skip",
      secondaryActions: [
        {
          id: "rating-like-1",
          actionType: "rating",
          type: "setLike",
          serviceKey: "favorites",
          value: true,
        },
        {
          id: "tag-add-1",
          actionType: "tag",
          type: "add",
          serviceKey: "localTags",
          tag: "reviewed",
        },
      ],
    };

    const descriptor = getSwipeBindingDescriptor(
      binding,
      ratingServices,
      new Map([["localTags", localTagService]]),
    );

    expect(descriptor.label).toBe("Favorite like\n+reviewed");
  });

  it("ignores persisted incomplete secondary actions in swipe descriptors", () => {
    const binding: ReviewSwipeBinding = {
      fileAction: "archive",
      secondaryActions: [
        {
          id: "rating-incomplete-1",
          actionType: "rating",
          type: "setLike",
          serviceKey: "favorites",
        },
        {
          id: "tag-incomplete-1",
          actionType: "tag",
          type: "add",
          serviceKey: "localTags",
          tag: "",
        },
      ],
    };

    const descriptor = getSwipeBindingDescriptor(
      binding,
      undefined,
      new Map([["localTags", localTagService]]),
    );

    expect(descriptor.label).toBe("Archive");
    expect(descriptor.secondaryActionCount).toBe(0);
  });
});
