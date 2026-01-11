# Tags System

> **Status**: Active pattern used throughout the codebase

## Overview

The tags system displays and manages hydrus network tags throughout the application. Tags support namespaces (e.g., `creator:artist_name`) and are color-coded based on Hydrus client configuration.

## Key Concepts

### Tag Format

Tags in Hydrus can be either:

- **Simple tags**: `landscape`, `sunset`
- **Namespaced tags**: `creator:artist_name`, `series:show_title`

The colon (`:`) separates namespace from tag value.

### Namespace Colors

Tag colors come from Hydrus client options (`/get_client_options`). The `useNamespaceColors()` hook provides a mapping of namespace → color. Special key `"null"` provides the default color for unnamespaced tags.

## Components

### `TagBadge`

The primary tag display component. Renders a colored badge with namespace prefix.

```tsx
import { TagBadge } from "@/components/tag/tag-badge";

// With explicit namespace
<TagBadge tag="artist_name" namespace="creator" />

// With count (for aggregated views)
<TagBadge tag="landscape" namespace="">
  <TagBadge.Count>42</TagBadge.Count>
</TagBadge>
```

**Props:**

- `tag` - The tag value (without namespace)
- `namespace` - Optional namespace prefix
- `children` - Optional content (typically `TagBadge.Count`)

### `TagBadgeFromString`

Convenience wrapper that parses a raw tag string.

```tsx
import { TagBadgeFromString } from "@/components/tag/tag-badge";

// Automatically parses "creator:artist_name"
<TagBadgeFromString displayTag="creator:artist_name" />;
```

### `InlineTagsList`

Displays all tags for a single file with filtering support.

```tsx
import { InlineTagsList } from "@/components/tag/inline-tags-list";

<InlineTagsList data={fileMetadata} />;
```

**Features:**

- Shows tags from "all known tags" service
- Filter input to search within tags
- Tags sorted: namespaced first, then alphabetically

### `TagsSidebar`

Aggregated tag view for multiple files with virtualized scrolling.

```tsx
import { TagsSidebar } from "@/components/tag/tags-sidebar";

<TagsSidebar items={filesArray} />;
```

**Features:**

- Aggregates tags across all loaded files
- Shows count per tag (how many files have this tag)
- Two sort modes: by count or by namespace
- Virtualized list for performance with many tags
- Uses `useDeferredValue` for responsive filtering

## Utilities

### `parseTag(displayTag)`

Splits a tag string into namespace and tag parts.

```ts
import { parseTag } from "@/lib/tag-utils";

parseTag("creator:artist"); // { namespace: "creator", tag: "artist" }
parseTag("landscape"); // { namespace: "", tag: "landscape" }
```

### `compareTags(a, b)` / `compareTagStrings(a, b)`

Sort comparison functions. Namespaced tags come first, then sorted by namespace, then by tag name.

```ts
import { compareTagStrings } from "@/lib/tag-utils";

tags.sort(compareTagStrings);
```

## Data Flow

```
Hydrus API (/get_file_metadata)
    │
    ▼
FileMetadata.tags[serviceId].display_tags[TagStatus.CURRENT]
    │
    ▼
parseTag() → { namespace, tag }
    │
    ▼
useNamespaceColors() → color from client options
    │
    ▼
TagBadge renders with --badge-overlay CSS variable
```

## Settings

Tag sort mode is stored in `stores/tags-settings-store.ts`:

- `sortMode`: `"count"` | `"namespace"`

## Related Files

| File                                             | Purpose                       |
| ------------------------------------------------ | ----------------------------- |
| `src/components/tag/tag-badge.tsx`               | Core badge component          |
| `src/components/tag/inline-tags-list.tsx`        | Single-file tag list          |
| `src/components/tag/tags-sidebar.tsx`            | Multi-file aggregated sidebar |
| `src/lib/tag-utils.ts`                           | Parsing and sorting utilities |
| `src/integrations/hydrus-api/queries/options.ts` | `useNamespaceColors()` hook   |
