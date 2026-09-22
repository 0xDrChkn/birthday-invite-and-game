# Run Sara’s invitation on the Mac mini

The custom Gatsby invitation and organiser run together in one Node.js service. Replies and stories are stored in SQLite; uploaded photos are stored alongside it on the Mini. Supabase, Docker and Tally are not required for this service.

The installer and recovery flow have been tested in isolated temporary folders on the development MacBook. They have **not been installed on the Mac mini**, and an external HTTPS endpoint has **not been configured or verified**. A successful local test does not make the GitHub Pages form public-ready.

## Install on the Mini

Use the Mac account that will stay logged in. Install **Node.js 24 or newer** from [nodejs.org](https://nodejs.org/en/download) if needed. Copy or clone the current repository to the Mini, open Terminal in that folder, then run:

```sh
./local-server/install-macos.sh
```

No `sudo` is required. The script copies only the website assets and server helpers into:

```text
~/Library/Application Support/Saras30/
  app/                 Installed website and service
  data/
    config.json        Private server configuration and password hash
    LOGIN.txt          Private organiser login
    responses.sqlite   Replies, stories and photo metadata
    uploads/           Original uploaded photos
  logs/                Service logs
  installation.json    Runtime and installation paths
```

The installer generates a strong organiser password and writes it to `data/LOGIN.txt`, without printing it to the terminal. The default login name is `host@sara.local`; it is just a login name, so an email account is not needed. An initial install can use `--admin-email your-address@example.com` instead. Configuration, credentials, databases and uploaded photos are never copied into the public repository or static website.

Open [the local invitation](http://127.0.0.1:49200/) and [the organiser](http://127.0.0.1:49200/organiser/) **on the Mini**. Open the private login file in Finder to sign into the organiser. The dashboard shows attending and declining guests, their stories, and downloadable photo attachments.

The service listens only on `127.0.0.1:49200`. This local address cannot be shared with guests or opened on another device to reach your Mini.

## Keep the shared invitation URL

Continue sharing [Sara’s 30th](https://0xdrchkn.github.io/saras-30th/). Before guests can submit to the Mini, it needs a stable HTTPS tunnel pointed **only at `http://127.0.0.1:49200`**. No router port forwarding or entire home-directory file server is needed.

Choose the tunnel based on the account and domain actually available on the Mini:

- A named [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/get-started/) provides a managed public hostname. Its published application points to the local service; setup requires the relevant Cloudflare account and DNS configuration.
- [Tailscale Funnel](https://tailscale.com/docs/features/tailscale-funnel) provides a public `*.ts.net` hostname with no separate custom-domain purchase. It needs a Tailscale account, HTTPS/MagicDNS and Funnel permission. On macOS, the documented open-source app variant is required. Guests do not need Tailscale.

A temporary random tunnel URL is useful for a short external check, not for an invitation people will use over several weeks. The public tunnel carries requests; this service still stores the replies and photographs locally on the Mini. The tunnel itself also needs its provider’s persistent startup configuration.

After a real hostname is available:

1. Add that exact HTTPS origin, without a trailing slash, to `allowedOrigins` in the **private** `data/config.json` if the invitation or organiser will be opened on the tunnel hostname. `https://0xdrchkn.github.io` is already allowed.
2. Restart the local service after editing private configuration.
3. Set public `event-config.js` to `submissions: { provider: "local", url: "https://YOUR-ACTUAL-HOSTNAME" }` and deploy the GitHub Pages update. Use the real verified hostname, not that placeholder. Never copy the private configuration or password into this file.
4. On a phone with Wi-Fi disabled, open the GitHub invitation, submit a clearly marked test RSVP, story and photo, and verify all three in the organiser. Reload to test the saved receipt; download the photo to verify it.
5. Stop and restart the service and repeat the organiser check. Check startup again after an actual Mini reboot and login before treating the deployment as verified.

## Starting, stopping and checking

These commands can be run from the installed app directory:

```sh
cd "$HOME/Library/Application Support/Saras30/app"
node local-server/manage.mjs status
node local-server/manage.mjs stop
node local-server/manage.mjs start
```

`status` reports whether the LaunchAgent is loaded and whether the local HTTP endpoint responds. That health check does not prove external connectivity. `stop` unloads the agent, so it does not immediately restart while maintenance is in progress.

The LaunchAgent starts at **user login**, restarts a failed process, and does not require Terminal to stay open. It records the absolute Node executable path, so the shell’s `PATH` is not needed at startup. Keep that Node version installed; rerun the installer after moving or removing its runtime. This is a per-user LaunchAgent, so it stops on logout and cannot start before the account logs in after reboot. FileVault unlock/login after a power outage still needs attention. See [Apple’s LaunchAgent lifecycle](https://developer.apple.com/library/archive/documentation/MacOSX/Conceptual/BPSystemStartup/Chapters/CreatingLaunchdJobs.html).

Keep the Mini connected to power and the internet, and configure it to stay awake while hosting. A sleeping, logged-out, disconnected or powered-off Mini cannot accept submissions. No system sleep, login or FileVault settings are changed by this installer.

## Updates

From the updated source checkout on the Mini, rerun:

```sh
./local-server/install-macos.sh
```

The installer stages a fresh allowlisted app, stops the existing LaunchAgent if present, swaps in the app, and restarts it. Existing data, credentials and allowed origins are preserved. It refuses to overwrite an installation while a manually started server is still using its data directory. After an update, run `status` and confirm the existing replies and one photo in the organiser.

The old Docker/Supabase demonstration data is not automatically migrated. It remains separate; do not assume a fresh Mini installation contains the demo’s responses.

## Back up replies and photographs

A backup contains the database, all photos, private configuration and login file. Copy the resulting private backup folder to a separate disk; a backup kept only on the same Mini cannot protect against disk failure.

Use a **new** backup path for each run. The following example writes a dated folder to the current user’s Documents directory; use a connected backup disk instead when available:

```sh
cd "$HOME/Library/Application Support/Saras30/app"
node local-server/manage.mjs stop
node local-server/backup.mjs backup --backup "$HOME/Documents/Saras30-backup-2026-09-22"
node local-server/manage.mjs start
```

The backup helper refuses a running service, copies the database and uploads together, and verifies SHA-256 checksums. It also checks that the source did not change during the copy. Do not restart the service in another terminal until it finishes. A failed backup exits with an error; run `manage.mjs start` to resume service after resolving or recording the error.

## Restore a backup

Stop the service first, then restore the chosen backup:

```sh
cd "$HOME/Library/Application Support/Saras30/app"
node local-server/manage.mjs stop
node local-server/backup.mjs restore --backup "$HOME/Documents/Saras30-backup-2026-09-22"
node local-server/manage.mjs start
```

The helper validates every checksum before changing anything, restores into a staging folder, and preserves the existing data as a sibling `data.before-restore-…` folder for recovery. It restores the original signing secret and credentials, preserving existing guest edit tokens. Check the organiser and download a photo after restarting. Treat the backup and preserved old-data folder as private; neither belongs in Git or a public web directory.

## Verification without installation

These commands use temporary folders and real local HTTP requests. They do not install or start a LaunchAgent, expose a tunnel, or touch real guest data:

```sh
node tests/local-server.cjs
node tests/mac-installation.mjs
```

The installation test verifies allowlisted app copies, private file permissions, credential/data preservation across an update, refusal to back up a running service, checksum rejection, restore into separate storage, restored guest-token access, organiser login and exact photo download bytes. This is local implementation and recovery evidence; the target Mini, persistent tunnel and public-browser checks remain deployment work.
