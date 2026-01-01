---
applyTo: "**/integrations/hydrus-api/queries/**,**/integrations/tanstack-query/**"
---

# TanStack Query Development

Query conventions:

- Hook name: `use{Action}Query` or `use{Action}Mutation`
- Always check `isConfigured` before enabling queries
- Use `staleTime: Infinity` for data that doesn't change without user action
- Update cache in mutation `onSuccess` for immediate UI feedback

See [tanstack-query.md](../docs/integrations/tanstack-query.md) for full patterns.
