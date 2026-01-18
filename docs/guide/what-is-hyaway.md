# What is hyAway?

hyAway is a companion web interface for browsing files from your [Hydrus Network](https://hydrusnetwork.github.io/hydrus/) client.

## Why hyAway?

Hydrus is a powerful media management application, but it's pc only interface' isn't ideal for casual browsing — especially on mobile devices or when you're away from your main computer.

hyAway gives you a responsive, touch-friendly way to:

- **Review files** — Archive or delete from your inbox with swipe gestures
- **Browse your library** with a masonry gallery layout
- **View files** with support for images, video, and audio
- **Access your pages** to see what you've been working on

All without installing anything on your phone or tablet.

## How it works

hyAway is a static web app that runs entirely in your browser. It connects directly to your Hydrus client's [Client API](https://hydrusnetwork.github.io/hydrus/client_api.html) — there's no server in the middle.

```
┌─────────────────┐                    ┌──────────────────┐
│  Your Browser   │◄──── API calls ───►│  Hydrus Client   │
│  (hyaway.com)   │                    │  (your computer) │
└─────────────────┘                    └──────────────────┘
```

Your files and data stay on your computer. hyAway just provides a different way to view them.

## Two ways to use it

### Use the hosted app

The easiest way to get started. Just visit [hyaway.com](https://hyaway.com) and connect to your Hydrus client.

- No installation required
- Always up to date
- Works from any device with a browser

### Self-host your own instance

Run hyAway on your own server or home network.

- Full control over the deployment
- Works offline / on isolated networks
- Customize to your needs

See [Self-hosting](../self-hosting/) for Docker and local deployment options.

## Get started

Ready to try it?

1. [Enable the Hydrus API](./getting-started) — Configure your Hydrus client
2. [Choose an access method](./access-methods) — Same machine or remote access
3. [Connect to Hydrus](./connect) — Enter your endpoint and access key

Or jump straight to [hyaway.com](https://hyaway.com) if you're on the same machine as Hydrus.
