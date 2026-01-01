---
applyTo: "**/components/tag/**,**/lib/tag-utils.ts"
---

# Tags Development

Tags support namespaces (e.g., `creator:artist_name`) and are color-coded from Hydrus client options.

Key utilities:

- `parseTag(displayTag)` - Splits tag string into namespace and tag
- `compareTags()` / `compareTagStrings()` - Sort with namespaced tags first
- `useNamespaceColors()` - Get namespace → color mapping

See [tags-system.md](../docs/features/tags-system.md) for full documentation.
