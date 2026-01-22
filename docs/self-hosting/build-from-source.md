# Build from source

Build hyAway from source when you need custom build-time configuration like preset credentials or a public URL for OG tags.

::: tip Most users don't need this
If you just want to run hyAway, use the [pre-built Docker image](./docker) instead. Building from source is only needed for:

- Preset Hydrus credentials (danger zone)
- Custom `VITE_APP_URL` for public instances
- Code modifications
  :::

---

## Quick start

```bash
# Clone the repository
git clone https://github.com/hyaway/hyaway.git
cd hyaway

# Build and start
docker compose -f docker/docker-compose.build.yml up -d --build
```

hyAway will be available at **http://localhost:4929**

---

## Available commands

```bash
# Build and start
docker compose -f docker/docker-compose.build.yml up -d --build

# Stop
docker compose -f docker/docker-compose.build.yml down

# Rebuild after changes
docker compose -f docker/docker-compose.build.yml up -d --build

# View logs
docker compose -f docker/docker-compose.build.yml logs -f
```

### Developer scripts

| Command              | Description                          |
| -------------------- | ------------------------------------ |
| `pnpm docker`        | Build from source and start          |
| `pnpm docker:attach` | Build from source with logs attached |
| `pnpm docker:stop`   | Stop the container                   |
| `pnpm docker:logs`   | View container logs                  |

---

## Build-time configuration

### Public URL (VITE_APP_URL)

If you're hosting hyAway on a public domain, set `VITE_APP_URL` so OG tags and canonical URLs are correct:

```bash
# .env.local
VITE_APP_URL=https://your-domain.com

# Build with the env file
docker compose --env-file .env.local -f docker/docker-compose.build.yml up -d --build
```

For private/localhost instances, leave this unset — the app works fine without it.

### Danger zone: Preset Hydrus credentials

You can preset the Hydrus API endpoint and access key at build time. This allows users to skip the connection setup entirely.

::: danger Security warning
These values are **embedded in the built JavaScript bundle** and exposed to **ALL users** who access your hyAway instance. Anyone can view the access key by opening browser developer tools.

Only use this for trusted private deployments where:

- All users are trusted and should have identical Hydrus access
- The instance is not publicly accessible, or access is controlled by other means (VPN, authentication proxy, etc.)
- You understand that the access key grants full API access per its configured permissions
  :::

Set these via an env file:

```bash
# .env.local
VITE_HYDRUS_ENDPOINT=http://127.0.0.1:45869
VITE_HYDRUS_ACCESS_KEY=your-64-character-access-key-here

# Build with the env file
docker compose --env-file .env.local -f docker/docker-compose.build.yml up -d --build
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

Then run it:

```bash
docker run -d --name hyaway-standalone --restart unless-stopped -p 4929:80 hyaway
```

Open **http://localhost:4929**.

### Preset credential behavior

When credentials are preset:

- The connection settings are pre-filled on first visit
- Users see "Preconfigured value" next to the fields
- Users can still change the values if needed (changes are stored in their browser)

If a user has already configured hyAway before (their endpoint/key are already persisted in the browser), the presets will not overwrite those values. They can go to **Settings → Connection** and click **Reset API settings** to clear the stored values.

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

## Next steps

- [Deploy with Docker](./docker) — Use the pre-built image instead
- [Local development](./local-dev) — Set up a development environment without Docker
