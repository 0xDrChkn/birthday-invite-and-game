# Birthday invite and game

A reusable Gatsby birthday website: a cinematic invitation and a playable host-controlled TV party game. Plain HTML, CSS and JavaScript, served directly by GitHub Pages. No build step. A pinned Supabase browser client handles private submissions.

**[Open the invitation](https://0xdrchkn.github.io/birthday-invite-and-game/)** · **[Play the game](https://0xdrchkn.github.io/birthday-invite-and-game/game/)**

## Current celebration

Sara Matilda Berner · 30 · 17 November 2026, 19:00 Europe/Oslo

Blomstervegen 37B, 2005 Rælingen, Norway

“Reliving your twenties” / “Tjueårene om igjen”

The invitation has English and Norwegian Bokmål, a full-castle opening that fits the complete photograph on every screen, a scroll-driven approach through its open doorway, and one Sara greeting. Four separate chapters follow: time/location, name and RSVP, evidence after replying, and the photo album. Dress code and food/drinks open in focused dialogs. The programme is a surprise and is not published. The drinks copy references Norway’s historical spirits ban; see [the source note](docs/COPY-SOURCES.md). Mobile layouts and reduced-motion preferences are supported. Each chapter fades and rises into view with scrolling. The nine selected album photographs appear across three pages. Guests can skip the entrance.

**RSVP, story/photo storage and a private organiser dashboard are implemented and tested against local Supabase. The live project is not connected yet.** Until `submissions.url` and `submissions.publishableKey` are configured, the forms clearly show that submissions are unavailable and do not report a successful save. Connect the account using [the setup guide](docs/SUBMISSIONS.md). The [organiser dashboard](https://0xdrchkn.github.io/birthday-invite-and-game/organiser/) shows replies, attendance, stories and photos, with CSV export and deletion. The [TV game](https://0xdrchkn.github.io/birthday-invite-and-game/game/) now has a playable base: 2–6 teams, 22 ready clues, two selected Sara reactions, a timer, plus/minus scoring, undo and local saving. Eight personal/mashup slots still need content. See [game usage](game/README.md), the [detailed specification and reference comparison](docs/GAME-SPEC.md), and [all 30 proposed clue briefs](docs/GAME-CATEGORIES.md).

The host is considering a simpler Tally form or direct Discord collection instead of connecting Supabase. The proposed bilingual form fields and setup are in [the guest form draft](docs/GUEST-FORM-DRAFT.md); no alternative service is connected yet.

A real local RSVP/photo test is also prepared on this Mac: [test invitation](http://127.0.0.1:49175/#party-rsvp), [organiser dashboard](http://127.0.0.1:49175/organiser/), and [local test instructions](docs/LOCAL-TEST.md). These localhost links are for testing only; they do not make the public guest form live.

## Use it for another person

1. Duplicate this repository (the GitHub “Use this template” button), or clone it into a new repository.
2. Edit **[event-config.js](event-config.js)**. Change `id`, `person`, `event`, `heroPhoto` and `photos`. The same config controls the title, date, address, directions, portraits and translated person references. There is no guest list in this file.
3. Replace the pictures in `assets/` and update their paths, captions and descriptive alt text. The photo album automatically groups any number of photos into pages of three. An empty list hides it.
4. Edit `hero` and `copy` for different party wording/themes. `{name}`, `{fullName}` and `{age}` are replaced automatically. Text is inserted as text, not HTML. `hero.headline` supports individual lines and emphasis.
5. Optionally choose `appearance.direction`: `gala` (black and gold), `speakeasy` (emerald), or `champagne` (light). Change `defaultLanguage` to `en` or `nb`.
6. Configure background music below. Enable GitHub Pages from **main / root** in the new repository’s Settings → Pages.
7. Add the new event ID to `birthday_events` in Supabase, grant an organiser access to that event, and configure the public connection settings. Each event keeps its own submissions.

The built-in mansion entrance and Gatsby copy are themed assets. For a completely different theme, update `cinema.css`, `cinema.js`, the mansion image and the translated hero/copy alongside the person settings. All web paths are relative so project URLs work.

## Background music

The visible Spotify embed has been removed to keep attention on the guest of honour. `music.js` provides an invisible HTML audio player with a small sound-on/off control, looping playback and a remembered mute preference per event. It tries autoplay, then retries after an ordinary click or Enter/Space if the browser blocks sound. Manual mute is respected.

**The chosen recording, “Young and Beautiful” by Lana Del Rey, is not included. Music is silent until an audio source is supplied.** Add an audio file you have permission to host (for example `assets/soundtrack.mp3`), then set `music.src` to that path in `event-config.js`. A direct permitted audio URL also works; a Spotify/YouTube page URL is not an audio file. No artist label, cover art or third-party player appears on the invitation. The sound button remains hidden when no source is configured.

Autoplay with sound is subject to browser rules and cannot be guaranteed on first arrival; see [MDN’s autoplay guide](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay).

## Local preview

```sh
python3 -m http.server 49174 --bind 127.0.0.1
```

Open `http://127.0.0.1:49174/`. Run syntax checks with:

```sh
node --check event-config.js
node --check script.js
node --check music.js
node --check cinema.js
node --check story.js
node --check submissions.js
node --check organiser/organiser.js
```

## Layout

- `index.html`, `style.css`, `script.js`: invitation, interactions and responsive layout.
- `event-config.js`: reusable identity, event, photos, audio and bilingual content.
- `cinema.js`, `cinema.css`: full-castle camera approach and Sara greeting.
- `story.js`, `story.css`: scroll-driven chapters and detail dialogs.
- `music.js`: optional background audio and discreet controls.
- `submissions.js`, `submissions.css`: private storage adapter and form feedback.
- `organiser/`: authenticated reply and memory dashboard.
- `backend/schema.sql`: database tables, access policies and private photo bucket.
- `tests/`, `supabase/`: isolated local Supabase verification; see the submission guide.
- `assets/`: optimized public website images; Sara’s originals are not altered.
- `game/`: playable TV game, bilingual starter question pack and Sara reaction stickers.
- `docs/`: game plan, submission setup, generated-asset notes.

These event details and published images are public on GitHub Pages; `noindex` discourages indexing but does not restrict access. Keep private guest responses, unreleased stories, private game answers and credentials out of this repository. The current game pack contains public rehearsal answers. Do not reuse Sara’s personal photos for a different birthday.
