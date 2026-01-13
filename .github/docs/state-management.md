# State Management

> **Status**: Active pattern used throughout the codebase

hyAway uses **Zustand** for client-side state management with explicit selector hooks for ergonomic access.

## Store Files

| Store           | File                                             | Purpose                |
| --------------- | ------------------------------------------------ | ---------------------- |
| Theme           | `stores/theme-store.ts`                          | Dark/light mode        |
| Gallery         | `stores/gallery-settings-store.ts`               | Gallery preferences    |
| File Viewer     | `stores/file-viewer-settings-store.ts`           | Viewer preferences     |
| Pages           | `stores/pages-settings-store.ts`                 | Pages layout           |
| Search Limits   | `stores/search-limits-store.ts`                  | Query/gallery limits   |
| Tags            | `stores/tags-settings-store.ts`                  | Tag sorting mode       |
| History         | `stores/watch-history-store.ts`                  | Watch history tracking |
| Sidebar         | `stores/sidebar-store.ts`                        | Sidebar persistence    |
| Review Queue    | `stores/review-queue-store.ts`                   | Review queue state     |
| Review Settings | `stores/review-settings-store.ts`                | Review UI preferences  |
| Hydrus Config   | `integrations/hydrus-api/hydrus-config-store.ts` | API connection         |

## Usage Pattern

Each store exports individual selector hooks for each piece of state:

```tsx
import { useActiveTheme, useThemeActions } from "@/stores/theme-store";
import {
  useGalleryMaxLanes,
  useGallerySettingsActions,
} from "@/stores/gallery-settings-store";
import {
  useWatchHistoryEntries,
  useWatchHistoryActions,
} from "@/stores/watch-history-store";

function MyComponent() {
  // Access individual state values via dedicated hooks
  const activeTheme = useActiveTheme();
  const galleryMaxLanes = useGalleryMaxLanes();
  const entries = useWatchHistoryEntries();

  // Access actions via actions hook
  const { setThemePreference } = useThemeActions();
  const { setLanesRange } = useGallerySettingsActions();
  const { addViewedFile } = useWatchHistoryActions();

  return <div>...</div>;
}
```

### Direct Store Access

For advanced use cases (subscriptions, non-React contexts), use the store directly:

```tsx
import { useThemeStore } from "@/stores/theme-store";

// Direct selector
const activeTheme = useThemeStore((s) => s.activeTheme);

// Snapshot getters (outside React)
import { getActiveThemeSnapshot } from "@/stores/theme-store";
const theme = getActiveThemeSnapshot();
```

## Available Hooks

### Theme Store (`stores/theme-store.ts`)

| Hook                 | Returns                         |
| -------------------- | ------------------------------- |
| `useActiveTheme`     | `"dark" \| "light"`             |
| `useThemePreference` | `"dark" \| "light" \| "system"` |
| `useThemeHydrated`   | `boolean`                       |
| `useThemeActions`    | `{ setThemePreference, ... }`   |

### Search Limits Store (`stores/search-limits-store.ts`)

| Hook                     | Returns                 |
| ------------------------ | ----------------------- |
| `useAllLimits`           | `number`                |
| `useRecentFilesLimit`    | `number`                |
| `useRecentFilesDays`     | `number`                |
| `useRandomInboxLimit`    | `number`                |
| `useRemoteHistoryLimit`  | `number`                |
| `useMostViewedLimit`     | `number`                |
| `useLongestViewedLimit`  | `number`                |
| `useSearchLimitsActions` | `{ setAllLimits, ... }` |

### Watch History Store (`stores/watch-history-store.ts`)

| Hook                     | Returns                                |
| ------------------------ | -------------------------------------- |
| `useWatchHistoryEntries` | `Array<{ fileId, viewedAt }>`          |
| `useWatchHistoryFileIds` | `Array<number>` (memoized)             |
| `useWatchHistoryEnabled` | `boolean`                              |
| `useWatchHistoryLimit`   | `number`                               |
| `useWatchHistoryActions` | `{ addViewedFile, clearHistory, ... }` |

### Review Settings Store (`stores/review-settings-store.ts`)

| Hook                        | Returns                                              |
| --------------------------- | ---------------------------------------------------- |
| `useReviewShortcutsEnabled` | `boolean`                                            |
| `useReviewGesturesEnabled`  | `boolean`                                            |
| `useReviewSettingsActions`  | `{ setShortcutsEnabled, setGesturesEnabled, reset }` |

