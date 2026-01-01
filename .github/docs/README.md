# Hyaway Documentation

This folder contains detailed documentation for specific features and patterns used in the Hyaway project. These docs serve as both developer reference and AI assistant context.

## Documentation Index

### Architecture & Patterns

| Document                                              | Description                                 |
| ----------------------------------------------------- | ------------------------------------------- |
| [Settings Architecture](./settings-architecture.md)   | Shared controls + thin wrappers pattern     |
| [Routing Conventions](./routing-conventions.md)       | TanStack Router file-based routing patterns |
| [Component Organization](./component-organization.md) | Where components live and why               |

### Features

| Document                                             | Description                                 |
| ---------------------------------------------------- | ------------------------------------------- |
| [Thumbnail Gallery](./features/thumbnail-gallery.md) | Gallery display, masonry layout, navigation |
| [File Viewer](./features/file-viewer.md)             | Media viewer, keyboard navigation, gestures |
| [Tags System](./features/tags-system.md)             | Tag display, filtering, sidebar             |

### Integrations

| Document                                           | Description                          |
| -------------------------------------------------- | ------------------------------------ |
| [Hydrus API](./integrations/hydrus-api.md)         | API client, endpoints, data shapes   |
| [TanStack Query](./integrations/tanstack-query.md) | Query patterns, caching, prefetching |

### UI Components

| Document                                       | Description                                     |
| ---------------------------------------------- | ----------------------------------------------- |
| [UI Primitives](./ui/primitives.md)            | Base components (Button, Card, Dialog, etc.)    |
| [Responsive Design](./ui/responsive-design.md) | Tailwind variants, breakpoints, mobile patterns |

## Adding New Documentation

1. Create a new `.md` file in the appropriate subfolder
2. Add an entry to this README's index
3. Reference from `copilot-instructions.md` if it should be auto-included for relevant files

## For AI Assistants

These docs are referenced from `.github/copilot-instructions.md` and may be included as context when working on related files. Each doc should be self-contained with:

- Clear purpose statement
- Code examples where applicable
- Links to related source files
- Decision rationale (why, not just what)
