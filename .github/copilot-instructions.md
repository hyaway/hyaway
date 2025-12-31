# Hyaway Project Instructions

## Project Overview

Hyaway is a React + TypeScript frontend application for browsing Hydrus Network files. It uses:

- **React 19** with TypeScript
- **TanStack Router** for file-based routing
- **TanStack Query** for data fetching
- **Tailwind CSS v4** for styling
- **Base UI** primitives via shadcn/ui
- **Vite** as the build tool

## Project Structure

### Route Organization

The project uses TanStack Router's file-based routing with **pathless route groups** `()` for organizing routes without affecting URLs, and the **`-` prefix** (default `routeFileIgnorePrefix`) to co-locate components with their routes.

```
src/routes/
├── __root.tsx              # Root layout
├── _auth.tsx               # Auth layout route
├── index.tsx               # Home page
├── (settings)/             # Pathless group - doesn't add to URL
│   ├── -components/        # Settings-specific components (ignored by router)
│   │   ├── thumbnail-gallery-display-settings-card.tsx
│   │   ├── pages-display-settings-card.tsx
│   │   └── ...
│   ├── settings.tsx        # /settings layout
│   ├── settings.index.tsx  # /settings (index)
│   ├── settings.ux.tsx     # /settings/ux
│   └── settings.client-api.tsx
└── _auth/                  # Protected routes under auth layout
    ├── (file)/             # Pathless group
    │   ├── -components/    # File-specific components
    │   └── file.$fileId.tsx
    ├── (galleries)/        # Pathless group
    │   ├── -components/    # Gallery-specific components
    │   └── ...gallery routes
    └── (remote-pages)/     # Pathless group
        ├── -components/    # Pages-specific components
        └── ...pages routes
```

### Component Organization

```
src/components/
├── app-shell/          # App-level layout components (header, sidebar)
├── thumbnail-gallery/  # Thumbnail gallery + related components
├── page-shell/         # Page-level layout primitives
├── settings/           # Shared settings components (controls, primitives)
├── tag/                # Tag-related components
└── ui-primitives/      # Base UI components (shadcn/ui style)
```

### Import Conventions

- **`@/`** - Alias for `src/`, use for shared components and utilities
- **Relative paths** - Use for route-specific components in `-components/` folders
- **Never import across route groups** - Each route group should be self-contained

## Settings Architecture

Settings follow a **shared controls + thin wrappers** pattern to eliminate duplication between settings pages and inline popovers.

### The Pattern

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

### Current Settings Modules

| Feature           | Shared File                              | Title Constant                             |
| ----------------- | ---------------------------------------- | ------------------------------------------ |
| Thumbnail gallery | `thumbnail-gallery-display-settings.tsx` | `THUMBNAIL_GALLERY_DISPLAY_SETTINGS_TITLE` |
| Pages display     | `pages-display-settings.tsx`             | `PAGES_DISPLAY_SETTINGS_TITLE`             |
| Media viewer      | `file-viewer-settings.tsx`               | `FILE_VIEWER_SETTINGS_TITLE`               |
| Watch history     | `history-settings.tsx`                   | `HISTORY_SETTINGS_TITLE`                   |
| Random inbox      | `random-inbox-settings.tsx`              | `RANDOM_INBOX_SETTINGS_TITLE`              |
| Recent files      | `recent-files-settings.tsx`              | `RECENT_FILES_SETTINGS_TITLE`              |

### Settings Card Location

Cards live in `routes/(settings)/-components/` and are named `{feature}-settings-card.tsx`.

### Settings Popover Location

Popovers live near their usage:

- `components/thumbnail-gallery/thumbnail-gallery-display-settings-popover.tsx` - Used across multiple gallery pages
- `routes/_auth/(file)/-components/file-viewer-settings-popover.tsx` - File detail page only
- `routes/_auth/(galleries)/-components/` - Gallery-specific popovers
- `routes/_auth/(remote-pages)/-components/pages-display-settings-popover.tsx` - Pages only

### Creating New Settings

1. **Create shared settings file** in `components/settings/{feature}-settings.tsx`:

   ```tsx
   import { SettingsGroup, SwitchField, SliderField } from "./setting-fields";

   export const FEATURE_SETTINGS_TITLE = "Feature name";

   export interface FeatureSettingsProps {
     idPrefix?: string; // For accessibility when multiple instances exist
   }

   export function FeatureSettings({ idPrefix = "" }: FeatureSettingsProps) {
     // Hook into settings store
     // Return <SettingsGroup> with form fields
   }
   ```

2. **Create settings card** in `routes/(settings)/-components/{feature}-settings-card.tsx`:

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
           <CardDescription>Description here.</CardDescription>
         </CardHeader>
         <CardContent>
           <FeatureSettings />
         </CardContent>
       </Card>
     );
   }
   ```

3. **Create settings popover** near its usage:

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

## Settings Primitives

The project provides reusable settings field components in `components/settings/setting-fields.tsx`:

- `<SettingsGroup>` - Container with consistent spacing
- `<SwitchField>` - Label + Switch toggle
- `<SliderField>` - Label + Slider with value display
- `<ToggleGroupField>` - Label + Toggle group for enum selection

Use `<SettingsPopover>` from `components/settings/settings-popover.tsx` for the popover container - it handles responsive behavior (drawer on mobile, popover on desktop).

## State Management

- **UX Settings**: `lib/ux-settings-store.ts` - Zustand store with persistence for UI preferences
- **Hydrus Config**: `lib/hydrus-config-store.ts` - API connection settings
- **History**: `lib/history-store.ts` - Watch history tracking

## Naming Conventions

- **Files**: kebab-case (`thumbnail-gallery-display-settings.tsx`)
- **Components**: PascalCase (`ThumbnailGalleryDisplaySettings`)
- **Constants**: SCREAMING_SNAKE_CASE (`THUMBNAIL_GALLERY_DISPLAY_SETTINGS_TITLE`)
- **Settings files**: `{feature}-settings.tsx` for shared, `{feature}-settings-card.tsx` for cards, `{feature}-settings-popover.tsx` for popovers

## Key Patterns

### Pathless Route Groups `()`

Use `()` folders to organize routes without affecting the URL structure. Great for:

- Grouping related routes
- Co-locating route-specific components
- Keeping the routes folder organized

### Component Co-location with `-` Prefix

Files/folders starting with `-` are ignored by TanStack Router. Use for:

- Route-specific components (`-components/`)
- Route-specific hooks
- Route-specific utilities

### No Cross-Route Imports

Each route group should be self-contained. If a component is needed by multiple routes, move it to `components/`.
