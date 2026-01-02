import type { StoreApi, UseBoundStore } from "zustand";

/**
 * Utility type that extends a Zustand store with auto-generated selectors.
 *
 * Adds a `use` property with hooks for each state key, allowing:
 * ```ts
 * const tagsSortMode = useStore.use.tagsSortMode();
 * const actions = useStore.use.actions();
 * ```
 */
type WithSelectors<TStore> = TStore extends { getState: () => infer T }
  ? TStore & { use: { [K in keyof T]: () => T[K] } }
  : never;

/**
 * Wraps a Zustand store with auto-generated selector hooks.
 *
 * Instead of writing manual selectors like:
 * ```ts
 * export const useTagsSortMode = () => useStore((s) => s.tagsSortMode);
 * ```
 *
 * You can use:
 * ```ts
 * const store = createSelectors(useStoreBase);
 * const tagsSortMode = store.use.tagsSortMode();
 * ```
 *
 * @see https://zustand.docs.pmnd.rs/guides/auto-generating-selectors
 */
export function createSelectors<TStore extends UseBoundStore<StoreApi<object>>>(
  store: TStore,
): WithSelectors<TStore> {
  const result = store as WithSelectors<TStore>;
  result.use = {} as WithSelectors<TStore>["use"];

  for (const key of Object.keys(store.getState())) {
    (result.use as Record<string, () => unknown>)[key] = () =>
      store((state) => state[key as keyof typeof state]);
  }

  return result;
}
