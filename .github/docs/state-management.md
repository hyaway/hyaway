# State Management

> **Status**: Active pattern used throughout the codebase

Hyaway uses **Zustand** for client-side state management with explicit selector hooks for ergonomic access.

## Store Files

| Store         | File                                             | Purpose                |
| ------------- | ------------------------------------------------ | ---------------------- |
| Theme         | `lib/theme-store.ts`                             | Dark/light mode        |
| UX Settings   | `lib/settings-store.ts`                          | UI preferences         |
| History       | `lib/watch-history-store.ts`                     | Watch history tracking |
| Sidebar       | `lib/sidebar-store.ts`                           | Sidebar persistence    |
| Hydrus Config | `integrations/hydrus-api/hydrus-config-store.ts` | API connection         |

## Usage Pattern

Each store exports individual selector hooks for each piece of state:

```tsx
import { useActiveTheme, useThemeActions } from "@/lib/theme-store";
import { useGalleryMaxLanes, useSettingsActions } from "@/lib/settings-store";
import {
  useWatchHistoryEntries,
  useWatchHistoryActions,
} from "@/lib/watch-history-store";

function MyComponent() {
  // Access individual state values via dedicated hooks
  const activeTheme = useActiveTheme();
  const galleryMaxLanes = useGalleryMaxLanes();
  const entries = useWatchHistoryEntries();

  // Access actions via actions hook
  const { setThemePreference } = useThemeActions();
  const { setGalleryMaxLanes } = useSettingsActions();
  const { addViewedFile } = useWatchHistoryActions();

  return <div>...</div>;
}
```

### Direct Store Access

For advanced use cases (subscriptions, non-React contexts), use the store directly:

```tsx
import { useThemeStore } from "@/lib/theme-store";

// Direct selector
const activeTheme = useThemeStore((s) => s.activeTheme);

// Snapshot getters (outside React)
import { getActiveThemeSnapshot } from "@/lib/theme-store";
const theme = getActiveThemeSnapshot();
```

## Available Hooks

### Theme Store (`lib/theme-store.ts`)

| Hook                 | Returns                         |
| -------------------- | ------------------------------- |
| `useActiveTheme`     | `"dark" \| "light"`             |
| `useThemePreference` | `"dark" \| "light" \| "system"` |
| `useThemeHydrated`   | `boolean`                       |
| `useThemeActions`    | `{ setThemePreference, ... }`   |

### UX Settings Store (`lib/settings-store.ts`)

| Hook                         | Returns                       |
| ---------------------------- | ----------------------------- |
| `useTagsSortMode`            | `"count" \| "namespace"`      |
| `useGalleryMaxLanes`         | `number`                      |
| `useGalleryExpandImages`     | `boolean`                     |
| `useGalleryShowScrollBadge`  | `boolean`                     |
| `usePagesMaxColumns`         | `number`                      |
| `usePagesShowScrollBadge`    | `boolean`                     |
| `useRecentFilesLimit`        | `number`                      |
| `useRecentFilesDays`         | `number`                      |
| `useRandomInboxLimit`        | `number`                      |
| `useFileViewerStartExpanded` | `boolean`                     |
| `useImageBackground`         | `"solid" \| "checkerboard"`   |
| `useSettingsActions`         | `{ setGalleryMaxLanes, ... }` |

### Watch History Store (`lib/watch-history-store.ts`)

| Hook                     | Returns                                |
| ------------------------ | -------------------------------------- |
| `useWatchHistoryEntries` | `Array<{ fileId, viewedAt }>`          |
| `useWatchHistoryFileIds` | `Array<number>` (memoized)             |
| `useWatchHistoryEnabled` | `boolean`                              |
| `useWatchHistoryLimit`   | `number`                               |
| `useWatchHistoryActions` | `{ addViewedFile, clearHistory, ... }` |

> **Note:** The sidebar store uses `useSidebarSide(side)` for bound access—see [Sidebar Store](#sidebar-store) below.

## Sidebar Store

The sidebar store manages open/closed state for left and right sidebars, with separate desktop and mobile states.

### Basic Usage

For most cases, use `useSidebarSide(side)` which returns bound state and actions:

```tsx
import { useSidebarSide } from "@/lib/sidebar-store";

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
import { useSidebarStore } from "@/lib/sidebar-store";

// Access individual state with direct selector
const leftOpen = useSidebarStore((state) => state.leftDesktopOpen);
const rightOpen = useSidebarStore((state) => state.rightDesktopOpen);

// Access actions
import { useSidebarStoreActions } from "@/lib/sidebar-store";
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

All stores follow a consistent pattern:

```tsx
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { setupCrossTabSync } from "./cross-tab-sync";

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
      name: "my-store", // localStorage key
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
      name: "feature-storage",
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
import { setupCrossTabSync } from "./cross-tab-sync";
setupCrossTabSync(useFeatureStore);
```

## Key Conventions

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
