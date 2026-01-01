---
applyTo: "**/routes/**"
---

# Routing Development

This project uses TanStack Router's file-based routing with specific organizational patterns:

- **Pathless groups `()`** - Organize routes without affecting URLs
- **`-` prefix** - Co-locate route-specific files (ignored by router)
- **Layout routes `_`** - Wrap child routes (e.g., `_auth.tsx`)
- **Dynamic segments `$`** - e.g., `file.$fileId.tsx`

See [routing-conventions.md](../docs/routing-conventions.md) for full documentation.
