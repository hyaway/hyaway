# File Viewer

> **Status**: Active pattern used throughout the codebase

## Overview

The file viewer displays individual files with type-specific media players, metadata, tags, and file actions. It's used on `/file/$fileId` and contextual routes like `/random-inbox/$fileId`, `/history/$fileId`, and remote page routes.

## Key Features

- **Type-specific viewers** - Images, video, audio, deleted files, unsupported formats
- **Context navigation** - Prev/next within gallery context
- **File actions** - Trash, archive, download, open externally
- **Watch history** - Tracks viewed files (optional)
- **Floating footer** - Actions always accessible

## Components

### `FileDetail`

Main entry point. Fetches file metadata and renders the full detail view.

```tsx
import { FileDetail } from "@/components/file-detail/file-detail";

<FileDetail
  fileId={12345}
  prependActions={navActions} // Optional prev/next buttons
  trackLocalWatchHistory={true} // Whether to record in watch history
/>;
```

**Renders:**

- `FileViewer` - Media display
- `FilePageHeader` - Breadcrumb with file ID
- `FileStatusBadges` - Inbox/trash/archive status
- `ContentDetailsTable` / `FileInfoTable` - Metadata tables
- `InlineTagsList` - All tags for the file
- `PageFloatingFooter` - Action buttons

### `FileViewer`

Routes to the appropriate viewer based on MIME type.

```tsx
import { FileViewer } from "@/components/file-detail/file-viewer";

<FileViewer data={fileMetadata} />;
```

**Type routing:**

| MIME prefix | Viewer                  |
| ----------- | ----------------------- |
| `image/*`   | `ImageViewer`           |
| `video/*`   | `VideoViewer`           |
| `audio/*`   | `AudioViewer`           |
| deleted     | `DeletedFileViewer`     |
| other       | `UnsupportedFileViewer` |

### Viewers

| Component               | Features                                                 |
| ----------------------- | -------------------------------------------------------- |
| `ImageViewer`           | Click to expand/collapse, checkerboard background option |
| `VideoViewer`           | Vidstack player with default controls                    |
| `AudioViewer`           | Vidstack audio player                                    |
| `DeletedFileViewer`     | Shows deletion info                                      |
| `UnsupportedFileViewer` | Download link for unknown types                          |

## Hooks

### `useFileContextNavigation`

Manages prev/next navigation within a gallery context.

```ts
const { navActions, shouldFallback, currentPosition, totalCount } =
  useFileContextNavigation({
    fileId,
    fileIds, // List from gallery context
    isLoading,
    isError,
    contextRoute, // e.g., "/inbox/$fileId"
    buildParams, // (id) => ({ fileId: String(id) })
  });
```

**Behavior:**

- Returns prev/next actions for floating footer
- Auto-redirects to `/file/$fileId` if context unavailable
- Tracks position in list (e.g., "3 of 50")

### `useFileActions`

Generates action buttons for a file.

```ts
const actionGroups = useFileActions(fileMetadata, {
  includeExternal: true, // Download, open in new tab
  includeThumbnail: false, // Thumbnail link
});
```

**Action groups:**

| Group      | Actions                             |
| ---------- | ----------------------------------- |
| Navigation | Open, Open in new tab               |
| Management | Trash/Undelete, Archive/Unarchive   |
| External   | Download, Open file, Open thumbnail |

## Data Flow

```
fileId (prop)
    │
    ▼
useGetSingleFileMetadata() → FileMetadata
    │
    ├─► FileViewer → type-specific viewer
    │
    ├─► FileStatusBadges → inbox/trash status
    │
    ├─► Metadata tables → file info
    │
    ├─► InlineTagsList → tags
    │
    └─► useFileActions() → action buttons
            │
            ▼
        PageFloatingFooter
```

## Settings

Stored in `stores/file-viewer-settings-store.ts`:

| Setting                | Type                                         | Description                                   |
| ---------------------- | -------------------------------------------- | --------------------------------------------- |
| `startExpanded`        | boolean                                      | Images start in expanded mode                 |
| `imageBackground`      | `"solid"` \| `"checkerboard"` \| `"average"` | Background for images (including transparent) |
| `fillCanvasBackground` | boolean                                      | Fill canvas with background color             |
| `videoStartExpanded`   | boolean                                      | Videos start expanded                         |
| `mediaAutoPlay`        | boolean                                      | Video/audio start automatically               |
| `mediaStartWithSound`  | boolean                                      | Video/audio start with sound                  |

## Watch History

When `trackLocalWatchHistory={true}` and history is enabled globally:

- File ID added to history on mount
- Stored in `stores/watch-history-store.ts`
- Displayed on `/history` page

## Related Files

| File                             | Purpose                             |
| -------------------------------- | ----------------------------------- |
| `file-detail.tsx`                | Main container with metadata layout |
| `file-viewer.tsx`                | MIME-based viewer router            |
| `viewers/*.tsx`                  | Type-specific media players         |
| `file-page-header.tsx`           | Breadcrumb header                   |
| `file-status-badges.tsx`         | Status indicators                   |
| `use-file-context-navigation.ts` | Prev/next navigation                |
| `use-file-actions.tsx`           | Action button generation            |
