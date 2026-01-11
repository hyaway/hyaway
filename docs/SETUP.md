# hyAway Setup Guide

Connect [hyaway.com](https://hyaway.com) to your Hydrus Network client using Tailscale + Tailscale Serve.

---

## Overview

```
┌─────────────────┐     Tailscale      ┌──────────────────────┐
│  Your Phone/    │◄──── secure ──────►│  Home Computer       │
│  Laptop         │      tunnel        │                      │
│                 │                    │  ┌────────────────┐  │
│  hyaway.com ────┼────────────────────┼─►│ Hydrus :45869  │  │
│                 │                    │  └────────────────┘  │
└─────────────────┘                    └──────────────────────┘
```

[Tailscale](https://tailscale.com) provides private networking between your devices.

---

## Step 1: Enable the Hydrus Client API

Enable the Client API in your Hydrus client.

1. In Hydrus, go to **services → manage services**
2. Add a new **client api** service
3. Set the port to `45869` (the default)
4. Leave **allow non-local connections** unchecked (recommended)
5. Check **support CORS headers** (required for hyaway.com)
6. Click **Apply**

> **Why?** When you use `tailscale serve`, Tailscale proxies to `http://127.0.0.1:45869`, so Hydrus still only receives local (same-machine) API requests. Enabling **support CORS headers** lets your browser call the API from a different origin (like `https://hyaway.com`).

<!-- TODO: Screenshot of Hydrus manage services dialog with CORS enabled -->

### Verify the API is Running

Open your browser and navigate to:

```
http://127.0.0.1:45869
```

You should see a welcome page.

<!-- TODO: Screenshot of Hydrus API welcome page -->

---

## Step 2: Set Up Tailscale

1. [Download and install Tailscale](https://tailscale.com/download) on your home computer (where Hydrus runs)
2. Install Tailscale on any devices you want to access Hydrus from (phone, laptop, etc.)
3. Sign in with the same account on all devices

<!-- TODO: Screenshot of Tailscale app showing connected devices -->

---

## Step 3: Expose Hydrus via Tailscale Serve

On your home computer, open a terminal and run:

```bash
tailscale serve 45869
```

If this is your first time using Tailscale Serve, it will prompt you to enable HTTPS for your tailnet.

You'll see output like:

```
Available within your tailnet:
https://my-computer.tail1234.ts.net

|-- / proxy http://127.0.0.1:45869
```

<!-- TODO: Screenshot of tailscale serve terminal output -->

**Take note of your Tailscale URL** (e.g., `https://my-computer.tail1234.ts.net`) — you'll need it in the next step. You can also find this in the Tailscale app by clicking on your machine name to copy it.

> **Tip:** To keep Hydrus accessible without an open terminal, run in background mode:
>
> ```bash
> tailscale serve --bg 45869
> ```

---

## Step 4: Connect from hyaway.com

1. On your phone or laptop, make sure **Tailscale is connected**
2. Open [hyaway.com](https://hyaway.com)
3. Click **Get started** or go to **Settings → Connection**

### Set the API Endpoint

1. Enter your Tailscale URL from Step 3:
   ```
   https://my-computer.tail1234.ts.net
   ```
2. Click **Check endpoint** to verify the connection
3. You should see the Hydrus and API version numbers

<!-- TODO: Screenshot of API endpoint card with Tailscale URL -->

### Get an Access Key

#### Option A: Request a New Key (Recommended)

1. In Hydrus, go to **services → review services → local → client api**
2. Click **add → from api request**
3. A dialog will appear waiting for the request

<!-- TODO: Screenshot of Hydrus "waiting for request" dialog -->

4. Back in hyaway.com, click **Request new API access key**
5. Hydrus will show a permission approval dialog — review and click **Apply**

<!-- TODO: Screenshot of Hydrus permission approval dialog -->

6. hyAway will show **New API access key saved** and store the key automatically
7. Click **Check API connection** to verify the key works

> **Note:** If you see a "Complete the Hydrus permissions flow" message after checking, make sure you clicked **Apply** in the Hydrus dialog, then click **Check API connection** again.

#### Option B: Use an Existing Key

1. In Hydrus, go to **services → review services → client api**
2. Click **add → manually**
3. Give the key a name (e.g., "hyAway")
4. Select the permissions you want to grant
5. Copy the 64-character access key
6. In hyaway.com, paste the key and click **Check API connection**

### Verify Connection

Once configured, you'll see these success messages in each card:

- **Endpoint is valid!**
- **API access key is valid!**
- **Session key is valid!**

At this point, hyaway.com should be connected to your Hydrus client.

---

## Permissions Reference

hyAway requests these permissions from the Hydrus Client API:

| Permission                 | Required | Purpose                                          |
| -------------------------- | -------- | ------------------------------------------------ |
| Search for and fetch files | ✓ Yes    | Core functionality — browsing and viewing files  |
| Import and delete files    | Optional | Archive/trash file management                    |
| Manage pages               | Optional | View and interact with Hydrus pages              |
| Manage database            | Optional | Access thumbnail dimensions and namespace colors |
| Edit file times            | Optional | Sync view statistics to Hydrus                   |

You can grant all permissions or only the ones you need.

---

## Troubleshooting

### "Connection refused" or "Network error"

- **Check Hydrus is running** and the Client API is enabled
- **Verify the port** is `45869` (or matches your configuration)
- **Check the URL** — use `https://` for Tailscale URLs
- **Confirm Tailscale is connected** on both your device and home computer

### "403 Forbidden" when requesting access key

- Make sure you have the **"add → from api request"** dialog open in Hydrus
- The dialog must be open _before_ you click the request button in hyaway.com

### "419 Session Expired"

hyAway automatically refreshes expired sessions. If it persists:

- Check that your access key is still valid in Hydrus
- Try **Settings → Connection → Reset** and reconfigure

### hyaway.com can't reach Hydrus

- Confirm `tailscale serve` is running on your home computer
- Verify you're using the correct Tailscale URL (run `tailscale status` to check)
- On the home computer, confirm `http://127.0.0.1:45869` loads in a browser
- Ensure Tailscale is connected on your current device

### Finding your Tailscale URL

Run this command on your home computer:

```bash
tailscale status
```

Look for your machine name and domain, e.g., `my-computer.tail1234.ts.net`

---

## Security Notes

### Why Tailscale?

Tailscale Serve only exposes Hydrus to your **private tailnet**.

### Access Keys vs Session Keys

- **Access key**: long-lived secret (treat it like a password). In Hydrus terms, the access key _is the account_.
- **Session key**: short-lived key derived from the access key. Session keys expire, and they also reset when the Hydrus client restarts.

hyAway uses **session keys by default**, which means:

- Your access key is only used to obtain a session key when needed, rather than being sent with every API request.
- If the Hydrus client restarts (or the session expires), hyAway will request a fresh session key automatically.

hyAway stores your endpoint + keys in your browser's local storage.

### Tailscale Serve vs Funnel

- **Tailscale Serve**: Private, only accessible to your tailnet
- **Tailscale Funnel**: Valid only if you explicitly want public access. It is not private, anyone on the internet can try to connect.

---

## Stopping Tailscale Serve

To stop exposing Hydrus:

```bash
# If running in foreground: press Ctrl+C

# If running in background:
tailscale serve --bg off
```

---

## Getting Help

- [hyAway GitHub Issues](https://github.com/hyaway/hyaway/issues)
- [Hydrus Network Documentation](https://hydrusnetwork.github.io/hydrus/)
- [Hydrus Client API Docs](https://hydrusnetwork.github.io/hydrus/client_api.html)
- [Tailscale Serve Documentation](https://tailscale.com/kb/1312/serve)
