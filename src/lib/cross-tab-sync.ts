// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

/**
 * Cross-tab synchronization utilities for Zustand stores with persist middleware.
 *
 * This module provides a helper to sync Zustand store state across browser tabs
 * by listening for storage events and triggering rehydration.
 *
 * It leverages Zustand's persist middleware's built-in merge option for handling
 * concurrent updates, which is cleaner and more robust than manual state merging.
 */

/**
 * A store with persist middleware has a `persist` property with these methods.
 */
interface PersistApi {
  persist: {
    getOptions: () => { name?: string };
    rehydrate: () => Promise<void> | void;
  };
}

/**
 * Sets up cross-tab synchronization for a Zustand store with persist middleware.
 *
 * When another tab updates localStorage, this triggers a rehydration which
 * uses the persist middleware's `merge` option to handle the incoming state.
 *
 * @param store - The Zustand store with persist middleware
 * @returns Cleanup function to remove the event listener
 *
 * @example
 * ```ts
 * const useMyStore = create<MyState>()(
 *   persist(
 *     (set) => ({ ... }),
 *     {
 *       name: "hyaway-my-store",
 *       // Optional: custom merge for complex state
 *       merge: (persisted, current) => deepMerge(current, persisted),
 *     },
 *   ),
 * );
 *
 * // Enable cross-tab sync
 * setupCrossTabSync(useMyStore);
 * ```
 */
export function setupCrossTabSync(store: PersistApi): () => void {
  const handleStorageEvent = (event: StorageEvent) => {
    const storageName = store.persist.getOptions().name;
    if (event.key === storageName && event.newValue) {
      store.persist.rehydrate();
    }
  };

  if (typeof window !== "undefined") {
    window.addEventListener("storage", handleStorageEvent);
  }

  return () => {
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", handleStorageEvent);
    }
  };
}
