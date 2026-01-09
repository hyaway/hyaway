# Settings Architecture

> **Status**: Active pattern used throughout the codebase

Settings follow a **shared controls + thin wrappers** pattern to eliminate duplication between settings pages and inline popovers.

## Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  components/settings/                                           │
│  └── {feature}-settings.tsx                                     │
│      - Exports TITLE constant                                   │
│      - Exports shared <{Feature}Settings /> component           │
│      - Contains all form controls and state bindings            │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
┌─────────────────────────────┐   ┌─────────────────────────────┐
│  Settings Card              │   │  Settings Popover           │
│  (settings page)            │   │  (inline on gallery pages)  │
│                             │   │                             │
│  - Thin wrapper             │   │  - Thin wrapper             │
│  - Imports shared component │   │  - Imports shared component │
│  - Wraps in <Card>          │   │  - Wraps in <SettingsPopover>│
│  - Uses TITLE constant      │   │  - Uses TITLE constant      │
└─────────────────────────────┘   └─────────────────────────────┘
```

## Current Settings Modules

| Feature           | Shared File                              | Title Constant                             |
| ----------------- | ---------------------------------------- | ------------------------------------------ |
| Thumbnail gallery | `thumbnail-gallery-display-settings.tsx` | `THUMBNAIL_GALLERY_DISPLAY_SETTINGS_TITLE` |
| Pages display     | `pages-display-settings.tsx`             | `PAGES_DISPLAY_SETTINGS_TITLE`             |
| Media viewer      | `file-viewer-settings.tsx`               | `FILE_VIEWER_SETTINGS_TITLE`               |
| Watch history     | `history-settings.tsx`                   | `WATCH_HISTORY_SETTINGS_TITLE`             |
| Search limits     | `search-limits-settings.tsx`             | `SEARCH_LIMITS_SETTINGS_TITLE`             |
| Random inbox      | `random-inbox-settings.tsx`              | `RANDOM_INBOX_SETTINGS_TITLE`              |
| Recent files      | `recent-files-settings.tsx`              | `RECENT_FILES_SETTINGS_TITLE`              |

## File Locations

### Shared Settings Components

All shared settings live in `src/components/settings/`:

- `{feature}-settings.tsx` - The shared component with all controls
- `setting-fields.tsx` - Reusable field primitives
- `settings-popover.tsx` - Responsive popover/drawer container
- `settings-ui.tsx` - Header and layout primitives

### Settings Cards (for /settings page)

Cards live in `src/routes/(settings)/-components/` and are named `{feature}-settings-card.tsx`.

### Settings Popovers (inline on pages)

Popovers live near their usage:

- `components/thumbnail-gallery/thumbnail-gallery-display-settings-popover.tsx` - Used across multiple gallery pages
- `components/file-detail/file-viewer-settings-popover.tsx` - File detail page only
- `routes/_auth/(remote-pages)/-components/pages-display-settings-popover.tsx` - Pages only

## Creating New Settings

### Step 1: Create Shared Settings File

Create `src/components/settings/{feature}-settings.tsx`:

```tsx
import {
  useSomeSetting,
  useFeatureSettingsActions,
} from "@/stores/feature-settings-store";
import { SettingsGroup, SwitchField, SliderField } from "./setting-fields";

export const FEATURE_SETTINGS_TITLE = "Feature Name";

export interface FeatureSettingsProps {
  idPrefix?: string; // For accessibility when multiple instances exist
}

export function FeatureSettings({ idPrefix = "" }: FeatureSettingsProps) {
  const someSetting = useSomeSetting();
  const { setSomeSetting } = useFeatureSettingsActions();

  return (
    <SettingsGroup>
      <SwitchField
        id={`${idPrefix}some-setting`}
        label="Some Setting"
        checked={someSetting}
        onCheckedChange={setSomeSetting}
      />
    </SettingsGroup>
  );
}
```

### Step 2: Create Settings Card

Create `src/routes/(settings)/-components/{feature}-settings-card.tsx`:

```tsx
import {
  FEATURE_SETTINGS_TITLE,
  FeatureSettings,
} from "@/components/settings/feature-settings";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui-primitives/card";

export function FeatureSettingsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{FEATURE_SETTINGS_TITLE}</CardTitle>
        <CardDescription>
          Description of what these settings control.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FeatureSettings />
      </CardContent>
    </Card>
  );
}
```

### Step 3: Create Settings Popover (if needed)

Create near usage location:

```tsx
import {
  FEATURE_SETTINGS_TITLE,
  FeatureSettings,
} from "@/components/settings/feature-settings";
import {
  SettingsHeader,
  SettingsTitle,
} from "@/components/settings/settings-ui";
import { SettingsPopover } from "@/components/settings/settings-popover";

export function FeatureSettingsPopover() {
  return (
    <SettingsPopover label="Settings">
      <SettingsHeader>
        <SettingsTitle>{FEATURE_SETTINGS_TITLE}</SettingsTitle>
      </SettingsHeader>
      <FeatureSettings idPrefix="popover-" />
    </SettingsPopover>
  );
}
```

## Settings Primitives Reference

Available in `src/components/settings/setting-fields.tsx`:

| Component            | Description                             | Props                                                         |
| -------------------- | --------------------------------------- | ------------------------------------------------------------- |
| `<SettingsGroup>`    | Container with consistent spacing       | `children`                                                    |
| `<SwitchField>`      | Label + Switch toggle                   | `id`, `label`, `checked`, `onCheckedChange`                   |
| `<SliderField>`      | Label + Slider with value display       | `id`, `label`, `value`, `onValueChange`, `min`, `max`, `step` |
| `<ToggleGroupField>` | Label + Toggle group for enum selection | `id`, `label`, `value`, `onValueChange`, `options`            |

## Design Decisions

### Why shared components?

- **Single source of truth** - Settings logic defined once
- **Consistent UI** - Same controls everywhere
- **Easy updates** - Change once, update everywhere

### Why thin wrappers?

- **Context-appropriate containers** - Cards for pages, popovers for inline
- **Flexibility** - Easy to add new contexts (modals, sheets, etc.)
- **Clean separation** - Wrapper handles container, shared component handles content

### Why `idPrefix`?

When the same settings appear in multiple places (page + popover), form IDs must be unique for accessibility. The `idPrefix` prop ensures unique IDs across instances.
