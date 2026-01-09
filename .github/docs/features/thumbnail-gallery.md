# Thumbnail Gallery

> **Status**: Active pattern used throughout the codebase

## Overview

The thumbnail gallery displays file thumbnails in a responsive masonry grid with virtualization, infinite scroll, and keyboard navigation. It's used across multiple pages (inbox, recent, search results, etc.).

## Key Features

- **Masonry layout** - Variable-height items in columns
- **Window virtualization** - Only renders visible items (TanStack Virtual)
- **Infinite scroll** - Fetches more items as you scroll
- **Keyboard navigation** - Arrow keys navigate the grid logically
- **Hover zoom** - Cards scale up on hover with smart origin positioning
- **Context menu** - Right-click for file actions
- **Scroll restoration** - Returns to previous position on back navigation

## Components

### `ThumbnailGallery`

Main entry point. Pass file IDs, and it handles data fetching and rendering.

```tsx
import { ThumbnailGallery } from "@/components/thumbnail-gallery/thumbnail-gallery";

<ThumbnailGallery
  fileIds={[1, 2, 3, 4, 5]}
  getFileLink={(fileId) => ({
    to: "/file/$fileId",
    params: { fileId: String(fileId) },
  })}
/>;
```

**Props:**

- `fileIds` - Array of Hydrus file IDs to display
- `getFileLink` - Optional custom link builder for contextual navigation

### `ThumbnailGalleryItem`

Individual item component (memoized). Renders thumbnail, blurhash placeholder, status badges, and handles hover/focus states.

**Features:**

- Blurhash placeholder while image loads
- Status badges (inbox, trash, video, audio indicators)
- Smart hover scale origin based on position in grid
- Context menu with file actions

### `ThumbnailGallerySkeleton`

Loading placeholder using CSS columns masonry.

## Hooks

### `useGalleryResponsiveLanes`

Calculates grid dimensions based on container width using gallery settings.

```ts
const { width, lanes } = useGalleryResponsiveLanes(
  containerRef,
  defaultWidth,
  itemCount,
);
```

**Returns:**

- `width` - Calculated item width in pixels
- `lanes` - Number of columns

**Respects settings:**

- `maxLanes` - Maximum columns allowed
- `expandImages` - Whether to stretch thumbnails to fill columns

### `useMasonryNavigation`

Keyboard navigation for masonry grids. Handles arrow keys intelligently for variable-height layouts.

```ts
const { setLinkRef, handleKeyDown, handleItemFocus, getTabIndex } =
  useMasonryNavigation({
    lanes,
    totalItems,
    getVirtualItems,
    scrollToIndex,
  });
```

**Navigation behavior:**

| Key   | Action                                                 |
| ----- | ------------------------------------------------------ |
| ← / → | Move to adjacent lane, finding closest item vertically |
| ↑ / ↓ | Stay in same lane, move to item above/below            |
| Home  | Jump to first item                                     |
| End   | Jump to last item                                      |

## Data Flow

```
fileIds (prop)
    │
    ▼
useInfiniteGetFilesMetadata() → paginated FileMetadata[]
    │
    ▼
useGalleryResponsiveLanes() → { width, lanes }
    │
    ▼
useWindowVirtualizer() → virtual items
    │
    ▼
ThumbnailGalleryItem × N (only visible items)
    │
    ├─► TagsSidebar (aggregated tags from loaded items)
    └─► Badge (scroll position indicator)
```

## Settings

Stored in `stores/gallery-settings-store.ts` (plus linked viewer background in `stores/file-viewer-settings-store.ts`):

| Setting                 | Type                                         | Description                                     |
| ----------------------- | -------------------------------------------- | ----------------------------------------------- |
| `minLanes` / `maxLanes` | number                                       | Column range                                    |
| `expandImages`          | boolean                                      | Stretch thumbnails to fill columns              |
| `showScrollBadge`       | boolean                                      | Show scroll position badge                      |
| `enableContextMenu`     | boolean                                      | Enable right-click context menu                 |
| `enableHoverZoom`       | boolean                                      | Enable hover zoom                               |
| `baseWidthMode`         | `"service"` \| `"custom"`                    | Use Hydrus thumbnail size or a custom size      |
| `customBaseWidth`       | number                                       | Custom thumbnail base width in px               |
| `horizontalGap`         | number                                       | Horizontal gap between items in px              |
| `verticalGap`           | number                                       | Vertical gap between items in px                |
| `reflowDuration`        | number                                       | Reflow animation duration (ms)                  |
| `entryDuration`         | number                                       | Entry animation duration (ms)                   |
| `hoverZoomDuration`     | number                                       | Hover zoom animation duration (ms)              |
| `imageBackground`       | `"solid"` \| `"checkerboard"` \| `"average"` | Background for images                           |
| `linkImageBackground`   | boolean                                      | When enabled, gallery background follows viewer |

See [Settings Architecture](../settings-architecture.md) for the settings UI pattern.

## Performance Optimizations

- **Window virtualization** - Only DOM nodes for visible items
- **useDeferredValue** - Old grid stays visible while new items load
- **Height caching** - Item heights cached, invalidated on width change
- **Memoized items** - `ThumbnailGalleryItem` is wrapped in `memo()`
- **Scroll restoration** - Uses `useScrollRestoration` hook
- **CSS variables for animation settings** - Duration settings are read once at gallery root and passed to children via CSS custom properties, avoiding re-renders of all items when settings change

### CSS Variables

Animation durations are set as CSS custom properties at the gallery root to prevent child re-renders:

```tsx
// In thumbnail-gallery.tsx
const galleryStyle = {
  "--gallery-reflow-duration": `${reflowDuration}ms`,
  "--gallery-entry-duration": `${entryDuration}ms`,
  "--gallery-hover-zoom-duration": `${hoverZoomDuration}ms`,
};
```

Children consume these via Tailwind classes:

```tsx
// In thumbnail-gallery-item.tsx
className = "duration-(--gallery-hover-zoom-duration)";

// In thumbnail-gallery-item-image.tsx
className = "duration-(--gallery-entry-duration)";
```

See [CSS Patterns](../ui/css-patterns.md) for the full pattern documentation.

## Related Files

| File                                                                              | Purpose                                 |
| --------------------------------------------------------------------------------- | --------------------------------------- |
| `src/components/thumbnail-gallery/thumbnail-gallery.tsx`                          | Main component with virtualization      |
| `src/components/thumbnail-gallery/thumbnail-gallery-item.tsx`                     | Individual item with hover/context menu |
| `src/components/thumbnail-gallery/thumbnail-gallery-skeleton.tsx`                 | Loading state                           |
| `src/components/thumbnail-gallery/thumbnail-gallery-display-settings-popover.tsx` | Inline settings                         |
| `src/hooks/use-responsive-lanes.ts`                                               | Lane dimension calculation              |
| `src/hooks/use-masonry-navigation.ts`                                             | Keyboard navigation                     |
| `src/hooks/use-scroll-restoration.ts`                                             | Position persistence                    |
