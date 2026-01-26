# hyAway Project Instructions

## Project Overview

hyAway is a React + TypeScript frontend application for browsing hydrus network files. It uses:

- **React 19** with TypeScript
- **TanStack Router** for file-based routing
- **TanStack Query** for data fetching
- **Zustand** for client-side state management
- **Zod** for schema validation (API responses, forms)
- **Tailwind CSS v4** for styling
- **Base UI** primitives via shadcn/ui
- **Vite** as the build tool

## Developer Workflows

```bash
pnpm dev          # Start dev server on port 3000
pnpm build        # Production build (vite build && tsc)
pnpm test         # Run Vitest tests
pnpm check        # Format + lint fix
pnpm typecheck    # TypeScript check only
pnpm storybook    # Component playground on port 6006
```

**Adding UI primitives:** Use `npx shadcn@latest add <component>` - components install to `src/components/ui-primitives/`.

## Documentation

Detailed documentation lives in `.github/docs/`. Path-specific instructions in `.github/instructions/` automatically load relevant docs based on the files you're working with.

| Topic               | Document                              | Loaded When Working On                  |
| ------------------- | ------------------------------------- | --------------------------------------- |
| Settings patterns   | `docs/settings-architecture.md`       | `components/settings/`, settings routes |
| File-based routing  | `docs/routing-conventions.md`         | `routes/` files                         |
| Component placement | `docs/component-organization.md`      | `components/` files                     |
| Thumbnail gallery   | `docs/features/thumbnail-gallery.md`  | `thumbnail-gallery/` components         |
| File viewer         | `docs/features/file-viewer.md`        | `file-detail/` components               |
| Tags system         | `docs/features/tags-system.md`        | `tag/` components                       |
| Hydrus API          | `docs/integrations/hydrus-api.md`     | `integrations/hydrus-api/`              |
| TanStack Query      | `docs/integrations/tanstack-query.md` | Query files                             |
| UI primitives       | `docs/ui/primitives.md`               | `ui-primitives/` components             |
| Responsive design   | `docs/ui/responsive-design.md`        | CSS and layout components               |
| CSS patterns        | `docs/ui/css-patterns.md`             | Animations, CSS variables               |

## Quick Reference

### Project Structure

```
src/
├── components/           # Shared components
│   ├── app-shell/        # Header, sidebar, layout
│   ├── file-detail/      # File viewer components
│   ├── page-shell/       # Page layout primitives
│   ├── settings/         # Settings controls
│   ├── tag/              # Tag components
│   ├── thumbnail-gallery/# Gallery components
│   └── ui-primitives/    # Base UI (shadcn/ui style)
├── hooks/                # Shared hooks
├── integrations/         # External integrations
├── lib/                  # Utilities and stores
└── routes/               # File-based routing
    ├── (settings)/       # Settings routes (pathless group)
    └── _auth/            # Protected routes
        ├── (file)/       # File detail routes
        ├── (galleries)/  # Gallery routes
        └── (remote-pages)/ # Pages routes
```

### Import Conventions

- **`@/`** - Alias for `src/`, use for shared components and utilities
- **Relative paths** - Use for route-specific components in `-components/` folders
- **Never import across route groups** - Each route group should be self-contained
- **No barrel files** - Import directly from source files, not `index.ts` re-exports

```tsx
// Shared components: use @/ alias
import { Button } from "@/components/ui-primitives/button";

// Route-specific components: use relative paths
import { FeatureCard } from "./-components/feature-card";
```

### Component Placement

```
Is it a basic UI element (button, input, card)?     → ui-primitives/
Is it used in the app shell (header, sidebar)?      → app-shell/
Is it a page layout primitive (heading, loading)?   → page-shell/
Is it specific to a feature (gallery, tags)?        → feature folder
Is it only used by one route?                       → routes/{group}/-components/
```

When updating a component with a skeleton, **always update the skeleton to match** (same structure, spacing, heights).

### Naming Conventions

| Type       | Convention           | Example                      |
| ---------- | -------------------- | ---------------------------- |
| Files      | kebab-case           | `thumbnail-gallery-item.tsx` |
| Components | PascalCase           | `ThumbnailGalleryItem`       |
| Constants  | SCREAMING_SNAKE_CASE | `GALLERY_SETTINGS_TITLE`     |

### Routing Patterns

- **Pathless groups `()`** - Organize routes without affecting URLs
- **`-` prefix** - Co-locate route-specific files (ignored by router)
- **Layout routes `_`** - Wrap child routes (e.g., `_auth.tsx`)
- **Settings** - Shared controls + thin wrappers pattern

### State Management

| Store         | Purpose          | Location                                         |
| ------------- | ---------------- | ------------------------------------------------ |
| Theme         | Dark/light mode  | `stores/theme-store.ts`                          |
| Gallery       | Gallery prefs    | `stores/gallery-settings-store.ts`               |
| File Viewer   | Viewer prefs     | `stores/file-viewer-settings-store.ts`           |
| Pages         | Pages layout     | `stores/pages-settings-store.ts`                 |
| Search Limits | Query limits     | `stores/search-limits-store.ts`                  |
| Tags          | Tag sorting      | `stores/tags-settings-store.ts`                  |
| Ratings       | Overlay & review | `stores/ratings-settings-store.ts`               |
| Watch History | View tracking    | `stores/watch-history-store.ts`                  |
| Sidebar       | Sidebar state    | `stores/sidebar-store.ts`                        |
| Hydrus Config | API connection   | `integrations/hydrus-api/hydrus-config-store.ts` |

