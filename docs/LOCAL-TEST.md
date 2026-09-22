# Try the custom invitation with Mac storage

The new standalone Node service is running for this development session:

- [Custom invitation](http://127.0.0.1:49200/#party-rsvp)
- [Private organiser](http://127.0.0.1:49200/organiser/)

The organiser contains ten clearly labelled demo guests and the browser verification guest. These are fictional test records with synthetic pictures, not actual invitees.

Private QA login and data location: `tmp/local-node-qa.json` in this checkout. No credentials or submissions are committed to Git. This development instance stores data in a private temporary directory outside the repo; use the installer’s durable Application Support directory for the actual Mini.

To restart this prepared development instance from this checkout:

```sh
node tmp/start-node-qa.mjs
```

Try a name, optional email, either RSVP answer, then an optional story and up to three pictures. A success receipt appears only after the service confirms the save. Reload to restore the saved reply. In the organiser, expand a guest to read their story and download their photos; search, filter and CSV export are available.

These links work only on this Mac. They are not public invitation links. The Mini installer and external launch steps are in [MAC-MINI.md](MAC-MINI.md).

---

# Previous Docker demo (preserved)

The local preview saves real replies, stories and photos. It is separate from the public GitHub Pages website, which still needs a hosted submission service before guests can send anything.

1. Open [the test invitation](http://127.0.0.1:49175/#party-rsvp).
2. Enter a name and choose either RSVP answer.
3. Add a story and up to three photos, then send the contribution.
4. Reload the page to check that the reply, story and photos return.
5. Open [the organiser dashboard](http://127.0.0.1:49175/organiser/) and sign in using the details in `tmp/LOCAL-TEST-LOGIN.txt` on this Mac.
6. Refresh the dashboard to see the submission. Try viewing a photo, downloading it, and exporting the guest list. Use Delete only for a test reply you want to remove.

The login file is private and excluded from Git. It is not included in the preview or the public website. Guest submissions are kept in the local Docker database and storage volumes; they are not committed to the repository. Existing local data is preserved when the preview starts.

These localhost links work on this Mac only. They are for trying the flow, not for sending invitations. The preview requires Docker and the local web server to keep running. Guests will not need a Supabase account once a hosted service is connected.

## Restarting this prepared preview

Run these commands from the repository directory. The local project uses API port **57431** and database port **57432**. Do not reset the database or delete its Docker volumes if you want to keep test submissions.

```sh
npx --yes supabase@2.117.0 start --exclude realtime,imgproxy,mailpit,postgres-meta,studio,edge-runtime,logflare,vector,supavisor > tmp/supabase-start.log 2>&1
npx --yes supabase@2.117.0 status -o json > tmp/supabase-status.json
node tmp/prepare-local-preview.cjs
python3 -m http.server 49175 --bind 127.0.0.1 --directory tmp/user-preview
```

The private setup helper and credentials are intentionally local files, so these restart steps apply to this already-prepared checkout. They are not a fresh-install procedure. Stop the web server with Ctrl+C; `npx --yes supabase@2.117.0 stop` stops this local backend while preserving its data. No paid or hosted account has been created.
