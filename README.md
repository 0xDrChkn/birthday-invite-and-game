# Birthday invite and game

A reusable Gatsby birthday website: a cinematic invitation now, a host-controlled TV party game later. Plain HTML, CSS and JavaScript, served directly by GitHub Pages. No build step or runtime dependencies.

**[Open the invitation](https://0xdrchkn.github.io/birthday-invite-and-game/)** · **[Game landing page](https://0xdrchkn.github.io/birthday-invite-and-game/game/)**

## Current celebration

Sara Matilda Berner · 30 · 17 November 2026, 19:00 Europe/Oslo

Blomstervegen 37B, 2005 Rælingen, Norway

“Reliving your twenties” / “Tjueårene om igjen”

The invitation has English and Norwegian Bokmål, a full-castle opening that fits the complete photograph on every screen, a scroll-driven approach through its open doorway, and one Sara greeting. Four separate chapters follow: time/location, name and RSVP, evidence after replying, and the photo album. Dress code, food/drinks and the proposed programme open in focused dialogs. Mobile layouts and reduced-motion preferences are supported. Each chapter fades and rises into view with scrolling. The original first three album photographs lead; the two table-tennis photographs come last. Guests can skip the entrance.

**RSVP and story/photo submissions are local previews only. Nothing is sent or saved.** The TV game is planned, not playable yet. These are explicitly deferred features; see [the game plan](docs/GAME-PLAN.md) and [submission plan](docs/SUBMISSIONS.md).

## Use it for another person

1. Duplicate this repository (the GitHub “Use this template” button), or clone it into a new repository.
2. Edit **[event-config.js](event-config.js)**. Change `id`, `person`, `event`, `heroPhoto` and `photos`. The same config controls the title, date, address, directions, portraits and translated person references. There is no guest list in this file.
3. Replace the pictures in `assets/` and update their paths, captions and descriptive alt text. The photo album automatically groups any number of photos into pages of three. An empty list hides it.
4. Edit `hero` and `copy` for different party wording/themes. `{name}`, `{fullName}` and `{age}` are replaced automatically. Text is inserted as text, not HTML. `hero.headline` supports individual lines and emphasis.
5. Optionally choose `appearance.direction`: `gala` (black and gold), `speakeasy` (emerald), or `champagne` (light). Change `defaultLanguage` to `en` or `nb`.
6. Configure background music below. Enable GitHub Pages from **main / root** in the new repository’s Settings → Pages.

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
```

## Layout

- `index.html`, `style.css`, `script.js`: invitation, interactions and responsive layout.
- `event-config.js`: reusable identity, event, photos, audio and bilingual content.
- `cinema.js`, `cinema.css`: full-castle camera approach and Sara greeting.
- `story.js`, `story.css`: scroll-driven chapters and detail dialogs.
- `music.js`: optional background audio and discreet controls.
- `assets/`: optimized public website images; Sara’s originals are not altered.
- `game/`: honest placeholder for the later TV game, hosted alongside the invitation.
- `docs/`: game and private submission plans, generated-asset notes.

These event details and published images are public on GitHub Pages; `noindex` discourages indexing but does not restrict access. Keep private guest responses, unreleased stories, game answers and credentials out of this repository. Do not reuse Sara’s personal photos for a different birthday.
