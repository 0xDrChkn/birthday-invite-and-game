# Continue on the Mac mini

This repository is ready for the Mini’s existing Tailscale connection. Keep the custom black-and-gold invitation and private organiser. No Tally, Supabase or Docker setup is needed.

## Run

With Node.js 24+ available and Tailscale connected, run from this checkout:

```sh
./start-mac-mini.sh
```

This installs the service, enables persistent Tailscale Funnel for it, runs a disposable RSVP/story/photo check, and prints the public invitation, organiser and game links. If Tailscale asks you to permit Funnel/HTTPS, finish its browser prompt and rerun if necessary. Existing Tailscale web services are preserved.

The private organiser login is created on the Mini at:

```text
~/Library/Application Support/Saras30/data/LOGIN.txt
```

Replies, stories and original photos live in that private `data` directory. A new Mini installation starts empty. The old MacBook demo and its credentials are not required or copied.

## Connect the existing GitHub Pages link

After the command succeeds, it has prepared `hosting-config.js` with the Mini’s public URL. From this checkout:

```sh
git add hosting-config.js
git commit --only hosting-config.js -m "Connect invitation to Mac mini"
git push
```

The usual share link stays https://0xdrchkn.github.io/saras-30th/. The direct Tailscale invitation link also works without this Pages update.

Before sending invites, test on a phone with Wi-Fi and Tailscale disconnected. Check the saved RSVP/story/photo in the organiser, restart the service, and confirm they remain. Test after a Mini reboot and login too.

## State of the project

- Local storage, uploads, privacy boundaries, success receipt, organiser, CSV export and backup/restore are tested.
- The launcher’s Tailscale behaviour is tested using simulated CLI responses; actual Mini startup and public access still need the checks above.
- The game has ten categories, 42 playable clues and a complete recommended 30-question board. Eight personal/mashup slots remain drafts.
- “Young and Beautiful” is not included. Background music needs a permitted audio file configured in `event-config.js`; it is independent of submission setup.
- Keep the Mini awake, connected and logged in. The LaunchAgent starts at user login.

[Detailed installation, troubleshooting, updates and backups](docs/MAC-MINI.md)
