---
applyTo: "**/integrations/hydrus-api/**,**/lib/hydrus-config-store.ts"
---

# Hydrus API Development

The Hydrus API integration uses:

- Three client types: `baseClient` (no auth), `accessKeyClient` (permanent key), `sessionKeyClient` (temporary)
- Automatic session key refresh on 419 errors with Web Locks for cross-tab coordination
- Zod schemas for response validation
- Permission-based feature gating with graceful degradation

## Permissions

- `usePermissions()` in `queries/permissions.ts` - Main hook returning `hasPermission()` function
- `useHasPermission()` in `queries/access.ts` - Single permission check for query hooks
- All search queries require `SEARCH_FOR_AND_FETCH_FILES` permission
- Other queries check their specific permission (e.g., `MANAGE_DATABASE`, `MANAGE_PAGES`)

See [hydrus-api.md](../docs/integrations/hydrus-api.md) for endpoint documentation and patterns.