Each store exports explicit selector hooks:

```tsx
import { useActiveTheme, useThemeActions } from "@/stores/theme-store";
import {
  useGalleryMaxLanes,
  useGallerySettingsActions,
} from "@/stores/gallery-settings-store";
import { useSidebarSide } from "@/stores/sidebar-store";

const activeTheme = useActiveTheme();
const { setLanesRange } = useGallerySettingsActions();
const { desktopOpen, toggleDesktop } = useSidebarSide("left");
```

### Tailwind Custom Variants

- **`short:`** - Limited vertical space (max-height: 500px)
- **`pointer-hover:`** - Mouse/trackpad devices (not touch)
- Combine with breakpoints: `short:sm:`, `short:md:`, etc.
- Combine with container queries: `short:@sm:`, `short:@xl:`, etc.

See `src/styles.css` for full documentation.

## Key Patterns

### Hydrus API Integration

All API calls flow through `integrations/hydrus-api/`:

```
api-client.ts          # Raw API functions with Zod validation
├── clients/           # Axios instances (base, access-key, session-key)
├── models.ts          # Types + Zod schemas for API responses
└── queries/           # TanStack Query hooks (search.ts, services.ts, etc.)
```

**Zod validation** - All API responses are validated with Zod schemas defined in `models.ts`. When adding new endpoints, define both the schema and TypeScript type:

```tsx
// models.ts
export const MyResponseSchema = z.object({ ... });
export type MyResponse = z.infer<typeof MyResponseSchema>;

// api-client.ts
export async function myApiCall(): Promise<MyResponse> {
  const response = await sessionKeyClient.get("/endpoint");
  return MyResponseSchema.parse(response.data);
}
```

**Query hooks pattern** - Each query checks `useIsApiConfigured()` and permissions before fetching:

```tsx
// integrations/hydrus-api/queries/search.ts
const useCanSearch = () =>
  useHasPermission(Permission.SEARCH_FOR_AND_FETCH_FILES);

export const useRecentlyArchivedFilesQuery = () => {
  const isConfigured = useIsApiConfigured();
  const canSearch = useCanSearch();

  return useQuery({
    queryKey: ["searchFiles", "recentlyArchived", tags, options],
    queryFn: () => searchFiles({ tags, ...options }),
    enabled: isConfigured && canSearch && tags.length > 0,
  });
};
```

**Permission checking** - Use `usePermissions()` for multiple checks or `useHasPermission()` for single checks:

```tsx
// Multiple permissions
const { hasPermission, isFetched } = usePermissions();
const canManageFiles = hasPermission(Permission.IMPORT_AND_DELETE_FILES);

// Single permission (in query hooks)
const canSearch = useHasPermission(Permission.SEARCH_FOR_AND_FETCH_FILES);
```

**Client types**: `baseClient` (no auth), `accessKeyClient` (permanent key), `sessionKeyClient` (temporary, auto-refreshed on 419 errors).

### Authentication Flow

The `_auth.tsx` layout route wraps all protected routes. It:

1. Verifies persistent + session access keys via `useVerifyPersistentAccessQuery`
2. Shows loading/error states during verification
3. Redirects to `/settings/client-api` if not authenticated

### Settings Pattern

Settings use **shared controls + thin wrappers**:

```tsx
// components/settings/{feature}-settings.tsx - Shared component
export const PAGES_DISPLAY_SETTINGS_TITLE = "Pages display";

export function PagesDisplaySettings({ idPrefix = "" }) {
  const pagesMaxColumns = usePagesMaxColumns();
  const { setMaxColumns } = usePagesSettingsActions();

  return (
    <SliderField
      id={`${idPrefix}pages-columns-slider`}
      label="Max columns"
      value={pagesMaxColumns}
      onValueChange={setMaxColumns}
    />
  );
}

// Then wrap in Card (settings page) or SettingsPopover (inline) with the same component
```

### Sidebar Architecture

The sidebar component (`ui-primitives/sidebar.tsx`) is **modified from shadcn's default** to support both left and right collapsible sidebars simultaneously. Key differences:

- State is managed per-side via `useSidebarSide(side)` from `stores/sidebar-store.ts`
- Each `<Sidebar side="left|right">` manages its own context independently
- `<SidebarTrigger side="left|right">` works both inside and outside sidebar context
- `<SidebarLayout>` is a simple wrapper with no global state

## Maintaining Documentation

When making significant changes, update the relevant documentation in `.github/docs/`:

| Change Type                 | Update                                              |
| --------------------------- | --------------------------------------------------- |
| New settings module         | `docs/settings-architecture.md` - modules table     |
| New route or route group    | `docs/routing-conventions.md` - update structure    |
| New shared component folder | `docs/component-organization.md` - add category     |
| New API endpoint            | `docs/integrations/hydrus-api.md` - document it     |
| New query pattern           | `docs/integrations/tanstack-query.md` - add example |
| New UI primitive            | `docs/ui/primitives.md` - add to component list     |
| New Tailwind variant        | `docs/ui/responsive-design.md` - document variant   |
| New CSS/animation pattern   | `docs/ui/css-patterns.md` - document pattern        |

## Changelog

The changelog lives at `docs/changelog.md`. Follow the [Keep a Changelog](https://keepachangelog.com) format:

- **ISO dates**: `YYYY-MM-DD` format as headings (no version numbers)
- **Standard categories**: `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, `Security`
- **User-focused entries**: Describe the benefit, not the implementation
- **Reverse chronological**: Latest date first
