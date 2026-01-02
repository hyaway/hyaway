# Hyaway Project Instructions

## Project Overview

Hyaway is a React + TypeScript frontend application for browsing Hydrus Network files. It uses:

- **React 19** with TypeScript
- **TanStack Router** for file-based routing
- **TanStack Query** for data fetching
- **Zustand** for client-side state management
- **Tailwind CSS v4** for styling
- **Base UI** primitives via shadcn/ui
- **Vite** as the build tool

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

### Naming Conventions

| Type       | Convention           | Example                      |
| ---------- | -------------------- | ---------------------------- |
| Files      | kebab-case           | `thumbnail-gallery-item.tsx` |
| Components | PascalCase           | `ThumbnailGalleryItem`       |
| Constants  | SCREAMING_SNAKE_CASE | `GALLERY_SETTINGS_TITLE`     |

### Key Patterns

- **Pathless groups `()`** - Organize routes without affecting URLs
- **`-` prefix** - Co-locate route-specific files (ignored by router)
- **Layout routes `_`** - Wrap child routes (e.g., `_auth.tsx`)
- **Settings** - Shared controls + thin wrappers pattern

### State Management

| Store         | Purpose         | Location                                         |
| ------------- | --------------- | ------------------------------------------------ |
| Theme         | Dark/light mode | `lib/theme-store.ts`                             |
| UX Settings   | UI preferences  | `lib/settings-store.ts`                          |
| Watch History | View tracking   | `lib/watch-history-store.ts`                     |
| Sidebar       | Sidebar state   | `lib/sidebar-store.ts`                           |
| Hydrus Config | API connection  | `integrations/hydrus-api/hydrus-config-store.ts` |

Each store exports explicit selector hooks:

```tsx
import { useActiveTheme, useThemeActions } from "@/lib/theme-store";
import { useGalleryMaxLanes, useSettingsActions } from "@/lib/settings-store";
import { useSidebarSide } from "@/lib/sidebar-store";

const activeTheme = useActiveTheme();
const { setGalleryMaxLanes } = useSettingsActions();
const { desktopOpen, toggleDesktop } = useSidebarSide("left");
```

### Tailwind Custom Variants

- **`short:`** - Limited vertical space (max-height: 500px)
- Combine with breakpoints: `short:sm:`, `short:md:`, etc.
- Combine with container queries: `short:@sm:`, `short:@xl:`, etc.

See `src/styles.css` for full documentation.

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
| New feature area            | Create new doc in `docs/features/`                  |

**When to update:** After implementing a feature, pattern, or convention that others would need to understand or follow.
