# Hydrus API Integration

> **Status**: Partial - Client setup documented, endpoints/types pending

## Overview

The Hydrus API integration connects to a local [Hydrus Network](https://hydrusnetwork.github.io/hydrus/) client. It uses Axios for HTTP requests with automatic session key management and error recovery.

**For official Hydrus API documentation**, see the [Hydrus Client API docs](https://hydrusnetwork.github.io/hydrus/developer_api.html).

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

| Status | Meaning         | Handling                   |
| ------ | --------------- | -------------------------- |
| 419    | Session expired | Auto-refresh and retry     |
| 4xx    | Client error    | No retry (non-recoverable) |
| 5xx    | Server error    | Retry up to 3 times        |

### Request Interceptors

All clients inject credentials from Zustand store:

```ts
client.interceptors.request.use((config) => {
  const { api_endpoint, api_access_key } = useAuthStore.getState();
  config.baseURL = api_endpoint;
  config.headers["Hydrus-Client-API-Access-Key"] = api_access_key;
  return config;
});
```

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
| `api_endpoint`       | Hydrus client URL (e.g., `http://localhost:45869`) |
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
| `queries/*.ts`                  | TanStack Query hooks (see [TanStack Query](./tanstack-query.md)) |

## TODO

- [ ] Document available endpoints
- [ ] Document data models and Zod schemas
- [ ] Document file URL generation
