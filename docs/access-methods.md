# Access methods

How to make your Hydrus Client API accessible to hyAway.

---

## Choose your access method

| Setup                                              | Best For                                                    | Difficulty       |
| -------------------------------------------------- | ----------------------------------------------------------- | ---------------- |
| [**Same Machine**](#same-machine)                  | Using hyAway on the same computer as Hydrus                 | Easy (~2 min)    |
| [**Remote Access**](#remote-access-with-tailscale) | Accessing Hydrus from your phone, laptop, or another device | Medium (~10 min) |

> **Already have remote access configured?** If you're using a reverse proxy, VPN, or another method to expose Hydrus remotely, that will work as well. Just use your existing URL when [connecting](./connect).

---

## Same machine

Use this setup if you're using hyAway on the **same computer** where Hydrus is running.

**Your endpoint URL is:** `http://127.0.0.1:45869`

That's it! Continue to [Connect to Hydrus](./connect).

---

## Remote access with Tailscale

Use this setup to access Hydrus from your phone, laptop, or any other device.

```
┌─────────────────┐     Tailscale      ┌──────────────────────┐
│  Your Phone/    │◄──── secure ──────►│  Home Computer       │
│  Laptop         │      tunnel        │                      │
│                 │                    │  ┌────────────────┐  │
│  hyaway.com ────┼────────────────────┼─►│ Hydrus :45869  │  │
│                 │                    │  └────────────────┘  │
└─────────────────┘                    └──────────────────────┘
```

[Tailscale](https://tailscale.com) creates an encrypted, private network between your devices — no port forwarding or firewall configuration needed.

### Install Tailscale

1. [Download and install Tailscale](https://tailscale.com/download) on your home computer (where Hydrus runs)
2. Install Tailscale on any devices you want to access Hydrus from (phone, laptop, etc.)
3. Sign in with the same account on all devices — this creates your **tailnet** (your private Tailscale network)

![Tailscale app showing connected devices](images/tailscale-connected-devices.png)

### Expose Hydrus via Tailscale Serve

On your home computer, open a terminal:

- **Windows:** Press `Win + X` and select **Terminal** or **PowerShell**
- **Mac:** Open **Terminal** from Applications → Utilities
- **Linux:** Open your terminal app

Run this command to start Tailscale Serve in background mode:

```bash
tailscale serve --bg --https 45869 http://127.0.0.1:45869
```

> This command means: "Proxy `http://127.0.0.1:45869` (local Hydrus) to HTTPS port 45869 on my tailnet." The `--bg` flag runs it in the background so you can close the terminal.
>
> **Want to try it temporarily first?** Run without `--bg` to test. Press `Ctrl+C` to stop when done.
>
> **To disable later:** Run `tailscale serve --https=45869 off` to stop exposing Hydrus.

If this is your first time using Tailscale Serve, it will prompt you to enable HTTPS for your tailnet.

You'll see output like:

```
Available within your tailnet:

https://my-computer.tail1234.ts.net:45869/
|-- proxy http://127.0.0.1:45869

Serve started and running in the background.
To disable the proxy, run: tailscale serve --https=45869 off
```

**Take note of your Tailscale URL** (e.g., `https://my-computer.tail1234.ts.net:45869`) — you'll need it when connecting. You can also find this in the Tailscale app by clicking on your machine name to copy it.

### Finding your Tailscale URL later

Run this command on your home computer:

```bash
tailscale status
```

Look for your machine name and domain, e.g., `my-computer.tail1234.ts.net`

---

## Next step

Once you have your endpoint URL, continue to [Connect to Hydrus](./connect).

---

## Security notes

### Why Tailscale?

Tailscale creates an encrypted, private network between your devices. When you use Tailscale Serve:

- Hydrus is **only accessible to devices on your tailnet** — not the public internet
- All traffic is **encrypted end-to-end**
- You don't need to open ports on your router or configure firewalls
- Your Hydrus instance remains "local only" — Tailscale handles the secure tunneling

### Tailscale Serve vs Funnel

- **Tailscale Serve**: Private, only accessible to your tailnet
- **Tailscale Funnel**: Public access — anyone on the internet can try to connect. Only use if you explicitly want this.

---

## Stopping Tailscale Serve

If you want to stop exposing Hydrus:

```bash
# If running in foreground: press Ctrl+C

# If running in background:
tailscale serve --https=45869 off
```

---

## Other access methods

Tailscale isn't the only option. You can also use:

- **Reverse proxy** (nginx, Caddy, Traefik) — If you already have one set up
- **VPN** (WireGuard, OpenVPN) — If you have an existing VPN to your home network
- **Port forwarding** — Not recommended due to security concerns, but works if you know what you're doing

With any of these, just use your custom URL when [connecting](./connect).

---

## Getting help

- [Tailscale Serve documentation](https://tailscale.com/kb/1312/serve)
- [Hydrus Network documentation](https://hydrusnetwork.github.io/hydrus/)