> **Note:** The sidebar store uses `useSidebarSide(side)` for bound access—see [Sidebar Store](#sidebar-store) below.

## Sidebar Store

The sidebar store manages open/closed state for left and right sidebars, with separate desktop and mobile states.

### Basic Usage

For most cases, use `useSidebarSide(side)` which returns bound state and actions:

```tsx
import { useSidebarSide } from "@/stores/sidebar-store";

function MyComponent() {
  const {
    desktopOpen,
    mobileOpen,
    setDesktopOpen,
    setMobileOpen,
    toggleDesktop,
    toggleMobile,
  } = useSidebarSide("left");

  return <button onClick={toggleDesktop}>Toggle</button>;
}
```

### Direct Store Access

For accessing specific state values or when side is dynamic:

```tsx
import { useSidebarStore } from "@/stores/sidebar-store";

// Access individual state with direct selector
const leftOpen = useSidebarStore((state) => state.leftDesktopOpen);
const rightOpen = useSidebarStore((state) => state.rightDesktopOpen);

// Access actions
import { useSidebarStoreActions } from "@/stores/sidebar-store";
const actions = useSidebarStoreActions();
actions.toggleDesktop("left");
```

### State Shape

| State              | Persisted | Purpose                      |
| ------------------ | --------- | ---------------------------- |
| `leftDesktopOpen`  | ✅        | Left sidebar desktop state   |
| `rightDesktopOpen` | ✅        | Right sidebar desktop state  |
| `leftMobileOpen`   | ❌        | Left sidebar mobile (sheet)  |
| `rightMobileOpen`  | ❌        | Right sidebar mobile (sheet) |

### Sync Behavior

- **Desktop open** is independent—only opens desktop
- **Desktop close** syncs both—closes desktop and mobile
- **Mobile open/close** always syncs both—affects desktop and mobile

This ensures:

- Opening on mobile also opens desktop (so it's visible when resizing)
- Closing from either mode fully dismisses the sidebar

## Store Structure

All stores follow a consistent pattern.

### localStorage Key Convention

All persist keys **must** use the `hyaway-` prefix to avoid conflicts with other projects running on the same localhost origin:

```
hyaway-{store-name}
```

Examples: `hyaway-theme-storage`, `hyaway-gallery-settings`, `hyaway-history`

This prevents collisions when developing multiple apps on `localhost:3000` or similar ports.

### Basic Pattern

```tsx
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { setupCrossTabSync } from "@/lib/cross-tab-sync";

type MyState = {
  someValue: string;
  anotherValue: number;
  actions: {
    setSomeValue: (value: string) => void;
    setAnotherValue: (value: number) => void;
  };
};

const useMyStore = create<MyState>()(
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
      name: "hyaway-my-store", // localStorage key - always use hyaway- prefix
      storage: createJSONStorage(() => localStorage),
      partialize: ({ actions, ...rest }) => rest, // Don't persist actions
    },
  ),
);

// Explicit selector hooks
export const useSomeValue = () => useMyStore((state) => state.someValue);
export const useAnotherValue = () => useMyStore((state) => state.anotherValue);
export const useMyActions = () => useMyStore((state) => state.actions);

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
const useFeatureStore = create<FeatureState>()(
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
      name: "hyaway-feature-storage",
      partialize: ({ actions, ...rest }) => rest,
    },
  ),
);
```

### Step 3: Add Selector Hook Exports

```tsx
// Explicit selector hooks for each piece of state
export const useFeatureEnabled = () =>
  useFeatureStore((state) => state.enabled);

export const useFeatureLimit = () => useFeatureStore((state) => state.limit);

export const useFeatureActions = () =>
  useFeatureStore((state) => state.actions);
```

### Step 4: Enable Cross-Tab Sync (if needed)

```tsx
import { setupCrossTabSync } from "@/lib/cross-tab-sync";
setupCrossTabSync(useFeatureStore);
```

## Key Conventions

### Storage Key Naming

All persisted stores use localStorage keys with the `hyaway-` prefix:

| Pattern                     | Example                   | Use Case              |
| --------------------------- | ------------------------- | --------------------- |
| `hyaway-{feature}`          | `hyaway-history`          | General feature state |
| `hyaway-{feature}-settings` | `hyaway-gallery-settings` | Settings/preferences  |
| `hyaway-{feature}-state`    | `hyaway-sidebar-state`    | UI state              |

**Rules:**

- Always prefix with `hyaway-` to avoid conflicts with other apps
- Use kebab-case for the feature name
- Suffix `-settings` for preference stores, `-state` for UI state stores
- Don't add redundant suffixes like `-storage`

```tsx
// ✅ Correct
name: "hyaway-review-settings";
name: "hyaway-gallery-settings";
name: "hyaway-sidebar-state";

// ❌ Incorrect
name: "review-settings"; // Missing hyaway- prefix
name: "hyaway-review-settings-storage"; // Redundant -storage suffix
```

### Actions Namespace

All mutations are grouped under an `actions` object and accessed via an actions hook:

```tsx
// ✅ Correct - use the actions hook
const { setEnabled, setLimit } = useFeatureActions();

// ❌ Don't destructure from store directly
const { setEnabled } = useFeatureStore(); // Actions nested in state
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
