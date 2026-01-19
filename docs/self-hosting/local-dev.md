# Local development

Set up a local development environment to customize hyAway for your needs.

---

## TL;DR

- Start dev server: `pnpm install` then `pnpm dev` (http://localhost:3000)
- Share to your LAN: `pnpm dev:host`
- Share to your tailnet: `pnpm dev:ts` (Tailscale URL typically has no port)

## Prerequisites

- **Node.js 20+** — [Download](https://nodejs.org/)
- **pnpm** — Install with `corepack enable` or `npm install -g pnpm`
- **Git** — [Download](https://git-scm.com/)

---

## Quick start

```bash
# Clone the repository
git clone https://github.com/hyaway/hyaway.git
cd hyaway

# Install dependencies
pnpm install

# Start the dev server
pnpm dev
```

The app will be available at **http://localhost:3000**

---

## Available scripts

| Command          | Description                                    |
| ---------------- | ---------------------------------------------- |
| `pnpm dev`       | Start dev server on port 3000                  |
| `pnpm dev:host`  | Start dev server accessible from other devices |
| `pnpm build`     | Production build                               |
| `pnpm serve`     | Preview production build                       |
| `pnpm test`      | Run Vitest tests                               |
| `pnpm check`     | Format + lint fix                              |
| `pnpm typecheck` | TypeScript check only                          |
| `pnpm storybook` | Component playground on port 6006              |

### Tailscale integration

```bash
pnpm dev:ts      # Expose dev server via Tailscale Serve
pnpm dev:ts:off  # Stop Tailscale Serve
pnpm ts:status   # Check Tailscale Serve status
```

---

## Project structure

```
src/
├── components/           # Shared components
│   ├── app-shell/        # Header, sidebar, layout
│   ├── file-detail/      # File viewer components
│   ├── page-shell/       # Page layout primitives
│   ├── settings/         # Settings controls
│   ├── tag/              # Tag components
│   ├── thumbnail-gallery/# Gallery components
│   └── ui-primitives/    # Base UI (shadcn/ui style)
├── hooks/                # Shared hooks
├── integrations/         # External integrations
│   ├── hydrus-api/       # Hydrus API client and queries
│   └── tanstack-query/   # Query client setup
├── lib/                  # Utilities and stores
├── routes/               # File-based routing (TanStack Router)
└── stores/               # Zustand state stores
```

---

## Tech stack

| Technology      | Purpose                 |
| --------------- | ----------------------- |
| React 19        | UI framework            |
| TypeScript      | Type safety             |
| TanStack Router | File-based routing      |
| TanStack Query  | Data fetching           |
| Zustand         | Client state management |
| Zod             | Schema validation       |
| Tailwind CSS v4 | Styling                 |
| Vite            | Build tool              |

---

## Development workflow

### Adding UI components

Use shadcn to add base UI primitives:

```bash
npx shadcn@latest add button
```

Components install to `src/components/ui-primitives/`.

### Code quality

```bash
# Format and lint in one command
pnpm check

# Or run separately
pnpm format    # Prettier
pnpm lint      # ESLint
pnpm typecheck # TypeScript
```

### Testing

```bash
pnpm test          # Run once
pnpm test --watch  # Watch mode
```

### Storybook

View and develop components in isolation:

```bash
pnpm storybook
```

Opens at http://localhost:6006

---

## Connecting to Hydrus

During development, connect to your Hydrus instance:

1. Start Hydrus with the Client API enabled (see [Getting started](../getting-started))
2. Open http://localhost:3000/settings/connection
3. Enter `http://127.0.0.1:45869` as the endpoint
4. Request or enter an access key

### Testing from other devices

To access the dev server from your phone or another device:

```bash
# Option 1: Network access (same WiFi)
pnpm dev:host
# Access at http://YOUR_IP:3000

# Option 2: Tailscale (any network)
pnpm dev:ts
# Access at https://your-machine.tail1234.ts.net:3000
```

---

## Building for production

```bash
# Build
pnpm build

# Preview the build locally
pnpm serve
```

The output is in the `dist/` folder — static files you can deploy anywhere.

### Testing with Docker

Test your production build in Docker:

```bash
pnpm build
pnpm docker:dev
```

This runs nginx with your local `dist/` folder mounted.

---

## Documentation

The docs site (what you're reading now) is built with VitePress:

```bash
pnpm docs:dev      # Start docs dev server
pnpm docs:build    # Build docs
pnpm docs:preview  # Preview built docs
```

---

## Feedback

Found a bug or have a feature request? [Open an issue on GitHub](https://github.com/hyaway/hyaway/issues).

---

## Troubleshooting

### Port 3000 already in use

Either stop the other process or use a different port:

```bash
pnpm dev -- --port 3001
```

### Hydrus connection issues

- Ensure Hydrus is running with the Client API enabled
- Check that CORS is enabled in Hydrus
- Verify the endpoint URL and port

### TypeScript errors

```bash
pnpm typecheck
```

Fix any errors before committing.

### Stale dependencies

```bash
# Clear and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

---

## Next steps

- [Docker deployment](./docker) — Deploy your customized build
- [Connect to Hydrus](../connect) — Full connection guide
