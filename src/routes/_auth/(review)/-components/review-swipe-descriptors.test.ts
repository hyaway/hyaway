// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from "vitest";
import {
  formatTagAction,
  formatTagActionShort,
  getSwipeBindingDescriptor,
} from "./review-swipe-descriptors";
import type { ReviewSwipeBinding } from "@/stores/review-settings-store";
import type { LocalTagServiceInfo } from "@/integrations/hydrus-api/models";
import { ServiceType } from "@/integrations/hydrus-api/models";

const localTagService = {
  name: "my tags",
  type: ServiceType.LOCAL_TAG_DOMAIN,
  type_pretty: "local tag domain",
} as LocalTagServiceInfo;

describe("review swipe descriptors tag actions", () => {
  it("formats full add tag action labels with service names", () => {
    expect(
      formatTagAction(
        { type: "add", serviceKey: "localTags", tag: "series:example" },
        new Map([["localTags", localTagService]]),
      ),
    ).toBe("add series:example to my tags");
  });

  it("formats full remove tag action labels with service names", () => {
    expect(
      formatTagAction(
        { type: "remove", serviceKey: "localTags", tag: "series:example" },
        new Map([["localTags", localTagService]]),
      ),
    ).toBe("remove series:example from my tags");
  });

  it("formats short add and remove tag action labels", () => {
    expect(
      formatTagActionShort({
        type: "add",
        serviceKey: "localTags",
        tag: "series:example",
      }),
    ).toBe("+series:example");
    expect(
      formatTagActionShort({
        type: "remove",
        serviceKey: "localTags",
        tag: "series:example",
      }),
    ).toBe("-series:example");
  });

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

    expect(descriptor.label).toBe("Archive + add series:example to my tags");
    expect(descriptor.shortLabel).toBe("Archive +series:example");
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

    expect(descriptor.label).toBe("Trash + remove series:example from my tags");
    expect(descriptor.shortLabel).toBe("Trash -series:example");
  });

  it("summarizes multiple secondary actions with counts", () => {
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
          type: "incDecDelta",
          serviceKey: "increment",
          delta: 1,
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
      undefined,
      new Map([["localTags", localTagService]]),
    );

    expect(descriptor.label).toBe("Archive + 2 ratings, 1 tag");
    expect(descriptor.shortLabel).toBe("Archive +2R +1T");
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
    expect(descriptor.shortLabel).toBe("Archive");
  });
});
