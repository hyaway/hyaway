import { useMemo } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { setupCrossTabSync } from "./cross-tab-sync";

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

/**
 * Merge function for recently-viewed entries.
 * Combines entries from both states, keeping the most recent viewedAt per fileId.
 */
function mergeRecentlyViewed(
  persisted: Partial<Omit<RecentlyViewedState, "actions">>,
  current: RecentlyViewedState,
): RecentlyViewedState {
  const persistedEntries = persisted.entries ?? [];
  const currentEntries = current.entries;

  // Merge entries, keeping the most recent viewedAt per fileId
  const merged = new Map<number, RecentlyViewedEntry>();
  for (const entry of [...currentEntries, ...persistedEntries]) {
    const existing = merged.get(entry.fileId);
    if (!existing || entry.viewedAt > existing.viewedAt) {
      merged.set(entry.fileId, entry);
    }
  }

  // Sort by viewedAt descending and apply limit
  const limit = persisted.limit ?? current.limit;
  const mergedEntries = Array.from(merged.values())
    .sort((a, b) => b.viewedAt - a.viewedAt)
    .slice(0, limit);

  return {
    ...current,
    entries: mergedEntries,
    enabled: persisted.enabled ?? current.enabled,
    limit,
  };
}

export const useRecentlyViewedStore = create<RecentlyViewedState>()(
  persist(
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
    {
      name: "recently-viewed",
      storage: createJSONStorage(() => localStorage),
      partialize: ({ actions, ...rest }) => rest,
      merge: (persisted, current) =>
        mergeRecentlyViewed(
          persisted as Partial<Omit<RecentlyViewedState, "actions">>,
          current,
        ),
    },
  ),
);

// Cross-tab sync: rehydrate when other tabs update localStorage
setupCrossTabSync(useRecentlyViewedStore);

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
