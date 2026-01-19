# Getting started

This guide walks you through enabling the Hydrus Client API so hyAway can communicate with your Hydrus client.

---

## Enable the Hydrus client API

The [Client API](https://hydrusnetwork.github.io/hydrus/client_api.html) lets external apps like hyAway communicate with Hydrus.

1. In Hydrus, go to **services → manage services**
2. Look for an existing **client api** service, or click **add → client api** to create one
3. Set the port to `45869` (Hydrus default)
4. Leave **allow non-local connections** unchecked (recommended). Only enable it if you plan to connect from another device on your Wi‑Fi/LAN without Tailscale.
5. Check **support CORS headers** (required for connecting between hyaway.com and your own domain)
6. Click **Apply**

> **Why CORS?** When you visit hyaway.com, your browser runs code from that website. By default, browsers don't let websites talk to other servers (like your local Hydrus) — this is a security feature. Enabling CORS tells Hydrus "it's okay for hyaway.com to connect to me."

![Hydrus manage services dialog with CORS enabled](images/hydrus-cors-settings.png)

### Verify the API is running

Open your browser and navigate to:

```
http://127.0.0.1:45869
```

You should see a welcome page.

![Hydrus API welcome page](images/hydrus-api-welcome.png)

---

## Next step: Choose your setup

| I want to...                                          | Recommended path                                                                                                                                                                                                         |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Use hyAway on this computer**                       | Use the [Same machine →](./access-methods#same-machine)                                                                                                                                                                  |
| **Use hyAway on my phone/tablet on the same Wi‑Fi**   | Use **Tailscale** (recommended, works at home too): [Remote access with Tailscale →](./access-methods#remote-access-with-tailscale) (or **LAN (advanced)**: [Local network →](./access-methods#local-network-wi-fi-lan)) |
| **Use hyAway remotely (phone/tablet away from home)** | Use **Tailscale** (recommended): [Remote access with Tailscale →](./access-methods#remote-access-with-tailscale)                                                                                                         |
| **Run your own hyAway instance**                      | [Self-hosting →](./self-hosting/)                                                                                                                                                                                        |

---

## Learn more about Hydrus

- [hydrus network Documentation](https://hydrusnetwork.github.io/hydrus/) — Official docs
- [Client API reference](https://hydrusnetwork.github.io/hydrus/client_api.html) — API endpoints and parameters
