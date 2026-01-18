hyAway is a web UI for browsing files from a hydrus network client via the Hydrus Client API.

🌐 **[hyaway.com](https://hyaway.com)** — Use hosted version on hyaway.com

📖 **[docs.hyaway.com](https://docs.hyaway.com)** — Setup guide and documentation

---

## Development

### Requirements

- Node.js (project uses `pnpm`)
- A Hydrus client with the Client API enabled

### Quick start

```bash
pnpm install
pnpm dev
```

Then open `http://localhost:3000`. Configure the endpoint + access key under **Settings → Connection**.

### Common commands

```bash
pnpm dev           # Start dev server on port 3000
pnpm build         # Production build
pnpm serve         # Preview the production build
pnpm test          # Run Vitest
pnpm typecheck     # TypeScript check only
pnpm check         # Prettier write + eslint --fix
pnpm storybook     # Component playground on port 6006
```

### Tech stack

- React 19 + TypeScript
- TanStack Router (file-based routing)
- TanStack Query
- Zustand
- Zod (API validation)
- Tailwind CSS v4
- shadcn/ui-style components built on Base UI

### Documentation

Developer docs live in `.github/docs/` (start with `.github/docs/README.md`).
