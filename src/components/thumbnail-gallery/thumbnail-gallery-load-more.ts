// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

const FETCH_AHEAD_ROWS = 8;
const MIN_FETCH_AHEAD_ITEMS = 16;

export type ThumbnailGalleryFetchReason =
  | "loadAll"
  | "loadedButNothingVisible"
  | "nearRenderedEnd";

type ThumbnailGalleryFetchInput = {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  isFetchInFlight: boolean;
  loadAll?: boolean;
  totalItems: number;
  loadedItemsCount: number;
  visibleItemsCount: number;
  renderedItemsCount: number;
  lastItemIndex: number | undefined;
  lanes: number;
  hasTriggeredNearEndFetch: boolean;
};

export function getThumbnailGalleryFetchThreshold(lanes: number) {
  // Keep the load-ahead window tied to the visible grid, not total loaded items.
  // A proportional threshold can chain-fetch after sorting or remeasurement.
  return Math.max(MIN_FETCH_AHEAD_ITEMS, lanes * FETCH_AHEAD_ROWS);
}

export function isThumbnailGalleryNearRenderedEnd({
  renderedItemsCount,
  lastItemIndex,
  lanes,
}: {
  renderedItemsCount: number;
  lastItemIndex: number | undefined;
  lanes: number;
}) {
  const fetchThreshold = Math.min(
    getThumbnailGalleryFetchThreshold(lanes),
    renderedItemsCount,
  );

  return (
    lastItemIndex !== undefined &&
    lastItemIndex >= renderedItemsCount - fetchThreshold
  );
}

export function getThumbnailGalleryFetchReason({
  hasNextPage,
  isFetchingNextPage,
  isFetchInFlight,
  loadAll,
  totalItems,
  loadedItemsCount,
  visibleItemsCount,
  renderedItemsCount,
  lastItemIndex,
  lanes,
  hasTriggeredNearEndFetch,
}: ThumbnailGalleryFetchInput): ThumbnailGalleryFetchReason | undefined {
  if (!hasNextPage || isFetchingNextPage || isFetchInFlight) return;

  // Explicit eager modes should keep draining pages until TanStack reports none left.
  if (loadAll) return "loadAll";

  const loadedButNothingVisible =
    totalItems > 0 && loadedItemsCount > 0 && visibleItemsCount === 0;
  if (loadedButNothingVisible) return "loadedButNothingVisible";

  const isNearRenderedEnd = isThumbnailGalleryNearRenderedEnd({
    renderedItemsCount,
    lastItemIndex,
    lanes,
  });

  // Normal infinite scroll fetches once per entry into the near-end zone.
  // This prevents namespace resorting or masonry remeasurement from fetching
  // additional pages while the viewport still represents the same approach.
  return isNearRenderedEnd && !hasTriggeredNearEndFetch
    ? "nearRenderedEnd"
    : undefined;
}

export function shouldFetchNextThumbnailGalleryPage(
  input: ThumbnailGalleryFetchInput,
) {
  return getThumbnailGalleryFetchReason(input) !== undefined;
}
