import { useMemo } from "react";
import { create } from "zustand";
import { persistNSync } from "persist-and-sync";

export const MAX_RECENTLY_VIEWED_LIMIT = 1000;
export const DEFAULT_RECENTLY_VIEWED_LIMIT = 100;

interface RecentlyViewedEntry {
  fileId: number;
  viewedAt: number; // timestamp
}

type RecentlyViewedState = {
  /** Queue of recently viewed file IDs (most recent first) */
  entries: Array<RecentlyViewedEntry>;
  /** Whether the recently viewed feature is enabled */
  enabled: boolean;
  /** Maximum number of entries to keep */
  limit: number;
  actions: {
    /** Add a file to recently viewed (moves to front if already exists) */
    addViewedFile: (fileId: number) => void;
    /** Remove a specific file from history */
    removeViewedFile: (fileId: number) => void;
    /** Clear all recently viewed history */
    clearHistory: () => void;
    /** Enable or disable the feature */
    setEnabled: (enabled: boolean) => void;
    /** Set the maximum number of entries to keep */
    setLimit: (limit: number) => void;
  };
};

export const useRecentlyViewedStore = create<RecentlyViewedState>()(
  persistNSync(
    (set, get) => ({
      entries: [],
      enabled: true,
      limit: DEFAULT_RECENTLY_VIEWED_LIMIT,
      actions: {
        addViewedFile: (fileId: number) => {
          const { enabled, limit, entries } = get();
          if (!enabled) return;

          const now = Date.now();
          // Remove existing entry for this file if present
          const filtered = entries.filter((e) => e.fileId !== fileId);
          // Add new entry at the beginning
          const newEntries = [{ fileId, viewedAt: now }, ...filtered];
          // Trim to limit
          set({ entries: newEntries.slice(0, limit) });
        },
        removeViewedFile: (fileId: number) => {
          const { entries } = get();
          set({ entries: entries.filter((e) => e.fileId !== fileId) });
        },
        clearHistory: () => {
          set({ entries: [] });
        },
        setEnabled: (enabled: boolean) => {
          set({ enabled });
        },
        setLimit: (limit: number) => {
          const { entries } = get();
          // If reducing limit, trim existing entries
          if (limit < entries.length) {
            set({ limit, entries: entries.slice(0, limit) });
          } else {
            set({ limit });
          }
        },
      },
    }),
    { name: "recently-viewed", exclude: ["actions"] },
  ),
);

// Selector hooks for ergonomic usage
export const useRecentlyViewedEntries = () =>
  useRecentlyViewedStore((state) => state.entries);

export const useRecentlyViewedFileIds = () => {
  const entries = useRecentlyViewedStore((state) => state.entries);
  return useMemo(() => entries.map((e) => e.fileId), [entries]);
};

export const useRecentlyViewedEnabled = () =>
  useRecentlyViewedStore((state) => state.enabled);

export const useRecentlyViewedLimit = () =>
  useRecentlyViewedStore((state) => state.limit);

export const useRecentlyViewedActions = () =>
  useRecentlyViewedStore((state) => state.actions);
