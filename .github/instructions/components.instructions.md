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
