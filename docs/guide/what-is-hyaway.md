# What is hyAway?

hyAway is a companion web interface for browsing files from your [hydrus network](https://hydrusnetwork.github.io/hydrus/) client.

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

Your browser (running hyaway.com) makes API calls directly to your Hydrus client on your computer. Your files and data stay on your computer — hyAway just provides a different way to view them.

## Two ways to use it

Not sure which one fits your situation? Start with the [common scenarios](#common-scenarios) picker.

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

## Common scenarios

| I want to...                                        | Go here                                                                        |
| --------------------------------------------------- | ------------------------------------------------------------------------------ |
| **Use hyAway on the same computer as Hydrus**       | [Access methods →](../access-methods#same-machine)                             |
| **Use hyAway on my phone/tablet (recommended)**     | [Access methods (Tailscale) →](../access-methods#remote-access-with-tailscale) |
| **Use hyAway on my phone/tablet on the same Wi‑Fi** | [Access methods (LAN, advanced) →](../access-methods#local-network-wi-fi-lan)  |
| **Connect (endpoint + key)**                        | [Connect to Hydrus →](../connect)                                              |
| **Self-host hyAway**                                | [Self-hosting →](../self-hosting/)                                             |

## Get started

Ready to try it?

1. [Enable the Hydrus API](../getting-started) — Configure your Hydrus client
2. [Choose an access method](../access-methods) — Same machine or remote access
3. [Connect to Hydrus](../connect) — Enter your endpoint and access key

Or jump straight to [hyaway.com](https://hyaway.com) if you're on the same machine as Hydrus.

---

**[What's new?](../changelog)** — See the latest features and improvements.
