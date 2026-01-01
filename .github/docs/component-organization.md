# Component Organization

> **Status**: Active pattern used throughout the codebase

This document describes where components live and why.

## Directory Structure

```
src/components/
├── app-shell/          # App-level layout components
├── file-detail/        # File viewer and detail components
├── page-shell/         # Page-level layout primitives
├── settings/           # Shared settings components
├── tag/                # Tag-related components
├── thumbnail-gallery/  # Gallery display components
└── ui-primitives/      # Base UI components (shadcn/ui style)
```

## Component Categories

### UI Primitives (`ui-primitives/`)

Low-level, unstyled or minimally styled building blocks. These are the foundation for all other components.

**Examples:**

- Button, Card, Dialog, Dropdown
- Input, Label, Select, Slider
- Tooltip, Popover, Sheet

**Characteristics:**

- No business logic
- Highly reusable
- Based on Radix UI / Base UI primitives
- Follow shadcn/ui patterns

### App Shell (`app-shell/`)

Application-level layout components that appear on every page.

**Examples:**

- `app-header.tsx` - Main header with navigation
- `app-sidebar.tsx` - Main sidebar
- `floating-header.tsx` - Mobile header behavior
- `theme-switcher.tsx` - Dark/light mode toggle

**Characteristics:**

- Singleton instances
- Manage global layout concerns
- Often use portals for overlays

### Page Shell (`page-shell/`)

Page-level layout primitives for consistent page structure.

**Examples:**

- `page-heading.tsx` - Page title and description
- `page-loading.tsx` - Loading state
- `page-error.tsx` - Error state
- `empty-state.tsx` - Empty content state

**Characteristics:**

- Composable building blocks
- Used by route components
- Handle common page patterns

### Feature Components

Domain-specific components organized by feature:

| Folder               | Purpose                          |
| -------------------- | -------------------------------- |
| `thumbnail-gallery/` | Grid display of file thumbnails  |
| `file-detail/`       | Individual file viewing and info |
| `tag/`               | Tag badges, lists, sidebar       |
| `settings/`          | Settings controls and containers |

## Where to Put New Components

### Decision Tree

```
Is it a basic UI element (button, input, card)?
  → ui-primitives/

Is it used in the app shell (header, sidebar)?
  → app-shell/

Is it a page layout primitive (heading, loading, error)?
  → page-shell/

Is it specific to a feature (gallery, file viewer, tags)?
  → Appropriate feature folder

Is it only used by one route?
  → routes/{route-group}/-components/
```

### Route-Specific vs Shared

**Put in `routes/{group}/-components/` when:**

- Only used by routes in that group
- Tightly coupled to route-specific logic
- Unlikely to be reused elsewhere

**Put in `src/components/` when:**

- Used by multiple routes
- Could reasonably be reused
- Has no route-specific dependencies

## Import Patterns

### Shared Components

Always use the `@/` alias:

```tsx
import { Button } from "@/components/ui-primitives/button";
import { ThumbnailGallery } from "@/components/thumbnail-gallery/thumbnail-gallery";
```

### Route-Specific Components

Use relative imports:

```tsx
// In routes/(settings)/settings.ux.tsx
import { UxSettingsCard } from "./-components/ux-settings-card";
```

### No Barrel Files

Import directly from source files, not `index.ts`:

```tsx
// ✅ Do this
import { Button } from "@/components/ui-primitives/button";

// ❌ Not this
import { Button } from "@/components/ui-primitives";
```

## File Naming

- **Files**: `kebab-case.tsx`
- **Components**: `PascalCase`
- **One component per file** (with small helpers allowed)

```tsx
// thumbnail-gallery-item.tsx
export function ThumbnailGalleryCard() { ... }
```

## Co-located Files

Keep related files together:

```
thumbnail-gallery/
├── thumbnail-gallery.tsx           # Main component
├── thumbnail-gallery-item.tsx      # Item subcomponent
├── thumbnail-gallery-skeleton.tsx  # Loading state
└── thumbnail-gallery-display-settings-popover.tsx  # Settings
```

## Related Docs

- [Settings Architecture](./settings-architecture.md) - Settings component patterns
- [Routing Conventions](./routing-conventions.md) - Route-specific component placement
