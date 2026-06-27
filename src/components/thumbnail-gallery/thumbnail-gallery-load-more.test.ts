// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from "vitest";
import {
  getThumbnailGalleryFetchReason,
  getThumbnailGalleryFetchThreshold,
  isThumbnailGalleryNearRenderedEnd,
  shouldFetchNextThumbnailGalleryPage,
} from "./thumbnail-gallery-load-more";

const defaultInput = {
  hasNextPage: true,
  isFetchingNextPage: false,
  isFetchInFlight: false,
  loadAll: false,
  totalItems: 256,
  loadedItemsCount: 128,
  visibleItemsCount: 128,
  renderedItemsCount: 128,
  lastItemIndex: 80,
  lanes: 4,
  hasTriggeredNearEndFetch: false,
};

describe("thumbnail gallery load-more trigger", () => {
  it("uses a fixed row-based fetch threshold instead of scaling with loaded items", () => {
    expect(getThumbnailGalleryFetchThreshold(4)).toBe(32);
  });

  it("fetches when the virtual range is near the rendered end", () => {
    expect(
      shouldFetchNextThumbnailGalleryPage({
        ...defaultInput,
        renderedItemsCount: 256,
        lastItemIndex: 224,
      }),
    ).toBe(true);
  });

  it("detects when the virtual range is near the rendered end", () => {
    expect(
      isThumbnailGalleryNearRenderedEnd({
        renderedItemsCount: 256,
        lastItemIndex: 224,
        lanes: 4,
      }),
    ).toBe(true);
  });

  it("does not fetch another page while the virtual range stays near the end", () => {
    expect(
      shouldFetchNextThumbnailGalleryPage({
        ...defaultInput,
        renderedItemsCount: 256,
        loadedItemsCount: 256,
        lastItemIndex: 240,
        hasTriggeredNearEndFetch: true,
      }),
    ).toBe(false);
  });

  it("fetches after the virtual range leaves and re-enters the near-end zone", () => {
    expect(
      getThumbnailGalleryFetchReason({
        ...defaultInput,
        renderedItemsCount: 256,
        loadedItemsCount: 256,
        lastItemIndex: 240,
        hasTriggeredNearEndFetch: false,
      }),
    ).toBe("nearRenderedEnd");
  });

  it("still fetches repeatedly for explicit load-all mode", () => {
    expect(
      shouldFetchNextThumbnailGalleryPage({
        ...defaultInput,
        loadAll: true,
        renderedItemsCount: 256,
        lastItemIndex: 10,
      }),
    ).toBe(true);
  });

  it("does not issue duplicate in-flight fetches", () => {
    expect(
      shouldFetchNextThumbnailGalleryPage({
        ...defaultInput,
        isFetchInFlight: true,
        lastItemIndex: 127,
      }),
    ).toBe(false);
  });
});
