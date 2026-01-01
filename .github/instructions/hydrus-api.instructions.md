---
applyTo: "**/integrations/hydrus-api/**,**/lib/hydrus-config-store.ts"
---

# Hydrus API Development

The Hydrus API integration uses:

- Three client types: `baseClient` (no auth), `accessKeyClient` (permanent key), `sessionKeyClient` (temporary)
- Automatic session key refresh on 419 errors with Web Locks for cross-tab coordination
- Zod schemas for response validation

See [hydrus-api.md](../docs/integrations/hydrus-api.md) for endpoint documentation and patterns.
