# Routing Conventions

> **Status**: Active pattern used throughout the codebase

The project uses TanStack Router's file-based routing with specific organizational patterns.

## Key Concepts

### Pathless Route Groups `()`

Folders wrapped in parentheses organize routes without affecting the URL structure:

```
src/routes/
├── (settings)/           # Pathless group
│   ├── settings.tsx      # /settings (not /(settings)/settings)
│   └── settings.ux.tsx   # /settings/ux
└── (galleries)/          # Another pathless group
    └── gallery.tsx       # /gallery
```

**Use for:**

- Grouping related routes
- Co-locating route-specific components
- Keeping the routes folder organized

### Component Co-location with `-` Prefix

Files and folders starting with `-` are ignored by TanStack Router:

```
src/routes/
└── (settings)/
    ├── -components/              # Ignored by router
    │   ├── feature-settings-card.tsx
    │   └── another-component.tsx
    ├── -hooks/                   # Also ignored
    │   └── use-settings-form.ts
    └── settings.tsx              # Actual route
```

**Use for:**

- Route-specific components (`-components/`)
- Route-specific hooks (`-hooks/`)
- Route-specific utilities (`-utils/`)
- Any file that shouldn't become a route

### Layout Routes with `_` Prefix

Routes starting with `_` are layout routes that wrap children:

```
src/routes/
├── _auth.tsx             # Auth layout (wraps all _auth/* routes)
└── _auth/
    ├── dashboard.tsx     # /dashboard (requires auth)
    └── profile.tsx       # /profile (requires auth)
```

## Current Route Structure

```
src/routes/
├── __root.tsx              # Root layout (app shell, providers)
├── _auth.tsx               # Auth layout (connection check)
├── index.tsx               # Home page (/)
│
├── (settings)/             # Settings routes group
│   ├── -components/        # Settings-specific components
│   ├── settings.tsx        # /settings layout
│   ├── settings.index.tsx  # /settings (index)
│   ├── settings.ux.tsx     # /settings/ux
│   └── settings.client-api.tsx  # /settings/client-api
│
└── _auth/                  # Protected routes
    ├── (file)/             # File detail group
    │   ├── -components/    # File-specific components
    │   └── file.$fileId.tsx    # /file/:fileId
    │
    ├── (galleries)/        # Gallery routes group
    │   ├── -components/    # Gallery-specific components
    │   └── ...gallery routes
    │
    └── (remote-pages)/     # Pages routes group
        ├── -components/    # Pages-specific components
        └── ...pages routes
```

## Import Rules

### Within a Route Group

Use **relative imports** for route-specific components:

```tsx
// In routes/(settings)/settings.ux.tsx
import { FeatureSettingsCard } from "./-components/feature-settings-card";
```

### From Shared Components

Use **`@/` alias** for shared components:

```tsx
// In any route file
import { Button } from "@/components/ui-primitives/button";
import { ThumbnailGallery } from "@/components/thumbnail-gallery/thumbnail-gallery";
```

### Never Import Across Route Groups

❌ **Don't do this:**

```tsx
// In routes/_auth/(galleries)/gallery.tsx
import { FileViewer } from "../(file)/-components/file-viewer"; // Wrong!
```

✅ **Do this instead:**

- Move the component to `src/components/` if shared
- Or duplicate if truly route-specific (rare)

## Dynamic Segments

Use `$` prefix for dynamic URL segments:

```
file.$fileId.tsx     → /file/:fileId
page.$pageKey.tsx    → /page/:pageKey
```

Access in component:

```tsx
import { Route } from "./file.$fileId";

function FileDetail() {
  const { fileId } = Route.useParams();
  // ...
}
```

## Search Params

Define search params schema in route file:

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const searchSchema = z.object({
  page: z.number().optional().default(1),
  sort: z.enum(["name", "date"]).optional(),
});

export const Route = createFileRoute("/_auth/gallery")({
  validateSearch: searchSchema,
});
```

Access in component:

```tsx
function Gallery() {
  const { page, sort } = Route.useSearch();
  // ...
}
```

## Related Files

- `src/routeTree.gen.ts` - Auto-generated route tree (don't edit)
- `vite.config.ts` - TanStack Router plugin configuration

## Permission Gating

Permissions control access at three levels. Each level serves a different purpose.

### 1. Route layout gates (`PagePermissionGate`)

Layout routes (e.g. `search.tsx`) wrap their `<Outlet>` in `<PagePermissionGate>`. Only list permissions that are **required** for the page to function at all. Do not include permissions for optional or degradable features.

```tsx
// routes/_auth/(galleries)/search.tsx
const PAGE_PERMISSIONS = [Permission.SEARCH_FOR_AND_FETCH_FILES];
// EDIT_FILE_TAGS is NOT listed — tag autocomplete degrades gracefully without it
```

### 2. Sidebar & homepage nav items (`requiredPermissions`)

The sidebar (`app-sidebar.tsx`) and homepage (`index.tsx`) use `requiredPermissions` arrays on nav items. These must match the route's `PagePermissionGate` — same permissions, nothing extra.

### 3. Query hooks (`useHasPermission`)

Each query hook checks the specific permission it needs via `useHasPermission()` in the `enabled` flag. Queries gracefully disable when their permission is missing. This is where optional permissions are enforced.

```tsx
// queries/tags.ts — requires EDIT_FILE_TAGS, not gated at route level
const canTags = useHasPermission(Permission.EDIT_FILE_TAGS);
enabled: isConfigured && canSearch && canTags && trimmed.length >= 3,
```

### Rule of thumb

- **Route gate / nav item**: Only permissions without which the page is **completely broken**
- **Query hook**: The specific permission that query's API endpoint requires
- Never duplicate a query-level permission up to the route gate unless the page is useless without it
