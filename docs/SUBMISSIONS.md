# RSVP, stories and photographs

## Deployment status

Implemented and verified against an isolated local Supabase stack. **No hosted Supabase account is connected yet.** Production settings in `event-config.js` remain empty; guests cannot send until setup is complete. Never treat a local test as a live guest response.

## Guest and host flow

Send everyone the same invitation URL. Guests enter a name and choose either RSVP answer. A successful save unlocks the optional story form, with up to three photos (20 MiB each). Success is shown only after the server acknowledges the save. The form supports English and Norwegian Bokmål, upload progress, validation and retry without clearing entered text.

After a completed contribution, the form becomes a confirmation receipt showing the guest’s RSVP, received story and photo count, plus compact saved thumbnails. “Edit story or photos” reopens the saved values; “Cancel changes” discards unsent edits. A failed save keeps the retry form open instead of showing a success receipt. The receipt also returns when the guest revisits with the same browser session.

Supabase creates an anonymous authenticated session for each browser. Revisiting in the same browser restores the reply, story and saved photos. Changing the RSVP updates that row. Another device, private browsing or clearing browser data creates a different identity and can produce a second reply; the host can remove duplicates. This is a simple shared invitation, not a private guest allowlist. The dashboard counts submitted replies; a list of people who have not replied needs a separate guest roster.

The private `/organiser/` page has email/password sign-in, attending/declined totals, name/story search, reply filters, story/photo review, signed downloads, CSV export and confirmed deletion. It does not expose guest information to other guests. Organiser membership is checked by database policy, not a browser setting. Photos open with one-hour signed links; use Refresh to renew expired links. HEIC originals can be downloaded even when the browser cannot preview them.

Newly selected photos replace the previous set. Submitting text without new files keeps the old photos. Uploads use three fixed slots; a failed replacement is marked incomplete, its text is preserved, and stale photo previews are hidden. Reselect photos after a page reload to finish an interrupted upload. The host can remove an unwanted submission and its files from the dashboard.

## Connect a hosted project

1. Use a personal Supabase project. In its SQL editor, run all of `backend/schema.sql`. Re-running it preserves responses. It creates event `sara-30-2026`, response and organiser tables, a private bucket and row-level access policies.
2. Enable anonymous sign-ins in Supabase Authentication settings. Keep the project's authentication rate limits enabled. For the local stack, `supabase/config.toml` already enables anonymous sign-ins.
3. Create the host's email/password account in Supabase Authentication → Users. Use the account's UUID to grant access in the SQL editor:

   ```sql
   insert into public.birthday_organisers (event_id, user_id)
   values ('sara-30-2026', 'HOST-USER-UUID')
   on conflict do nothing;
   ```

4. Put the project URL and **publishable key** (or legacy `anon` key) in `event-config.js`:

   ```js
   submissions: {
     url: 'https://YOUR-PROJECT.supabase.co',
     publishableKey: 'sb_publishable_...'
   }
   ```

   These values are public by design. Never put a service-role key, secret key, database password or host password in this repository. The adapter rejects service-role and secret keys. Keep the bucket private and retain the provided policies.

5. Publish the configuration to GitHub Pages. Submit a clearly labelled test RSVP and story/photo from the actual invitation, reload it, then sign in at `/organiser/` and verify the result. Remove the test through the dashboard. Verify a second browser cannot see those submissions before sharing invitations.

Supabase's free plan currently includes 1 GB storage and pauses inactive projects after one week. A maximum-size contribution is 60 MiB, so 1 GB is not enough for many guests at that size. Review storage usage and project availability before sending invitations and again before the party; no paid plan or recurring keep-alive job is configured here. [Supabase pricing](https://supabase.com/pricing)

## Reuse and cleanup

Use a new slug in `event-config.js` for another birthday and insert that ID in `birthday_events`. Grant its host a matching `birthday_organisers` row. To close submissions after a party:

```sql
update public.birthday_events set is_open = false where id = 'sara-30-2026';
```

Existing replies remain readable; edits and uploads stop. Download any memories you want to retain, then use the organiser dashboard for deletions. Directly deleting a database row does not remove photo bytes, so always remove Storage objects first. Do not commit exports or guest photos to GitHub.

## Local checks

Use Docker and the pinned CLI. The configured ports are 57431–57439 to avoid other local databases. Check they are free first. Do not point these tests at a production project.

```sh
npx --yes supabase@2.117.0 start --exclude realtime,imgproxy,mailpit,postgres-meta,studio,edge-runtime,logflare,vector,supavisor
psql postgresql://postgres:postgres@127.0.0.1:57432/postgres -v ON_ERROR_STOP=1 -f backend/schema.sql
psql postgresql://postgres:postgres@127.0.0.1:57432/postgres -v ON_ERROR_STOP=1 -f tests/database.sql
mkdir -p tmp
npx --yes supabase@2.117.0 status -o json > tmp/supabase-status.json
node tests/integration.cjs tmp/supabase-status.json
npx --yes supabase@2.117.0 stop
```

The SQL test has 61 rollback assertions. The integration test exercises actual Auth, PostgREST and Storage: RSVP updates, guest isolation, story-only and three-photo saves, interrupted replacement, retry, raw MIME/size rejection, organiser permissions, signed downloads and deletion. It uses synthetic data, cleans up its own users/files and refuses remote API URLs. `tmp/` contains local test credentials and is gitignored. For browser verification, use a separate ignored copy of `event-config.js` with local settings; never publish those settings.

Reference: [anonymous sign-ins](https://supabase.com/docs/guides/auth/auth-anonymous), [Storage access control](https://supabase.com/docs/guides/storage/security/access-control).
