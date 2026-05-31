// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { createContext, useContext, useMemo } from "react";
import type { ReviewSource } from "@/stores/review-queue-store";
import type { WatchHistoryEntry } from "@/stores/watch-history-store";

/**
 * Display mode for the thumbnail info slot.
 * - `filesize`: Show file size (default)
 * - `views`: Show total view count from Hydrus
 * - `viewtime`: Show total viewtime from Hydrus
 * - `lastViewedLocal`: Show last viewed time from local watch history
 * - `lastViewedRemote`: Show last viewed time from Hydrus API
 */
export type ThumbnailInfoMode =
  | "filesize"
  | "views"
  | "viewtime"
  | "lastViewedLocal"
  | "lastViewedRemote";

interface ThumbnailGalleryContextValue {
  /** What to show in the info slot (default: 'filesize') */
  infoMode: ThumbnailInfoMode;
  /** Local watch history entries for looking up lastViewedLocal */
  localHistoryEntries?: Array<WatchHistoryEntry>;
  /** All file IDs in the gallery (for review from here) */
  fileIds?: Array<number>;
  /** Source view to hide files from when review hide settings apply. */
  reviewSource?: ReviewSource;
}

const ThumbnailGalleryContext = createContext<ThumbnailGalleryContextValue>({
  infoMode: "filesize",
});

export interface ThumbnailGalleryProviderProps {
  children: React.ReactNode;
  /** What to show in the info slot (default: 'filesize') */
  infoMode?: ThumbnailInfoMode;
  /** Local watch history entries for looking up lastViewedLocal */
  localHistoryEntries?: Array<WatchHistoryEntry>;
  /** All file IDs in the gallery (for review from here) */
  fileIds?: Array<number>;
  /** Source view to hide files from when review hide settings apply. */
  reviewSource?: ReviewSource;
}

export function ThumbnailGalleryProvider({
  children,
  infoMode = "filesize",
  localHistoryEntries,
  fileIds,
  reviewSource,
}: ThumbnailGalleryProviderProps) {
  const value = useMemo(
    () => ({ infoMode, localHistoryEntries, fileIds, reviewSource }),
    [infoMode, localHistoryEntries, fileIds, reviewSource],
  );

  return (
    <ThumbnailGalleryContext.Provider value={value}>
      {children}
    </ThumbnailGalleryContext.Provider>
  );
}

export function useThumbnailGalleryContext() {
  return useContext(ThumbnailGalleryContext);
}
