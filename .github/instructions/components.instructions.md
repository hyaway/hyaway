---
applyTo: "**/components/**,**/-components/**"
---

# Component Organization

Component locations:

- `ui-primitives/` - Base shadcn/ui components (button, card, dialog, etc.)
- `app-shell/` - App-level layout (header, sidebar)
- `page-shell/` - Page-level primitives (heading, loading, error states)
- `settings/` - Shared settings components
- `thumbnail-gallery/` - Gallery display
- `file-detail/` - File viewer and metadata
- `tag/` - Tag badges and lists

Route-specific components go in `routes/{group}/-components/`.

See [component-organization.md](../docs/component-organization.md) for the decision tree.

## Skeleton Components

When updating a component that has a corresponding skeleton (e.g., `tags-sidebar.tsx` → `tags-sidebar-skeleton.tsx`), **always update the skeleton to match**:

- Match the same structure (headers, content areas, footers)
- Use the same container classes and spacing
- Skeleton heights should approximate the real content
