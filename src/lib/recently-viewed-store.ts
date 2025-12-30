import { useMemo } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { setupCrossTabSync } from "./cross-tab-sync";

export const MAX_RECENTLY_VIEWED_LIMIT = 1000;
export const DEFAULT_RECENTLY_VIEWED_LIMIT = 100;
export const MAX_RETENTION_HOURS = 168; // 7 days (for UI)
const MS_PER_HOUR = 60 * 60 * 1000;
export const DEFAULT_RETENTION_MS = 24 * MS_PER_HOUR; // 1 day

interface RecentlyViewedEntry {
  fileId: number;
  viewedAt: number; // timestamp
  expiresAt: number; // timestamp, 0 = never expires
}

type RecentlyViewedState = {
  /** Queue of recently viewed file IDs (most recent first) */
  entries: Array<RecentlyViewedEntry>;
  /** Whether the recently viewed feature is enabled */
  enabled: boolean;
  /** Maximum number of entries to keep */
  limit: number;
  /** How long to keep entries in ms (0 = forever) */
  retentionMs: number;
  /** Timestamp of last clear - entries older than this are ignored during merge */
  clearedAt: number;
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
    /** Set how long to keep entries in hours (0 = forever) */
    setRetentionHours: (hours: number) => void;
  };
};

/**
 * Merge function for recently-viewed entries.
 * Combines entries from both states, keeping the most recent viewedAt per fileId.
 * Respects clearedAt timestamp - entries older than the most recent clear are ignored.
 */
function mergeRecentlyViewed(
  persisted: Partial<Omit<RecentlyViewedState, "actions">>,
  current: RecentlyViewedState,
): RecentlyViewedState {
  const persistedEntries = persisted.entries ?? [];
  const currentEntries = current.entries;

  // Use the most recent clearedAt timestamp
  const clearedAt = Math.max(persisted.clearedAt ?? 0, current.clearedAt);
  const retentionMs = persisted.retentionMs ?? current.retentionMs;
  const now = Date.now();

  // Merge entries, filtering out cleared and expired entries
  // and keeping the most recent viewedAt per fileId
  const merged = new Map<number, RecentlyViewedEntry>();
  for (const entry of [...currentEntries, ...persistedEntries]) {
    // Skip entries that were viewed before the last clear
    if (entry.viewedAt <= clearedAt) continue;
    // Skip expired entries (expiresAt > 0 means it has an expiration)
    if (entry.expiresAt > 0 && entry.expiresAt < now) continue;

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
    retentionMs,
    clearedAt,
  };
}

export const useRecentlyViewedStore = create<RecentlyViewedState>()(
  persist(
    (set, get) => ({
      entries: [],
      enabled: true,
      limit: DEFAULT_RECENTLY_VIEWED_LIMIT,
      retentionMs: DEFAULT_RETENTION_MS,
      clearedAt: 0,
      actions: {
        addViewedFile: (fileId: number) => {
          const { enabled, limit, retentionMs, entries } = get();
          if (!enabled) return;

          const now = Date.now();
          const expiresAt = retentionMs > 0 ? now + retentionMs : 0;
          // Remove existing entry for this file if present
          const filtered = entries.filter((e) => e.fileId !== fileId);
          // Add new entry at the beginning
          const newEntries = [
            { fileId, viewedAt: now, expiresAt },
            ...filtered,
          ];
          // Trim to limit
          set({ entries: newEntries.slice(0, limit) });
        },
        removeViewedFile: (fileId: number) => {
          const { entries } = get();
          set({ entries: entries.filter((e) => e.fileId !== fileId) });
        },
        clearHistory: () => {
          // Set clearedAt to now so merge ignores older entries from other tabs
          set({ entries: [], clearedAt: Date.now() });
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
        setRetentionHours: (hours: number) => {
          const retentionMs = hours * MS_PER_HOUR;
          const { entries } = get();
          // Update expiresAt for all existing entries based on new retention
          const updatedEntries = entries.map((entry) => ({
            ...entry,
            expiresAt: retentionMs > 0 ? entry.viewedAt + retentionMs : 0,
          }));
          set({ retentionMs, entries: updatedEntries });
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

export const useRecentlyViewedRetentionHours = () =>
  useRecentlyViewedStore((state) =>
    Math.round(state.retentionMs / MS_PER_HOUR),
  );

export const useRecentlyViewedActions = () =>
  useRecentlyViewedStore((state) => state.actions);
