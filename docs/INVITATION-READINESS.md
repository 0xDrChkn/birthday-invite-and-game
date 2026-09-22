# Invitation readiness — 22 September 2026

Public invitation: https://0xdrchkn.github.io/saras-30th/

## Current route

Keep the existing Gatsby custom form and organiser. Run the Node 24/SQLite service on the always-on Mac mini and store responses and photographs there. Tally is not embedded or published; Docker and Supabase are not needed for the new service.

The implementation is working on the development MacBook. Installation on the actual Mini, its persistent HTTPS tunnel, and an external guest check remain outstanding. The public GitHub Pages form is deliberately not pointed at localhost and is not yet accepting remote submissions.

## Verified locally

- **130 HTTP checks** cover ten guests, RSVP edits, optional email, stories, photos, retry deduplication, validation, authentication, guest isolation, expired photo links, write failure recovery, restart and backup restoration.
- The installer/recovery suite checks an isolated installation, private permissions, preserved credentials/data on updates, backup refusal while running, checksum verification and restoration with exact photo bytes.
- The real custom form saved a named browser-test RSVP, email, story and three synthetic photos; reloading restored the saved receipt and attachments. The authenticated organiser displayed the same name, email, story and all three photo links. Photo-only saving and its Norwegian receipt were checked too. Both guest and host sessions restored after a service restart; a downloaded CSV contained all eleven replies with the expected email, story and photo counts.
- Ten labelled demo guests remain in the new local guest book: seven attending, three declining, ten fictional stories and twenty synthetic photos. The separate browser test adds one attending guest with three photos. No guests were contacted.
- The previous Docker/Supabase demo and its original user submission are preserved separately. They have not been migrated or deleted.

See [local demo access](LOCAL-TEST.md), [Mac mini installation](MAC-MINI.md) and [the local API](../local-server/API.md).

| Capability | Status |
| --- | --- |
| Custom black/gold invitation, EN/Norwegian, album | Published |
| Custom RSVP, story, photo save and private organiser | Verified against new local Mac service |
| Public guest submissions from GitHub Pages | Waiting for Mini installation and stable HTTPS endpoint |
| Music | Player ready; permitted recording not supplied |
| Edit an existing reply | Same browser stores a private edit token |
| Invitees who have not replied | No invite roster; organiser lists submitted replies only |
| Another device/browser | Can create a separate reply; no cross-device identity recovery |
| HEIC previews | Browser-dependent; original files downloadable |
| Backups | Manual stop/backup/start helper verified; not scheduled on Mini |
| Host startup | Installer prepared; LaunchAgent starts at user login, not before login |

## Public launch verification

Install on the Mini, configure its persistent HTTPS tunnel, and update only the public endpoint URL. Submit a labelled test from outside the home network, verify RSVP/story/photos in the organiser, then verify again after service restart and Mini reboot/login. Until those steps are observed, local success does not establish public delivery.
