hyAway is a web UI for browsing files from a hydrus network client via the Hydrus Client API.

## Requirements

- Node.js (project uses `pnpm`)
- A Hydrus client with the Client API enabled

## Quick Start

```bash
pnpm install
pnpm dev
```

Then open `http://localhost:3000`.

To connect to Hydrus, configure the endpoint + access key in the app under **Settings → Connection**.

📖 **[Setup Guide](docs/SETUP.md)** — Detailed instructions for local, remote, and self-hosted setups.

## Common Commands

```bash
pnpm dev           # Start dev server on port 3000
pnpm build         # Production build (vite build && tsc)
pnpm serve         # Preview the production build
pnpm test          # Run Vitest
pnpm typecheck     # TypeScript check only
pnpm check         # Prettier write + eslint --fix
pnpm storybook     # Component playground on port 6006
```

## Tech Stack

- React 19 + TypeScript
- TanStack Router (file-based routing)
- TanStack Query
- Zustand
- Zod (API validation)
- Tailwind CSS v4
- shadcn/ui-style components built on Base UI

## Documentation

Developer docs live in `.github/docs/` (start with `.github/docs/README.md`).
