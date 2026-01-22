# Deploy with Docker

Run hyAway in a Docker container with nginx. This is the recommended method for self-hosting.

---

## TL;DR

::: tip Prerequisite
Make sure Docker is running first (on Windows/macOS, start Docker Desktop).
:::

- Start: `docker compose -f docker/docker-compose.yml up -d` (then open http://localhost:4929)
- Remote access with Tailscale, no port in URL: `tailscale serve --bg 4929` (example: `https://your-machine.tail1234.ts.net`)
- Remote access with Tailscale, keep port in URL: `tailscale serve --bg --https 4929 http://127.0.0.1:4929` (example: `https://your-machine.tail1234.ts.net:4929`)

## Quick start

**Option A: Download just the compose file** (recommended for most users)

```bash
# Download the compose file
curl -o hyaway-docker-compose.yml https://raw.githubusercontent.com/hyaway/hyaway/main/docker/docker-compose.yml

# Start the container (pulls from GitHub Container Registry)
docker compose -f hyaway-docker-compose.yml up -d
```

**Option B: Clone the repository**

```bash
git clone https://github.com/hyaway/hyaway.git
cd hyaway
docker compose -f docker/docker-compose.yml up -d
```

hyAway will be available at **http://localhost:4929**

::: tip Image tags
The default `docker-compose.yml` uses `ghcr.io/hyaway/hyaway:latest`. You can pin to a specific version:

- `ghcr.io/hyaway/hyaway:build-42` — specific build number
- `ghcr.io/hyaway/hyaway:a1b2c3d` — specific commit
  :::

---

## Available commands

```bash
# Start (pulls from GHCR)
docker compose -f docker/docker-compose.yml up -d

# Stop
docker compose -f docker/docker-compose.yml down

# Update to latest
docker compose -f docker/docker-compose.yml pull
docker compose -f docker/docker-compose.yml up -d

# View logs
docker compose -f docker/docker-compose.yml logs -f
```

---

## Configuration

### Custom port

Edit `docker-compose.yml`:

```yaml
ports:
  - "8080:80" # Change 4929 to your preferred port
```

### Need build-time configuration?

If you need to set `VITE_APP_URL` for OG tags or preset Hydrus credentials, see [Build from source](./build-from-source).

---

## Expose via Tailscale

You can use Tailscale Serve to access your self-hosted hyAway from other devices:

```bash
# Recommended: no port in the URL
tailscale serve --bg 4929
```

Then access it at `https://your-machine.tail1234.ts.net` from any device on your tailnet.

If you prefer keeping the port in the URL:

```bash
tailscale serve --bg --https 4929 http://127.0.0.1:4929
```

Then access it at `https://your-machine.tail1234.ts.net:4929`.

---

## TrueNAS Scale

For TrueNAS Scale, you can deploy hyAway using Custom App with the Docker Compose below. Copy this complete example — all settings are included.

```yaml
services:
  hyaway:
    image: ghcr.io/hyaway/hyaway:latest
    ports:
      - "4929:80"
    restart: unless-stopped
    read_only: true
    tmpfs:
      - /var/cache/nginx
      - /var/run
    cap_drop:
      - ALL
    cap_add:
      - NET_BIND_SERVICE
      - CHOWN
      - SETGID
      - SETUID
    deploy:
      resources:
        limits:
          memory: 128M
          cpus: "0.5"
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

### TrueNAS UI setup

1. Go to **Apps** → **Discover Apps** → **Custom App**
2. Give it a name (e.g., `hyaway`)
3. Paste the YAML above in the Docker Compose field
4. Deploy

### Settings reference

If you prefer using the TrueNAS UI fields instead of YAML:

| Setting        | Value                            |
| -------------- | -------------------------------- |
| Image          | `ghcr.io/hyaway/hyaway:latest`   |
| Port           | `4929` → `80` (host → container) |
| Restart Policy | Unless Stopped                   |
| Read Only      | Yes                              |
| Memory Limit   | 128 MB                           |
| CPU Limit      | 0.5                              |

**Security settings** (under Security Context or similar):

- Drop all capabilities, then add: `NET_BIND_SERVICE`, `CHOWN`, `SETGID`, `SETUID`
- tmpfs mounts: `/var/cache/nginx`, `/var/run`

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
- If you're serving hyAway on a public domain, you'll need to [build from source](./build-from-source) with `VITE_APP_URL` set.
- Consider adding authentication at the proxy layer if the instance is exposed beyond your private network.

Official docs (start here):

- Traefik (Docker provider / routers / TLS): https://doc.traefik.io/traefik/
- Caddy (`reverse_proxy`): https://caddyserver.com/docs/caddyfile/directives/reverse_proxy
- nginx (`proxy_pass`): https://nginx.org/en/docs/http/ngx_http_proxy_module.html

---

## Updating

To update to the latest version:

```bash
# Pull the latest image and restart
docker compose -f docker/docker-compose.yml pull
docker compose -f docker/docker-compose.yml up -d
```

The Watchtower auto-update label is disabled by default to give you control over when updates happen.

---

## Troubleshooting

### Container won't start

Check logs:

```bash
docker compose -f docker/docker-compose.yml logs -f
```

Common issues:

- Port 4929 already in use — change the port in `docker-compose.yml`
- Docker not running — start Docker Desktop or the Docker daemon

### Can't connect to Hydrus

Remember: hyAway runs in your **browser**, not in the Docker container. The browser makes API calls directly to Hydrus.

- Ensure Hydrus Client API is enabled with CORS support
- Use the correct endpoint URL (e.g., `http://127.0.0.1:45869`)
- If accessing from a different machine, use Tailscale or your network IP

### Changes not showing after update

Clear your browser cache, or open in incognito mode. The nginx config uses cache headers that may keep old assets cached.

---

## Next steps

- [Configure your connection](../connect) — Connect to Hydrus (same steps, just use your self-hosted URL)
- [Build from source](./build-from-source) — For preset credentials or custom builds
- [Local development](./local-dev) — Set up a development environment
