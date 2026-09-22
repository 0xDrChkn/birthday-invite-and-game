# Mac hosting review — 22 September 2026

The proposal keeps the custom invitation and organiser and stores replies, stories and photographs in a small service on the owner's always-on Mac mini.

## Devil's Advocate Review

**Steelman:** One always-on machine and one local database remove cloud database setup while preserving the already-designed guest experience. GitHub Pages can continue serving the public invitation, with the Mac handling private submissions through an HTTPS tunnel.

**Category:** C, S

### [MAJOR] 1. The current computer is not the target host
- **Failure mode:** A service works on the developer's laptop, then stops when that laptop sleeps; guests are told they are using the Mac mini.
- **Location/evidence:** `scutil --get ComputerName` returned “Sven’s MacBook Pro”; `sysctl -n hw.model` returned `Mac16,7`. The Mac mini's address is not yet supplied.
- **Fragile assumption:** A successful local test proves availability on the target machine.
- **Falsifier:** Start the service on the actual Mini and complete an external submission while the laptop service is stopped.
- **Mitigation:** Prepare a portable installer; distinguish laptop tests from deployed Mini verification. Do not activate the public connection until the real endpoint is tested.

### [MAJOR] 2. Private data must not become static website files
- **Failure mode:** A tunnel exposes the repository root including saved photos, credentials or local test files.
- **Location/evidence:** Existing `tmp/` contains local test configuration and credentials; the public frontend previously depended on database row/storage policies. The proposed replacement requires its own boundary.
- **Fragile assumption:** An obscure URL or CORS makes an upload private.
- **Falsifier:** Unauthenticated requests cannot enumerate replies, fetch private files or retrieve server configuration; separate guest tokens cannot read each other's data.
- **Mitigation:** Keep data outside the checkout, serve an explicit public file allowlist, require organiser authentication and guest edit tokens, issue expiring photo links, and test the HTTP boundary before opening a tunnel.

### [MAJOR] 3. A saved receipt must survive restart and incomplete uploads
- **Failure mode:** The UI reports success before photo storage finishes; a restart leaves a response with broken attachments. A machine failure then destroys the only copy.
- **Location/evidence:** The existing `submissions.js` has explicit interrupted-upload handling; replacement behaviour must preserve that guarantee. The new service's persistence is not yet verified at this review point.
- **Fragile assumption:** Writing a JSON response is the same as durable storage.
- **Falsifier:** Upload, restart, authenticate again, restore the reply, download identical bytes, and restore a backup into an isolated data directory.
- **Mitigation:** SQLite transactions plus staged file writes; send success only after commit; keep existing files if replacement fails; provide a consistent backup command and an exercised restore procedure. Configure automatic restart and document that a user LaunchAgent needs a login after reboot.

**Premortem:** The proposal failed. After an update, the Mini restarted and nobody logged in. The process never started, and the public invitation quietly stopped accepting replies. The first visible signal was a guest's error screenshot. The host also discovered the only photo copy was on that machine. This scenario makes restart verification and a copied backup part of deployment, not optional polish.

**Alternatives the proposal didn't consider:**
1. A hosted form backend preserves custom inputs and avoids machine uptime responsibility, but adds a provider account and storage limits.
2. The existing local Docker stack preserves its verified storage policies, but adds several services and desktop startup requirements.

**What survives scrutiny:** Keeping the current design; local storage outside the website; one stable public invitation URL; a separately authenticated organiser. Watch endpoint availability most closely.

**Verdict:** PROCEED_WITH_NOTED_RISKS for local implementation and testing; public launch depends on target-host and HTTPS endpoint verification.

**Single next step:** Build and test the local service, then install it on the actual Mac mini once its connection details are available.
