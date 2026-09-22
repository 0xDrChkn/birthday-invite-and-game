# Run Sara’s invitation on the Mac mini

The custom Gatsby invitation and organiser run together in one Node.js service. Replies and stories are stored in SQLite; uploaded photos are stored alongside it on the Mini. Supabase, Docker and Tally are not required for this service.

The installer and recovery flow have been tested in isolated temporary folders on the development MacBook. They have **not been installed on the Mac mini**, and an external HTTPS endpoint has **not been configured or verified**. A successful local test does not make the GitHub Pages form public-ready.

## Start on the Mini with existing Tailscale

Use the Mac account that will stay logged in. Install **Node.js 24 or newer** from [nodejs.org](https://nodejs.org/en/download) if needed, and connect the Mini’s existing Tailscale app. Clone/open this repository on the Mini:

```sh
git clone https://github.com/0xDrChkn/saras-30th.git
cd saras-30th
./start-mac-mini.sh
```

If already cloned, open that checkout, pull the latest changes, and run the last command. Do not copy development credentials or demo data from the MacBook.

The launcher discovers this Mini’s `.ts.net` address, chooses an unused Funnel HTTPS port (443, then 8443, then 10000), and installs the service with that exact allowed origin. It reuses its own route on subsequent runs and refuses to overwrite a different web service or make another private path public. It does not reset Tailscale or change its account. You may select an available port with `--https-port 8443`.

It enables Funnel with `--bg`, so Tailscale resumes sharing after restart. Tailscale may present a browser approval link for Funnel/HTTPS. Complete that prompt on the Mini and rerun if necessary. DNS/certificate setup can take several minutes; a failed check exits visibly and can be retried with the same command. [Tailscale’s Funnel CLI documentation](https://tailscale.com/docs/reference/tailscale-cli/funnel)

After local startup, it verifies an RSVP, story, PNG upload, restored reply, organiser listing and exact photo download through HTTPS. It deletes only that disposable test record, preserving real replies. It then writes private `LINKS.txt` and `public-connection.json` beside the installation and prepares the public `hosting-config.js` in the source checkout. It never puts organiser credentials or guest data into Git. You still need a phone test with Wi-Fi and Tailscale disconnected to prove access from outside your network.

To install locally without touching Tailscale, run `./start-mac-mini.sh --local-only`. The lower-level `./local-server/install-macos.sh` is also available for customised installations. If automatic executable discovery fails, set `NODE_BIN` or `TAILSCALE_BIN` to the actual executable path.

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
  LINKS.txt            Guest, organiser and game URLs after setup
  public-connection.json  Endpoint and last HTTPS check time
```

The installer generates a strong organiser password and writes it to `data/LOGIN.txt`, without printing it to the terminal. The default login name is `host@sara.local`; it is just a login name, so an email account is not needed. The lower-level `install-macos.sh` accepts `--admin-email your-address@example.com` for an initial install. Configuration, credentials, databases and uploaded photos are never copied into the public repository or static website.

Open [the local invitation](http://127.0.0.1:49200/) and [the organiser](http://127.0.0.1:49200/organiser/) **on the Mini**. Open the private login file in Finder to sign into the organiser. The dashboard shows attending and declining guests, their stories, and downloadable photo attachments.

The service listens only on `127.0.0.1:49200`. This local address cannot be shared with guests or opened on another device to reach your Mini.

## Keep the shared invitation URL

Once the launcher’s HTTPS check passes, the direct invitation URL printed in Terminal serves the complete custom website from the Mini. The organiser is at `/organiser/` and the game is at `/game/`. Guests need no Tailscale app or account.

To keep sharing [Sara’s 30th on GitHub Pages](https://0xdrchkn.github.io/saras-30th/), run these commands in the **source checkout on the Mini** after setup:

```sh
git add hosting-config.js
git commit --only hosting-config.js -m "Connect invitation to Mac mini"
git push
```

`hosting-config.js` contains only the detected, checked public HTTPS origin. Pages uses it for submissions, while local pages continue using their same-origin API even if the tunnel is temporarily unavailable. Do not hand-copy private `data/config.json` into the repository. An unchanged generated file needs no new commit.

Open the GitHub invitation on a phone with Wi-Fi and Tailscale disconnected, submit a labelled test RSVP/story/photo, and verify the saved receipt and organiser entry. Stop/restart the service and check the response again. Test once after a real Mini reboot/login. These deployment checks cannot be replaced by the mocked Tailscale tests on the MacBook.

If you rename the Mini or change its tailnet name, rerun the launcher and push the updated `hosting-config.js` before using the Pages link again. Existing data and organiser credentials are retained.

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
./start-mac-mini.sh
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
node tests/mini-launch.mjs
```

The installation test verifies allowlisted app copies, private file permissions, credential/data preservation across an update, refusal to back up a running service, checksum rejection, restore into separate storage, restored guest-token access, organiser login and exact photo download bytes. This is local implementation and recovery evidence; the target Mini, persistent tunnel and public-browser checks remain deployment work.

To repeat the disposable HTTPS submission check after setup:

```sh
node local-server/verify-live.mjs
```

The launch test uses simulated Tailscale command results plus a real isolated HTTP service. It checks conflicting/private routes, configuration preservation, local-only mode, failure reporting, public configuration generation and cleanup of the disposable submission. It never enables Funnel on the development MacBook.
