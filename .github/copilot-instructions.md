# Hyaway Project Instructions

## Project Overview

Hyaway is a React + TypeScript frontend application for browsing Hydrus Network files. It uses:

- **React 19** with TypeScript
- **TanStack Router** for file-based routing
- **TanStack Query** for data fetching
- **Tailwind CSS v4** for styling
- **Base UI** primitives via shadcn/ui
- **Vite** as the build tool

## Documentation

Detailed documentation lives in `.github/docs/`. Reference the appropriate doc for in-depth information:

| Topic               | Document                                                              | When to Reference                     |
| ------------------- | --------------------------------------------------------------------- | ------------------------------------- |
| Settings patterns   | [settings-architecture.md](docs/settings-architecture.md)             | Creating/modifying settings           |
| File-based routing  | [routing-conventions.md](docs/routing-conventions.md)                 | Adding routes, organizing route files |
| Component placement | [component-organization.md](docs/component-organization.md)           | Creating new components               |
| Thumbnail gallery   | [features/thumbnail-gallery.md](docs/features/thumbnail-gallery.md)   | Gallery display work                  |
| File viewer         | [features/file-viewer.md](docs/features/file-viewer.md)               | Media viewer work                     |
| Tags system         | [features/tags-system.md](docs/features/tags-system.md)               | Tag-related work                      |
| Hydrus API          | [integrations/hydrus-api.md](docs/integrations/hydrus-api.md)         | API integration work                  |
| TanStack Query      | [integrations/tanstack-query.md](docs/integrations/tanstack-query.md) | Data fetching patterns                |
| UI primitives       | [ui/primitives.md](docs/ui/primitives.md)                             | Base component usage                  |
| Responsive design   | [ui/responsive-design.md](docs/ui/responsive-design.md)               | Layout and breakpoints                |

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
| Files      | kebab-case           | `thumbnail-gallery-card.tsx` |
| Components | PascalCase           | `ThumbnailGalleryCard`       |
| Constants  | SCREAMING_SNAKE_CASE | `GALLERY_SETTINGS_TITLE`     |

### Key Patterns

- **Pathless groups `()`** - Organize routes without affecting URLs
- **`-` prefix** - Co-locate route-specific files (ignored by router)
- **Layout routes `_`** - Wrap child routes (e.g., `_auth.tsx`)
- **Settings** - Shared controls + thin wrappers pattern

### State Management

| Store         | Purpose        | Location                     |
| ------------- | -------------- | ---------------------------- |
| UX Settings   | UI preferences | `lib/ux-settings-store.ts`   |
| Hydrus Config | API connection | `lib/hydrus-config-store.ts` |
| History       | Watch history  | `lib/history-store.ts`       |

### Tailwind Custom Variants

- **`short:`** - Limited vertical space (max-height: 500px)
- **`short-wide:`** - Phone landscape (short + min-width: 640px)

See `src/styles.css` for full documentation.

## Maintaining Documentation

When making significant changes, update the relevant documentation in `.github/docs/`:

| Change Type                 | Update                                                                              |
| --------------------------- | ----------------------------------------------------------------------------------- |
| New settings module         | [settings-architecture.md](docs/settings-architecture.md) - add to modules table    |
| New route or route group    | [routing-conventions.md](docs/routing-conventions.md) - update structure            |
| New shared component folder | [component-organization.md](docs/component-organization.md) - add category          |
| New API endpoint            | [integrations/hydrus-api.md](docs/integrations/hydrus-api.md) - document endpoint   |
| New query pattern           | [integrations/tanstack-query.md](docs/integrations/tanstack-query.md) - add example |
| New UI primitive            | [ui/primitives.md](docs/ui/primitives.md) - add to component list                   |
| New Tailwind variant        | [ui/responsive-design.md](docs/ui/responsive-design.md) - document variant          |
| New feature area            | Create new doc in `docs/features/` and add to README index                          |

**When to update:** After implementing a feature, pattern, or convention that others would need to understand or follow.
