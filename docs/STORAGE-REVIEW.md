# Submission storage checks

The invitation uses authenticated Supabase guest sessions, a private database and a private `birthday-memories` bucket. The browser receives the publishable key only. Organiser membership is assigned through administrative SQL, never through the guest client.

## Database boundary

- Guests can read and update only the response owned by their authenticated user ID. The event must be open to insert or update a response.
- Organisers can read and delete submissions for their own event. They cannot rewrite a guest's response. Membership is not self-service.
- A response's event and owner cannot change. Creation, update and contribution timestamps come from the database.
- Photo manifests have at most three distinct slots. The database rejects extra keys, paths, URLs, non-image MIME types, malformed sizes and files larger than 20 MiB.
- Uploads use only `event/user/1`, `event/user/2` and `event/user/3`. They require an existing response, an open event and `pending_upload = true`. Fixed paths prevent accumulating arbitrary filenames per guest.
- Read and delete access requires the matching owner or event organiser. Cleanup remains allowed when an event is closed. Remove stored objects before deleting their response; SQL row deletion alone does not remove stored file bytes.
- A pending replacement clears the completion timestamp. The UI must suppress the previous photo manifest while replacement is pending, since fixed slots may already contain some replacement files.

## Verification

`tests/database.sql` contains 61 assertions using two guests and one event organiser. Fixtures are synthetic and wrapped in a transaction that rolls back. It covers RLS isolation, privilege escalation, ownership changes, manifest validation, storage paths, incomplete uploads, closed events, organiser cleanup and unsigned access.

All 61 SQL assertions passed against the actual local Supabase stack. The 25 assertions in `tests/integration.cjs` also passed against actual Auth, PostgREST and Storage services, including raw API MIME/size rejection, interrupted uploads, retry, guest isolation, host permissions and deletion. Browser checks covered named RSVP, a story/photo save, reload recovery, Norwegian reply changes and host review. Form layout was checked at 390px and desktop widths. The hosted project still needs connection and a live smoke test.

## Design review before connecting guests

The main failure modes considered were public guest data, a partial upload falsely reported as complete, duplicate replies from different devices, and unavailable storage. Server policies and private objects address access; the pending-upload state and fixed slots address interrupted replacement; same-browser updates avoid routine duplicates. Cross-device identity remains a documented limitation of the simple shared-link design. Unconfigured forms disable sending, and network failures preserve the entered text.

The account owner still needs to connect a hosted project, assign their organiser account and verify the live flow. Free-project inactivity pauses and storage limits remain operational constraints; see `SUBMISSIONS.md`. The design is ready for that connection, but a successful local test is not evidence that the live website is saving submissions.

Guest authentication rate limits and any CAPTCHA are Supabase project settings. A shared invitation URL does not constitute an invitation-only account allowlist. The host view reports submitted replies, not people who have never replied; that requires a separate private guest roster.
