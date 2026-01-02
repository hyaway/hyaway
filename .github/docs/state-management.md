# State Management

> **Status**: Active pattern used throughout the codebase

Hyaway uses **Zustand** for client-side state management with auto-generated selectors for ergonomic access.

## Store Files

| Store         | File                                             | Purpose                  |
| ------------- | ------------------------------------------------ | ------------------------ |
| Theme         | `lib/theme-store.ts`                             | Dark/light mode          |
| UX Settings   | `lib/settings-store.ts`                          | UI preferences           |
| History       | `lib/watch-history-store.ts`                     | Watch history tracking   |
| Sidebar       | `lib/sidebar-store.ts`                           | Sidebar open/close state |
| Hydrus Config | `integrations/hydrus-api/hydrus-config-store.ts` | API connection           |

## Usage Pattern

Each store exports two ways to access state:

### 1. Shorthand Hook (Recommended)

Use the shorthand export for cleaner syntax:

```tsx
import { useTheme } from "@/lib/theme-store";
import { useSettings } from "@/lib/settings-store";
import { useWatchHistory } from "@/lib/watch-history-store";
import { useSidebar } from "@/lib/sidebar-store";

function MyComponent() {
  // Access individual state values
  const activeTheme = useTheme.activeTheme();
  const galleryMaxLanes = useSettings.galleryMaxLanes();
  const entries = useWatchHistory.entries();
  const leftOpen = useSidebar.leftSidebarOpen();

  // Access actions
  const { setThemePreference } = useTheme.actions();
  const { setGalleryMaxLanes } = useSettings.actions();
  const { addViewedFile } = useWatchHistory.actions();
  const { toggleLeftSidebar } = useSidebar.actions();

  return <div>...</div>;
}
```

### 2. Full Store Access

For advanced use cases (subscriptions, non-React contexts), use the full store:

```tsx
import { useThemeStore } from "@/lib/theme-store";

// Direct selector (equivalent to shorthand)
const activeTheme = useThemeStore((s) => s.activeTheme);

// Snapshot getters (outside React)
import { getActiveThemeSnapshot } from "@/lib/theme-store";
const theme = getActiveThemeSnapshot();
```

## Shorthand Exports

Each store provides a shorthand export that aliases `.use`:

| Store       | Full Store             | Shorthand         |
| ----------- | ---------------------- | ----------------- |
| Theme       | `useThemeStore`        | `useTheme`        |
| UX Settings | `useSettingsStore`     | `useSettings`     |
| History     | `useWatchHistoryStore` | `useWatchHistory` |
| Sidebar     | `useSidebarStore`      | `useSidebar`      |

## Store Structure

All stores follow a consistent pattern:

```tsx
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createSelectors } from "./create-selectors";
import { setupCrossTabSync } from "./cross-tab-sync";

type MyState = {
  someValue: string;
  anotherValue: number;
  actions: {
    setSomeValue: (value: string) => void;
    setAnotherValue: (value: number) => void;
  };
};

const useMyStoreBase = create<MyState>()(
  persist(
    (set) => ({
      someValue: "default",
      anotherValue: 0,
      actions: {
        setSomeValue: (someValue) => set({ someValue }),
        setAnotherValue: (anotherValue) => set({ anotherValue }),
      },
    }),
    {
      name: "my-store", // localStorage key
      partialize: ({ actions, ...rest }) => rest, // Don't persist actions
    },
  ),
);

// Full store with auto-generated selectors
export const useMyStore = createSelectors(useMyStoreBase);

// Shorthand for .use
export const useMy = useMyStore.use;

// Cross-tab sync
setupCrossTabSync(useMyStore);
```

## Creating a New Store

### Step 1: Define State Type

```tsx
type FeatureState = {
  enabled: boolean;
  limit: number;
  actions: {
    setEnabled: (enabled: boolean) => void;
    setLimit: (limit: number) => void;
  };
};
```

### Step 2: Create Store

```tsx
const useFeatureStoreBase = create<FeatureState>()(
  persist(
    (set) => ({
      enabled: true,
      limit: 100,
      actions: {
        setEnabled: (enabled) => set({ enabled }),
        setLimit: (limit) => set({ limit }),
      },
    }),
    {
      name: "feature-storage",
      partialize: ({ actions, ...rest }) => rest,
    },
  ),
);
```

### Step 3: Add Selectors and Exports

````tsx
export const useFeatureStore = createSelectors(useFeatureStoreBase);

/**
 * Shorthand for `useFeatureStore.use`.
 * @example
 * ```tsx
 * const enabled = useFeature.enabled();
 * const { setLimit } = useFeature.actions();
 * ```
 */
export const useFeature = useFeatureStore.use;
````

### Step 4: Enable Cross-Tab Sync (if needed)

```tsx
import { setupCrossTabSync } from "./cross-tab-sync";
setupCrossTabSync(useFeatureStore);
```

## Key Conventions

### Actions Namespace

All mutations are grouped under an `actions` object:

```tsx
// ✅ Correct
const { setEnabled, setLimit } = useFeature.actions();

// ❌ Don't put setters at top level
const setEnabled = useFeature.setEnabled(); // Won't work
```

### Partialize Actions

Always exclude `actions` from persistence:

```tsx
persist(
  (set) => ({ ... }),
  {
    partialize: ({ actions, ...rest }) => rest,
  },
)
```

### Cross-Tab Sync

Enable for stores that should sync across browser tabs:

```tsx
setupCrossTabSync(useMyStore);
```

This uses `BroadcastChannel` to sync state changes.

## Auto-Generated Selectors

The `createSelectors` utility (from `lib/create-selectors.ts`) adds a `.use` property with hooks for each state key:

```tsx
const store = createSelectors(useStoreBase);

// These are equivalent:
const value = store.use.someValue();
const value = store((s) => s.someValue);
```

Benefits:

- **Less boilerplate** - No manual selector exports
- **Type-safe** - Full TypeScript inference
- **Consistent API** - Same pattern across all stores
