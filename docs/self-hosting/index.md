# Self-hosting hyAway

Run your own instance of hyAway instead of using the hosted [hyaway.com](https://hyaway.com).

---

## Why self-host?

- **Privacy** — Keep everything on your own infrastructure
- **Customization** — Modify the source code to fit your needs
- **Offline access** — No dependency on external services
- **Network isolation** — Run hyAway on the same network as Hydrus

---

## Deployment options

| Method                               | Best For                             | Difficulty |
| ------------------------------------ | ------------------------------------ | ---------- |
| [**Docker**](./docker)               | Production deployments, easy updates | Easy       |
| [**Local development**](./local-dev) | Run and customize locally            | Medium     |

---

## Quick start with Docker

The fastest way to self-host hyAway:

```bash
# Clone the repository
git clone https://github.com/hyaway/hyaway.git
cd hyaway

# Start the container
docker compose -f docker/docker-compose.yml up -d --build
```

hyAway will be available at `http://localhost:4929`

See the [Docker guide](./docker) for configuration options and production setup.

---

## Architecture

hyAway is a **static single-page application (SPA)**. It:

- Runs entirely in your browser
- Communicates directly with the [Hydrus Client API](https://hydrusnetwork.github.io/hydrus/client_api.html)
- Has no backend server — just static files served by nginx

This means you can host it with any web server: nginx, Apache, Caddy, etc.

```
┌─────────────────────────────────────────────────────────────┐
│  Your Network                                               │
│                                                             │
│  ┌─────────────┐        ┌─────────────┐                     │
│  │   Browser   │◄──────►│   hyAway    │                     │
│  │             │        │  (nginx)    │                     │
│  │             │        │  :4929      │                     │
│  └─────────────┘        └─────────────┘                     │
│         │                                                   │
│         │  API calls (from browser, not nginx)              │
│         ▼                                                   │
│  ┌─────────────┐                                            │
│  │   Hydrus    │                                            │
│  │   :45869    │                                            │
│  └─────────────┘                                            │
└─────────────────────────────────────────────────────────────┘
```

---

## Prerequisites

Before self-hosting, make sure:

1. **Hydrus Client API is enabled** — See [Getting Started](../getting-started#enable-the-hydrus-client-api)
2. **CORS is enabled** — Required for browser-to-API communication
3. **Docker is installed** (for Docker deployment) or **Node.js 20+** (for local development)

---

## Next steps

- [Deploy with Docker](./docker) — Recommended for most users
- [Local development setup](./local-dev) — Run and customize locally
