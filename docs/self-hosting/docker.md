# Deploy with Docker

Run hyAway in a Docker container with nginx. This is the recommended method for self-hosting.

---

## TL;DR

::: tip Prerequisite
Make sure Docker is running first (on Windows/macOS, start Docker Desktop).
:::

- Start: `docker compose -f docker/docker-compose.yml up -d --build` (then open http://localhost:4929)
- Remote access with Tailscale, no port in URL: `tailscale serve --bg 4929` (example: `https://your-machine.tail1234.ts.net`)
- Remote access with Tailscale, keep port in URL: `tailscale serve --bg --https 4929 http://127.0.0.1:4929` (example: `https://your-machine.tail1234.ts.net:4929`)

## Quick start

```bash
# Clone the repository
git clone https://github.com/hyaway/hyaway.git
cd hyaway

# Start the container
docker compose -f docker/docker-compose.yml up -d --build
```

hyAway will be available at **http://localhost:4929**

---

## Available commands

> Note: The `pnpm docker*` scripts are developer conveniences. For self-hosting you only need Docker.

| Command              | Description                               |
| -------------------- | ----------------------------------------- |
| `pnpm docker`        | Start container in background             |
| `pnpm docker:attach` | Start with logs attached (Ctrl+C to stop) |
| `pnpm docker:stop`   | Stop the container                        |
| `pnpm docker:logs`   | View container logs                       |

Or use docker compose directly:

```bash
# Start
docker compose -f docker/docker-compose.yml up -d --build

# Stop
docker compose -f docker/docker-compose.yml down

# View logs
docker compose -f docker/docker-compose.yml logs -f
```

---

## Configuration

### Custom port

Edit `docker/docker-compose.yml`:

```yaml
ports:
  - "8080:80" # Change 4929 to your preferred port
```

### Public URL (optional)

If you're hosting hyAway on a public domain, set `VITE_APP_URL` so OG tags and canonical URLs are correct.

The Docker Compose setup forwards `VITE_APP_URL` into the image build automatically if it's present in your environment.

Recommended: create a local env file (so you don't edit tracked files):

```bash
# .env.local
VITE_APP_URL=https://your-domain.com

# Rebuild using that env file
docker compose --env-file .env.local -f docker/docker-compose.yml up -d --build
```

For private/localhost instances, leave this commented out — the app works fine without it.

### Danger zone: Preset Hydrus credentials

You can preset the Hydrus API endpoint and access key at build time. This allows users to skip the connection setup entirely.

::: danger Security warning
These values are **embedded in the built JavaScript bundle** and exposed to **ALL users** who access your hyAway instance. Anyone can view the access key by opening browser developer tools.

Only use this for trusted private deployments where:

- All users are trusted and should have identical Hydrus access
- The instance is not publicly accessible, or access is controlled by other means (VPN, authentication proxy, etc.)
- You understand that the access key grants full API access per its configured permissions
  :::

Recommended: set these via an env file and rebuild:

```bash
# .env.local
VITE_HYDRUS_ENDPOINT=http://127.0.0.1:45869
VITE_HYDRUS_ACCESS_KEY=your-64-character-access-key-here

# Rebuild using that env file
docker compose --env-file .env.local -f docker/docker-compose.yml up -d --build
```

Or with the Docker CLI directly:

::: code-group

```bash [One line]
docker build -f docker/Dockerfile --build-arg VITE_HYDRUS_ENDPOINT=http://127.0.0.1:45869 --build-arg VITE_HYDRUS_ACCESS_KEY=your-64-character-access-key-here -t hyaway .
```

```bash [Multi-line (bash/zsh)]
docker build \
  -f docker/Dockerfile \
  --build-arg VITE_HYDRUS_ENDPOINT=http://127.0.0.1:45869 \
  --build-arg VITE_HYDRUS_ACCESS_KEY=your-64-character-access-key-here \
  -t hyaway \
  .
```

```powershell [Multi-line (PowerShell)]
docker build `
  -f docker/Dockerfile `
  --build-arg VITE_HYDRUS_ENDPOINT=http://127.0.0.1:45869 `
  --build-arg VITE_HYDRUS_ACCESS_KEY=your-64-character-access-key-here `
  -t hyaway `
  .
```

:::

Then run it (silent / runs in the background):

```bash
docker run -d --name hyaway-standalone --restart unless-stopped -p 4929:80 hyaway
```

Open **http://localhost:4929**.

Note: if you started hyAway with Docker Compose, Docker Desktop may show a container name like `hyaway-1` (or `something-hyaway-1`). That's normal — Compose generates container names from the project + service name.

If you see a “name is already in use” error, either stop/remove the existing container, or pick a different `--name`.

If you want to run it in the foreground (shows nginx logs in your terminal):

```bash
docker run --rm -p 4929:80 hyaway
```

Stop/remove it later:

```bash
docker stop hyaway-standalone
docker rm hyaway-standalone
```

View logs:

```bash
docker logs -f hyaway-standalone
```

When credentials are preset:

- The connection settings are pre-filled on first visit
- Users see "Preconfigured value" next to the fields
- Users can still change the values if needed (changes are stored in their browser)

If a user has already configured hyAway before (their endpoint/key are already persisted in the browser), the presets will not overwrite those values. They can go to **Settings → Connection** and click **Reset API settings** to clear the stored values.

---

## Expose via Tailscale

You can use Tailscale Serve to access your self-hosted hyAway from other devices:

```bash
# Recommended: no port in the URL (matches `pnpm docker:ts`)
tailscale serve --bg 4929
```

Then access it at `https://your-machine.tail1234.ts.net` from any device on your tailnet.

If you prefer keeping the port in the URL:

```bash
tailscale serve --bg --https 4929 http://127.0.0.1:4929
```

Then access it at `https://your-machine.tail1234.ts.net:4929`.

The npm scripts also support this:

```bash
pnpm docker:ts      # Start Tailscale Serve for Docker port (no-port URL)
pnpm docker:ts:off  # Stop Tailscale Serve
pnpm ts:status      # Check Tailscale Serve status
```

---

## Production considerations

The default `docker-compose.yml` includes security hardening suitable for production:

### Security features

- **Read-only filesystem** — Container cannot write to disk
- **Dropped capabilities** — Minimal Linux capabilities
- **Security headers** — CSP, X-Frame-Options, etc. configured in nginx
- **No root process** — nginx runs as unprivileged user

### Resource limits

```yaml
deploy:
  resources:
    limits:
      memory: 128M
      cpus: "0.5"
    reservations:
      memory: 32M
```

Adjust these based on your server capacity.

### Log rotation

Logs are automatically rotated to prevent disk fill:

```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

---

## Advanced: Reverse proxy setup

::: warning You know what you're doing
This section is intentionally **advanced** and these tips are only general guidance (they **haven't been tested** against every proxy setup).

If you just want secure access from other devices, prefer [Expose via Tailscale](#expose-via-tailscale).
:::

hyAway is a static web app served by nginx inside the container. In the default compose file it listens on container port `80` and is published on host port `4929`.

Important: reverse proxying hyAway does **not** proxy your Hydrus API. hyAway runs in the browser, and the browser makes API calls directly to the Hydrus Client API endpoint you configure.

If you're putting hyAway behind a reverse proxy, here are the main things to keep in mind:

- Decide whether your proxy runs **on the host** or **in Docker**.
  - Host proxy: target `127.0.0.1:4929` (the published port).
  - Docker proxy: target `hyaway:80` (container port) on a shared Docker network, and consider removing the `ports:` mapping so hyAway isn't exposed directly.
- If you're serving hyAway on a public domain, set `VITE_APP_URL` to that public URL so OG tags and canonical URLs are correct.
- Consider adding authentication at the proxy layer if the instance is exposed beyond your private network.

Official docs (start here):

- Traefik (Docker provider / routers / TLS): https://doc.traefik.io/traefik/
- Caddy (`reverse_proxy`): https://caddyserver.com/docs/caddyfile/directives/reverse_proxy
- nginx (`proxy_pass`): https://nginx.org/en/docs/http/ngx_http_proxy_module.html

---

## Development compose

For testing local builds without rebuilding the Docker image:

```bash
# Build the app first
pnpm build

# Start with the dev compose file
pnpm docker:dev
# or: docker compose -f docker/docker-compose.dev.yml up
```

This mounts your local `dist/` folder directly into the container, useful for:

- Testing production builds locally
- Quick iteration without full rebuilds
- Debugging nginx configuration

---

## Updating

To update to the latest version:

```bash
# Pull latest changes
git pull

# Rebuild and restart
pnpm docker
# or: docker compose -f docker/docker-compose.yml up -d --build
```

The Watchtower auto-update label is disabled by default to give you control over when updates happen.

---

## Dockerfile overview

The Docker build uses a multi-stage process:

1. **Build stage** — Node 20 Alpine, installs dependencies, runs `pnpm build`
2. **Production stage** — nginx Alpine, copies built files, applies security hardening

```dockerfile
# Build stage
FROM node:20-alpine AS builder
# ... installs deps and builds

# Production stage
FROM nginx:alpine
# ... copies dist and nginx config
```

---

## Troubleshooting

### Container won't start

Check logs:

```bash
pnpm docker:logs
```

Common issues:

- Port 4929 already in use — change the port in `docker-compose.yml`
- Docker not running — start Docker Desktop or the Docker daemon

### Can't connect to Hydrus

Remember: hyAway runs in your **browser**, not in the Docker container. The browser makes API calls directly to Hydrus.

- Ensure Hydrus Client API is enabled with CORS support
- Use the correct endpoint URL (e.g., `http://127.0.0.1:45869`)
- If accessing from a different machine, use Tailscale or your network IP

### Changes not showing after rebuild

Clear your browser cache, or open in incognito mode. The nginx config uses cache headers that may keep old assets cached.

---

## Next steps

- [Configure your connection](../connect) — Connect to Hydrus (same steps, just use your self-hosted URL)
- [Local development](./local-dev) — Set up a development environment
