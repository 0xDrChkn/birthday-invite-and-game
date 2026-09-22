# Local invitation service

Node 24 or newer; no npm install and no Supabase. The service uses Node's built-in SQLite, HTTP, crypto, and multipart parser.

`node local-server/server.mjs` listens at `http://127.0.0.1:49200/`. Environment variables: `DATA_DIR` (default `~/Library/Application Support/Saras30/data`), `PORT` (default `49200`), `HOST` (default `127.0.0.1`). Keep it bound to loopback when putting a HTTPS tunnel in front of it.

The private `DATA_DIR/config.json` must contain:

```json
{
  "eventId": "sara-30-2026",
  "adminEmail": "owner@localhost.invalid",
  "adminPasswordHash": "128 hex characters, scrypt(password, salt, 64)",
  "salt": "at least 32 random hex characters",
  "signingSecret": "at least 64 random hex characters",
  "allowedOrigins": ["https://0xdrchkn.github.io"]
}
```

Use the setup script to generate this file rather than filling in the illustrative values. The module exports asynchronous `passwordHash(password, salt)` and `createServer(options)`. The latter starts a listener and resolves to a Node HTTP server. For tests, `port: 0` chooses a free port. Close the listener and then call `server.closeStore()` before copying its data directory.

The data directory must be outside the public repository. It contains `responses.sqlite`, its SQLite journal files, private `uploads/<UUID>` files, and a `service.pid` running-process lock. Directory permissions are `0700`; database, credentials, and uploaded file permissions are `0600`. A second process cannot open the same data directory. Back up the whole private data directory while the service is stopped, including `config.json`: its signing secret is needed for retry credentials and private photo links. The installation guide documents the safe backup and restore commands.

## Browser contract

All API responses use JSON except photo bytes. Error responses are `{ "code": "invalid_name" }` with an appropriate HTTP status. Write requests require an exact allowed `Origin` header; same-service `http://localhost:<port>` and `http://127.0.0.1:<port>` are allowed automatically. Add the exact HTTPS tunnel origin before sharing it. GitHub Pages origins contain only the scheme and hostname, not a repository path. No cookies are used.

| Method / route | Request | Result |
| --- | --- | --- |
| `GET /api/health` | None | `{ok:true,service:"saras30-invitation",eventId}` |
| `POST /api/rsvp` | JSON `{eventId,name,email?,accepted,requestId?,token?}` | `{token,reply}` |
| `GET /api/guest?eventId=…` | Guest bearer token | Saved guest view |
| `POST /api/contribution` | Guest bearer token; multipart `eventId`, `story`, zero to three `photos` | Saved guest view |
| `POST /api/organiser/login` | JSON `{email,password}` | `{token,user:{email},expiresAt}` |
| `GET /api/organiser/session` | Organiser bearer token | `{email}` |
| `POST /api/organiser/logout` | Organiser bearer token | `{ok:true,service:"saras30-invitation",eventId}` |
| `GET /api/organiser/submissions?eventId=…` | Organiser bearer token | Array of guest views |
| `DELETE /api/organiser/submission?eventId=…&userId=…` | Organiser bearer token | `{ok:true,service:"saras30-invitation",eventId}` |
| `GET /api/photos/:id?token=…` | Expiring signed URL returned in a guest view | Private image bytes |

A guest view contains `userId`, `name`, `email`, `accepted`, `story`, `createdAt`, `updatedAt`, `contributedAt`, `pendingUpload:false`, and `photos:[{id,name,type,size,slot,url}]`. Photo URLs are relative to the API origin and expire after an hour. Read the guest or organiser view again to renew them. Organiser sessions expire after 12 hours. Guest edit tokens remain valid until the organiser deletes their response; losing local browser storage loses that guest's self-edit access.

First RSVP requests must include a cryptographically random 32-byte request ID encoded as 64 hex characters. Store this credential before sending. Retries return the same guest token and update the same reply, avoiding duplicates after a lost connection. Subsequent requests can use the returned token (JSON `token` or bearer). Both values are private edit credentials and must never be put in share URLs or logs. Emails are optional metadata, not authentication, and duplicate emails do not allow editing other replies.

Contribution uploads accept at most three JPEG, PNG, WebP, HEIC, or HEIF images, each at most 20 MiB. The server checks file signatures and MIME types, allows photos without a story, and caps a complete multipart body at 61 MiB. With no new photos, saved photos remain. New photos replace the previous set only after all new files have been written and the database transaction commits. Invalid or interrupted uploads preserve the old data. Deleting an entry revokes its token and removes its attachments. There is no public upload directory.

Two uploads can be processed concurrently. Limits also bound new replies, request volume, guest uploads, and organiser login attempts. IP limits intentionally ignore proxy-supplied headers, so guests behind a tunnel share the service's limits. A rejected request can be retried later. This is a small private party service, not a general-purpose public file host.

## Static serving

The service serves root HTML/JS/CSS, the favicon, and supported static assets in `assets/`, `game/`, `organiser/`, and `vendor/`. Private folders such as `tmp/`, `local-server/`, `supabase/`, `tests/`, `docs/`, dotfiles, and symlinks are rejected. `/event-config.js` automatically overrides the public config with `{provider:"local",url:""}` so the custom forms use the same origin. No private configuration is included in it.

## Verification

Run `node tests/local-server.cjs`. It creates isolated temporary storage and tests real HTTP requests, ten guests, uploads/download bytes, token isolation, idempotent RSVP retries, a real filesystem failure, database restart, a cold backup restoration, deletion, and organiser login limits. It does not alter real guest data.
