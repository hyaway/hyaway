# Hydrus API Integration

> **Status**: Active - Documents all endpoints used by the application

## Overview

The Hydrus API integration connects to a local [hydrus network](https://hydrusnetwork.github.io/hydrus/) client. It uses Axios for HTTP requests with automatic session key management and error recovery. All API responses are validated with **Zod schemas** defined in `models.ts`.

**For official Hydrus API documentation**, see the [Hydrus Client API docs](https://hydrusnetwork.github.io/hydrus/developer_api.html).

## Common Response Fields

All JSON responses include the following fields indicating the API and client versions:

- `version`: The version of the Client API (e.g., 83).
- `hydrus_version`: The version of the Hydrus client (e.g., 653).

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  hydrus-config-store.ts                                         │
│  Zustand store with persisted credentials                       │
│  - api_endpoint (URL)                                           │
│  - api_access_key (permanent key)                               │
│  - sessionKey (temporary, auto-refreshed)                       │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  baseClient     │ │ accessKeyClient │ │ sessionKeyClient│
│  No auth        │ │ Access key auth │ │ Session key auth│
│  (api_version)  │ │ (verify, fetch) │ │ (all queries)   │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

## Client Types

### `baseClient`

No authentication. Used for:

- `getApiVersion()` - Check if endpoint is reachable
- `requestNewPermissions()` - Initial setup flow

### `accessKeyClient`

Uses permanent access key. Used for:

- `verifyAccessKey()` - Validate credentials
- `fetchSessionKey()` - Get temporary session key

### `sessionKeyClient`

Uses temporary session key (preferred). Used for all data queries:

- File metadata, search, services
- Page management
- File actions (trash, archive)

**Why session keys?** Session keys are temporary and scoped, reducing risk if intercepted. The access key is only used to obtain session keys.

## Session Key Management

Session keys expire (419 error). The client handles this automatically:

```
Request fails with 419
    │
    ▼
Acquire Web Lock (cross-tab coordination)
    │
    ▼
Check if another tab already refreshed
    │
    ├─► Yes: Use new key, retry request
    │
    └─► No: Fetch new session key via accessKeyClient
            │
            ▼
        Store in Zustand, retry request
```

**Web Locks API** ensures only one tab refreshes at a time, preventing race conditions.

## Error Handling

### HTTP Status Codes

| Status | Meaning         | Handling                             |
| ------ | --------------- | ------------------------------------ |
| 419    | Session expired | Auto-refresh and retry               |
| 4xx    | Client error    | No retry (non-recoverable)           |
| 5xx    | Server error    | Retried by TanStack Query (up to 3x) |

### Request Interceptors

All clients inject the base URL from the auth store.

**Caching note:** The base client disables browser caching (`Cache-Control: no-cache, no-store, must-revalidate`) because Hydrus has a short server-side cache and browser caching on top can produce confusingly stale data.

```ts
// base-client.ts
client.interceptors.request.use((config) => {
  const { api_endpoint } = useAuthStore.getState();
  config.baseURL = api_endpoint;
  return config;
});

// access-key-client.ts
client.interceptors.request.use((config) => {
  const { api_access_key } = useAuthStore.getState();
  config.headers["Hydrus-Client-API-Access-Key"] = api_access_key;
  return config;
});
```

`sessionKeyClient` injects `Hydrus-Client-API-Session-Key` and automatically refreshes on 419 via Web Locks to de-dupe refreshes across concurrent requests and browser tabs.

### Response Validation

All responses are validated with Zod schemas:

```ts
const response = await sessionKeyClient.get("/get_services");
return GetServicesResponseSchema.parse(response.data);
```

## Configuration Store

`hydrus-config-store.ts` manages:

| Field                | Purpose                                            |
| -------------------- | -------------------------------------------------- |
| `api_endpoint`       | Hydrus client URL (e.g., `http://127.0.0.1:45869`) |
| `api_access_key`     | Permanent API key from Hydrus                      |
| `sessionKey`         | Temporary session key (auto-managed)               |
| `authWithSessionKey` | Whether to prefer session key auth                 |

**Persistence:** Stored in localStorage via Zustand persist middleware.

**Cross-tab sync:** Changes sync across tabs via `cross-tab-sync.ts`.

## Key Files

| File                            | Purpose                                                          |
| ------------------------------- | ---------------------------------------------------------------- |
| `api-client.ts`                 | Exported API functions                                           |
| `hydrus-config-store.ts`        | Credential storage                                               |
| `clients/base-client.ts`        | Axios factory with endpoint injection                            |
| `clients/access-key-client.ts`  | Permanent key authentication                                     |
| `clients/session-key-client.ts` | Session key auth + auto-refresh                                  |
| `models.ts`                     | Zod schemas and TypeScript types                                 |
| `permissions.ts`                | Permission constants and utilities                               |
| `queries/*.ts`                  | TanStack Query hooks (see [TanStack Query](./tanstack-query.md)) |

## Permissions System

The app uses a permission-based feature gating system. Features degrade gracefully when permissions are missing.

### Permission Requirements

| Permission                   | Value | Required | Features Enabled                                    |
| ---------------------------- | ----- | -------- | --------------------------------------------------- |
| `SEARCH_FOR_AND_FETCH_FILES` | 3     | **Yes**  | Core functionality - file search, metadata, viewing |
| `IMPORT_AND_DELETE_FILES`    | 1     | No       | Archive, unarchive, trash, restore files            |
| `MANAGE_PAGES`               | 4     | No       | View/refresh/focus Hydrus pages                     |
| `MANAGE_DATABASE`            | 6     | No       | Thumbnail dimensions, namespace colors              |
| `EDIT_FILE_TIMES`            | 11    | No       | Sync view statistics to Hydrus                      |
| `EDIT_FILE_RATINGS`          | 9     | No       | Set file ratings                                    |

### Key Files

| File                     | Purpose                                                          |
| ------------------------ | ---------------------------------------------------------------- |
| `permissions.ts`         | Constants (`ALL_PERMISSIONS`, `PERMISSION_LABELS`) and utilities |
| `queries/permissions.ts` | `usePermissions()` hook for checking permissions                 |
| `queries/access.ts`      | `useHasPermission()` hook for single permission checks           |

### Checking Permissions

Use `usePermissions()` for checking multiple permissions:

```tsx
import { usePermissions } from "@/integrations/hydrus-api/queries/permissions";
import { Permission } from "@/integrations/hydrus-api/models";

function MyComponent() {
  const { hasPermission, isFetched, isPending } = usePermissions();

  const canManageFiles = hasPermission(Permission.IMPORT_AND_DELETE_FILES);
  const canManageDatabase = hasPermission(Permission.MANAGE_DATABASE);

  if (!canManageFiles) {
    return <p>File management disabled</p>;
  }
  // ...
}
```

Use `useHasPermission()` for single permission checks (used in query hooks):

```tsx
import { useHasPermission } from "@/integrations/hydrus-api/queries/access";
import { Permission } from "@/integrations/hydrus-api/models";

const canSearch = useHasPermission(Permission.SEARCH_FOR_AND_FETCH_FILES);
```

### Disabling Queries by Permission

All search queries check for `SEARCH_FOR_AND_FETCH_FILES` permission:

```tsx
// queries/search.ts
const useCanSearch = () =>
  useHasPermission(Permission.SEARCH_FOR_AND_FETCH_FILES);

export const useRecentlyArchivedFilesQuery = () => {
  const isConfigured = useIsApiConfigured();
  const canSearch = useCanSearch();

  return useQuery({
    // ...
    enabled: isConfigured && canSearch && tags.length > 0,
  });
};
```

Other queries follow similar patterns:

- `useGetClientOptionsQuery` - requires `MANAGE_DATABASE`
- `usePagesQuery` - requires `MANAGE_PAGES`
- File mutations - require `IMPORT_AND_DELETE_FILES`

### Permission-Gated Settings

Some settings depend on permissions and show appropriate messaging:

```tsx
// Example: History sync requires both EDIT_FILE_TIMES and MANAGE_DATABASE
const hasEditPermission = hasPermission(Permission.EDIT_FILE_TIMES);
const hasDatabasePermission = hasPermission(Permission.MANAGE_DATABASE);
const isSyncEnabled =
  hasEditPermission &&
  hasDatabasePermission &&
  hydrusOptionsFetched &&
  hydrusStatsActive;

const syncDescription = !hasEditPermission
  ? "Disabled: missing 'Edit file times' permission"
  : !hasDatabasePermission
    ? "Disabled: missing 'Manage database' permission"
    : // ...
```

### Effective Values with Permission Fallbacks

Some settings have "effective" hooks that apply permission-based fallbacks:

```tsx
// queries/options.ts
export const useEffectiveGalleryBaseWidthMode = (): GalleryBaseWidthMode => {
  const storedMode = useGalleryBaseWidthMode();
  const hasPermission = useHasPermission(Permission.MANAGE_DATABASE);

  // Fall back to "custom" when "service" selected but permission missing
  if (storedMode === "service" && !hasPermission) {
    return "custom";
  }
  return storedMode;
};
```

### Requesting Permissions

When requesting a new API key, users can choose between:

- **All permissions** (`permits_everything: true`) - Full access
- **Granular permissions** - Only the 5 permissions the app uses

```tsx
// api-client.ts
export async function requestNewPermissions(
  name: string,
  permitsEverything: boolean,
  basicPermissions?: Array<number>,
): Promise<RequestNewPermissionsResponse> {
  const params = permitsEverything
    ? { name, permits_everything: true }
    : { name, basic_permissions: JSON.stringify(basicPermissions) };
  // ...
}
```

### UI Components

| Component              | Purpose                                                    |
| ---------------------- | ---------------------------------------------------------- |
| `PermissionsChecklist` | Shows permission status with checkmarks/X marks            |
| `PagePermissionGate`   | Wraps pages to show missing permissions                    |
| `SidebarNavLink`       | Shows muted (but clickable) links when permissions missing |

## Used Endpoints

### Access Management

#### `GET /api_version`

Gets the current API version. No authentication required.

**Response:**

```json
{
  "version": 83,
  "hydrus_version": 653
}
```

Used by `getApiVersion()` to check if a Hydrus endpoint is reachable.

---

#### `GET /request_new_permissions`

Register a new external program with the client. Requires the "add from api request" dialog to be open in the Hydrus client.

**Parameters:**

| Name                 | Type    | Description                                |
| -------------------- | ------- | ------------------------------------------ |
| `name`               | string  | Descriptive name for your access           |
| `permits_everything` | boolean | Whether to permit all tasks now and future |
| `basic_permissions`  | array   | List of numerical permission identifiers   |

**Response:**

```json
{
  "access_key": "73c9ab12751dcf3368f028d3abbe1d8e2a3a48d0de25e64f3a8f00f3a1424c57"
}
```

Used by `requestNewPermissions()` during initial setup flow.

---

#### `GET /session_key`

Get a new session key. Requires valid access key.

**Response:**

```json
{
  "session_key": "f6e651e7467255ade6f7c66050f3d595ff06d6f3d3693a3a6fb1a9c2b278f800"
}
```

Session keys expire after 24 hours of inactivity, on client restart, or if the access key is deleted. An expired session key returns 419.

Used by `fetchSessionKey()` in `access-key-client.ts`.

---

#### `GET /verify_access_key`

Check if your access key is valid and get permission info.

**Response:**

```json
{
  "name": "hyaway-app",
  "permits_everything": true,
  "basic_permissions": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
  "human_description": "API Permissions (hyaway-app): can do anything"
}
```

Used by `verifyAccessKey()` to validate credentials.

---

#### `GET /get_services`

Get information about all services configured in the Hydrus client.

**Response:**

```json
{
  "services": {
    "6c6f63616c2074616773": {
      "name": "my tags",
      "type": 5,
      "type_pretty": "local tag domain"
    },
    "6c6f63616c2066696c6573": {
      "name": "my files",
      "type": 2,
      "type_pretty": "local file domain"
    }
  }
}
```

**Service Types:**

| Type | Description                          |
| ---- | ------------------------------------ |
| 0    | Tag repository                       |
| 1    | File repository                      |
| 2    | Local file domain (e.g., "my files") |
| 5    | Local tag domain (e.g., "my tags")   |
| 10   | All known tags                       |
| 11   | All known files                      |
| 14   | Trash                                |
| 15   | Hydrus local file storage            |
| 21   | Combined local file domains          |

Used by `getServices()`.

---

### Searching and Fetching Files

#### `GET /get_files/search_files`

Search for files matching given criteria. Returns file IDs, not full metadata.

**Parameters:**

| Name                   | Type    | Description                                       |
| ---------------------- | ------- | ------------------------------------------------- |
| `tags`                 | array   | JSON-encoded list of tags to search for           |
| `file_service_key`     | string  | (optional) File domain to search                  |
| `tag_service_key`      | string  | (optional) Tag domain to search                   |
| `include_current_tags` | boolean | (optional) Search current tags, default `true`    |
| `include_pending_tags` | boolean | (optional) Search pending tags, default `true`    |
| `file_sort_type`       | integer | (optional) Sort method, default `2` (import time) |
| `file_sort_asc`        | boolean | (optional) Sort order, default `true`             |
| `return_file_ids`      | boolean | (optional) Return file IDs, default `true`        |
| `return_hashes`        | boolean | (optional) Return hashes, default `false`         |

**Sort Types:**

| Value | Sort By               |
| ----- | --------------------- |
| 0     | File size             |
| 1     | Duration              |
| 2     | Import time (default) |
| 3     | File type             |
| 4     | Random                |
| 5     | Width                 |
| 6     | Height                |
| 14    | Modified time         |
| 18    | Last viewed time      |
| 19    | Archive timestamp     |

**Response:**

```json
{
  "file_ids": [125462, 4852415, 123, 591415]
}
```

Tags support system predicates like `system:inbox`, `system:limit=16`, `system:height > 2000`. OR predicates use nested arrays: `["bird", ["cat", "dog"]]`.

Used by `searchFiles()`.

---

#### `GET /get_files/file_metadata`

Get metadata for specified file IDs.

**Parameters:**

| Name                            | Type    | Description                                          |
| ------------------------------- | ------- | ---------------------------------------------------- |
| `file_ids`                      | array   | JSON-encoded list of file IDs                        |
| `hashes`                        | array   | Alternative: JSON-encoded list of SHA256 hashes      |
| `create_new_file_ids`           | boolean | (optional) Create IDs for unknown hashes             |
| `only_return_basic_information` | boolean | (optional) Return minimal info, faster for first req |
| `detailed_url_information`      | boolean | (optional) Include detailed URL info                 |
| `include_blurhash`              | boolean | (optional) Include blurhash strings                  |
| `include_milliseconds`          | boolean | (optional) Timestamps as floats with ms              |
| `include_notes`                 | boolean | (optional) Include file notes                        |
| `include_services_object`       | boolean | (optional) Include services reference                |

**Response (basic information):**

```json
{
  "metadata": [
    {
      "file_id": 123,
      "hash": "4c77267f93415de0bc33b7725b8c331a809a924084bee03ab2f5fae1c6019eb2",
      "size": 63405,
      "mime": "image/jpeg",
      "filetype_human": "jpeg",
      "filetype_enum": 1,
      "ext": ".jpg",
      "width": 640,
      "height": 480,
      "duration": null,
      "has_audio": false,
      "num_frames": null,
      "num_words": null
    }
  ]
}
```

**Response (full information):**

Additional fields include:

- `is_inbox`, `is_local`, `is_trashed`, `is_deleted` - File status flags
- `thumbnail_width`, `thumbnail_height` - Predicted thumbnail dimensions
- `blurhash` - Base83 encoded blurhash for placeholders
- `tags` - Object mapping service keys to tag data by status
- `file_services` - Current and deleted file service info with timestamps

**Tag Status Values:**

| Status | Meaning    |
| ------ | ---------- |
| 0      | Current    |
| 1      | Pending    |
| 2      | Deleted    |
| 3      | Petitioned |

Used by `getFileMetadata()`.

---

#### `GET /get_files/file`

Get a file's raw bytes.

**Parameters:**

| Name       | Type    | Description                        |
| ---------- | ------- | ---------------------------------- |
| `file_id`  | integer | (selective) File ID                |
| `hash`     | string  | (selective) SHA256 hash            |
| `download` | boolean | (optional) Set Content-Disposition |

**Response:** The file with correct MIME type. Supports Range requests for video streaming.

Used to construct file URLs: `/get_files/file?file_id={id}` or `/get_files/file?hash={hash}`

---

#### `GET /get_files/thumbnail`

Get a file's thumbnail.

**Parameters:**

| Name      | Type    | Description             |
| --------- | ------- | ----------------------- |
| `file_id` | integer | (selective) File ID     |
| `hash`    | string  | (selective) SHA256 hash |

**Response:** JPEG or PNG thumbnail. Returns default icon for files without thumbnails (PDFs, etc.). Never returns 404.

Used to construct thumbnail URLs: `/get_files/thumbnail?file_id={id}`

---

### Managing Pages

#### `GET /manage_pages/get_pages`

Get the page structure of the current UI session.

**Response:**

```json
{
  "pages": {
    "name": "top pages notebook",
    "page_key": "3b28d8a59ec61834325eb6275d9df012860a1ecfd9e1246423059bc47fb6d5bd",
    "page_state": 0,
    "page_type": 10,
    "is_media_page": false,
    "selected": true,
    "pages": [
      {
        "name": "files",
        "page_key": "d436ff5109215199913705eb9a7669d8a6b67c52e41c3b42904db083255ca84d",
        "page_state": 0,
        "page_type": 6,
        "is_media_page": true,
        "selected": false
      }
    ]
  }
}
```

**Page Types:**

| Type | Description        |
| ---- | ------------------ |
| 1    | Gallery downloader |
| 2    | Simple downloader  |
| 3    | Hard drive import  |
| 5    | Petitions          |
| 6    | File search        |
| 7    | URL downloader     |
| 8    | Duplicates         |
| 9    | Thread watcher     |
| 10   | Page of pages      |

**Page States:**

| State | Meaning           |
| ----- | ----------------- |
| 0     | Ready             |
| 1     | Initialising      |
| 2     | Searching/loading |
| 3     | Search cancelled  |

Used by `getPages()`.

---

#### `GET /manage_pages/get_page_info`

Get detailed information about a specific page.

**Parameters:**

| Name       | Type    | Description                    |
| ---------- | ------- | ------------------------------ |
| `page_key` | string  | Hexadecimal page key           |
| `simple`   | boolean | (optional) Simplified response |

**Response (simple=true for media page):**

```json
{
  "page_info": {
    "name": "files",
    "page_key": "aebbf4b594e6986bddf1eeb0b5846a1e6bc4e07088e517aff166f1aeb1c3c9da",
    "page_state": 0,
    "page_type": 6,
    "is_media_page": true
  },
  "media": {
    "num_files": 4,
    "hash_ids": [12345, 12346, 88754, 23]
  }
}
```

Used by `getPageInfo()`.

---

#### `POST /manage_pages/refresh_page`

Refresh a page (re-run search for search pages).

**Body:**

```json
{
  "page_key": "af98318b6eece15fef3cf0378385ce759bfe056916f6e12157cd928eb56c1f18"
}
```

Used by `refreshPage()`.

---

#### `POST /manage_pages/focus_page`

Make a page the current visible page.

**Body:**

```json
{
  "page_key": "af98318b6eece15fef3cf0378385ce759bfe056916f6e12157cd928eb56c1f18"
}
```

Used by `focusPage()`.

---

### Importing and Deleting Files

#### `POST /add_files/delete_files`

Send files to the trash.

**Body:**

```json
{
  "file_ids": [123, 456],
  "reason": "Duplicate"
}
```

Or using other identifiers:

```json
{
  "hash": "78f92ba4a786225ee2a1236efa6b7dc81dd729faf4af99f96f3e20bad6d8b538"
}
```

**File Identifiers:** Can use `file_id`, `file_ids`, `hash`, or `hashes`.

**Important:** Deleting from `combined local file domains` sends to trash. Deleting from `hydrus local file storage` permanently deletes.

Used by `deleteFiles()`.

---

#### `POST /add_files/undelete_files`

Restore files from trash to their original locations.

**Body:**

```json
{
  "hash": "78f92ba4a786225ee2a1236efa6b7dc81dd729faf4af99f96f3e20bad6d8b538"
}
```

Used by `undeleteFiles()`.

---

#### `POST /add_files/archive_files`

Archive files (remove from inbox).

**Body:**

```json
{
  "file_ids": [123, 456]
}
```

Used by `archiveFiles()`.

---

#### `POST /add_files/unarchive_files`

Return archived files to inbox.

**Body:**

```json
{
  "file_ids": [123, 456]
}
```

Used by `unarchiveFiles()`.

---

### Managing the Database

#### `GET /manage_database/get_client_options`

Get the current client options. Response structure is unstable and may change.

**Response (partial):**

```json
{
  "old_options": {
    "thumbnail_dimensions": [200, 200],
    "namespace_colours": {
      "character": [0, 170, 0],
      "creator": [170, 0, 0],
      "series": [170, 0, 170],
      "null": [114, 160, 193]
    }
  }
}
```

The `namespace_colours` map provides RGB color values for tag namespaces. The key `"null"` provides the default color for unnamespaced tags.

Used by `getClientOptions()` for namespace colors and thumbnail dimensions.

---

## File URL Generation

Files and thumbnails are accessed via URL parameters (Hydrus expects auth in a query parameter for these endpoints).

```typescript
// File URL (auth can be access key or session key depending on settings)
`${api_endpoint}/get_files/file?file_id=${fileId}&${headerName}=${authKey}`;
// Thumbnail URL
`${api_endpoint}/get_files/thumbnail?file_id=${fileId}&${headerName}=${authKey}`;
```

The `useUrlWithApiKey()` / `useFullFileIdUrl()` / `useThumbnailUrl()` hooks in `hooks/use-url-with-api-key.ts` construct these URLs with proper authentication and session-key refresh behavior for media loads.

---

## Data Models

### FileMetadata

Core file information returned by `/get_files/file_metadata`:

```typescript
interface FileMetadata {
  file_id: number;
  hash: string;
  size: number | null;
  mime: string;
  ext: string;
  width: number;
  height: number;
  duration: number | null;
  has_audio: boolean | null;
  num_frames: number | null;
  num_words: number | null;
  filetype_human: string;
  filetype_enum: number;
  filetype_forced: boolean;
  blurhash?: string | null;
  thumbnail_width?: number;
  thumbnail_height?: number;
  is_inbox?: boolean;
  is_local?: boolean;
  is_trashed?: boolean;
  is_deleted?: boolean;
  tags?: Record<string, TagServiceData>;
}
```

### Enums

**Permission** - API access permissions:

| Value | Permission                 |
| ----- | -------------------------- |
| 0     | Import and edit URLs       |
| 1     | Import and delete files    |
| 2     | Edit file tags             |
| 3     | Search for and fetch files |
| 4     | Manage pages               |
| 5     | Manage cookies/headers     |
| 6     | Manage database            |
| 7     | Edit file notes            |
| 8     | Edit file relationships    |
| 9     | Edit file ratings          |
| 10    | Manage popups              |
| 11    | Edit file times            |
| 12    | Commit pending             |
| 13    | See local paths            |

**HydrusFileSortType** - File sort options for search:

| Value | Sort By               |
| ----- | --------------------- |
| 0     | File size             |
| 1     | Duration              |
| 2     | Import time           |
| 3     | File type             |
| 4     | Random                |
| 5     | Width                 |
| 6     | Height                |
| 7     | Ratio                 |
| 8     | Number of pixels      |
| 9     | Number of tags        |
| 10    | Number of media views |
| 11    | Total media viewtime  |
| 12    | Approximate bitrate   |
| 13    | Has audio             |
| 14    | Modified time         |
| 15    | Framerate             |
| 16    | Number of frames      |
| 18    | Last viewed time      |
| 19    | Archive timestamp     |

See [models.ts](../../src/integrations/hydrus-api/models.ts) for complete type definitions.
