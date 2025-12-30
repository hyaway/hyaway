import { useMemo } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { setupCrossTabSync } from "./cross-tab-sync";

export const MAX_HISTORY_LIMIT = 1000;
export const DEFAULT_HISTORY_LIMIT = 100;

interface HistoryEntry {
  fileId: number;
  viewedAt: number; // timestamp
}

type HistoryState = {
  /** Queue of viewed file IDs (most recent first) */
  entries: Array<HistoryEntry>;
  /** Whether the history feature is enabled */
  enabled: boolean;
  /** Maximum number of entries to keep */
  limit: number;
  /** Timestamp of last clear - entries older than this are ignored during merge */
  clearedAt: number;
  actions: {
    /** Add a file to history (moves to front if already exists) */
    addViewedFile: (fileId: number) => void;
    /** Remove a specific file from history */
    removeViewedFile: (fileId: number) => void;
    /** Clear all history */
    clearHistory: () => void;
    /** Enable or disable the feature */
    setEnabled: (enabled: boolean) => void;
    /** Set the maximum number of entries to keep */
    setLimit: (limit: number) => void;
  };
};

/**
 * Merge function for history entries.
 * Combines entries from both states, keeping the most recent viewedAt per fileId.
 * Respects clearedAt timestamp - entries older than the most recent clear are ignored.
 */
function mergeHistory(
  persisted: Partial<Omit<HistoryState, "actions">>,
  current: HistoryState,
): HistoryState {
  const persistedEntries = persisted.entries ?? [];
  const currentEntries = current.entries;

  // Use the most recent clearedAt timestamp
  const clearedAt = Math.max(persisted.clearedAt ?? 0, current.clearedAt);

  // Merge entries, filtering out cleared entries
  // and keeping the most recent viewedAt per fileId
  const merged = new Map<number, HistoryEntry>();
  for (const entry of [...currentEntries, ...persistedEntries]) {
    // Skip entries that were viewed before the last clear
    if (entry.viewedAt <= clearedAt) continue;

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
    clearedAt,
  };
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set, get) => ({
      entries: [],
      enabled: true,
      limit: DEFAULT_HISTORY_LIMIT,
      clearedAt: 0,
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
      },
    }),
    {
      name: "history",
      storage: createJSONStorage(() => localStorage),
      partialize: ({ actions, ...rest }) => rest,
      merge: (persisted, current) =>
        mergeHistory(
          persisted as Partial<Omit<HistoryState, "actions">>,
          current,
        ),
    },
  ),
);

// Cross-tab sync: rehydrate when other tabs update localStorage
setupCrossTabSync(useHistoryStore);

// Selector hooks for ergonomic usage
export const useHistoryEntries = () =>
  useHistoryStore((state) => state.entries);

export const useHistoryFileIds = () => {
  const entries = useHistoryStore((state) => state.entries);
  return useMemo(() => entries.map((e) => e.fileId), [entries]);
};

export const useHistoryEnabled = () =>
  useHistoryStore((state) => state.enabled);

export const useHistoryLimit = () => useHistoryStore((state) => state.limit);

export const useHistoryActions = () =>
  useHistoryStore((state) => state.actions);
