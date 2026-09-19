# Game verification — 19 September 2026

Scope: the host-controlled `/game/` app, its supplied Sara reactions, saved state and comparison with the Lovable reference. This is a rehearsal game, not a finished private question bank.

## Automated checks

`node --test tests/game-engine.cjs tests/session-store.cjs` — **29 tests pass** (16 scoring-engine tests, 13 session-store tests).

Coverage includes 2–6 teams, unique names, positive/negative scoring, duplicate attempts, another team after a wrong answer, reveal, cancel, completion, undo after finishing, disabled drafts, all-clue completion, serialization, corrupt/changed-pack rejection, score recomputation, stale-tab writes and storage unavailable/error handling. A synthetic six-team, thirty-clue run completes and restores correctly; it does not pretend the eight real draft clues have been prepared.

Syntax checks passed for `game/app.js` and `game/session-store.js`; `git diff --check` passed.

## Browser verification in this pass

Test origin: `http://localhost:49174/game/`, separate from the public origin and from the guest submission preview. No public game scores or guest responses were changed. Browser viewport was 1280×720.

| Check | Observed result |
| --- | --- |
| All eight sticker preview buttons | Each loads its assigned original Sara image. Four correct and four wrong reactions confirmed. |
| Popup treatment | Computed transparent background and 0px border; screenshots show a frameless cutout and gold/red glow. |
| Animation rotation | Correct cycles float/swing/pop; wrong cycles drop/wobble/shake, without consecutive repetition for that outcome. |
| Dismissal | Continue dismisses immediately; scored overlays also close automatically. |
| Wrong answer | First team shows −100 and the wrong Sara meme; another team remains eligible. |
| Correct answer after wrong | Second team shows +100 and the correct Sara meme; answer is revealed. Repeat scoring is disabled. |
| Stale second tab | It displays “The game changed in another tab” and stops accepting game actions. |
| Close stale tab, reload active tab | Scores remain −100 / +100 / 0; revealed answer and resolved clue restore. |
| Timer expiry/reset | Countdown reaches zero without deducting points. Reset returns to 45 and clears the expired message. |
| Console | No browser errors or warnings were reported for the local test tab. |
| Finish and undo | Completion is reversed, the clue reopens, and the second team's +100 returns to 0. The earlier −100 remains. |

Earlier same-day browser verification also exercised team setup/add focus, EN/NB, picture containment, timer controls/reset, used tiles, restore and reaction on/off. The engine tests cover final winners/ties; the actual television has not been tested.

## Confirmed bug fixed

Previously, every hidden/closing tab unconditionally wrote its own in-memory game to the same localStorage key. An older second tab could erase a newer +100 score simply by closing.

The new session store remembers the raw save it loaded or last wrote. It checks before writes, before UI actions and on storage events. A different save produces a sticky conflict; the old tab pauses and offers reload instead of overwriting it. Storage access failures remain distinct and show the existing local-save warning. This protects a single-host workflow; it is not a multi-user synchronization service.

## Reference comparison limits

Visited the reference board, clue dialog and all seven editor areas: Presets, Display, Sounds, Wildcards, Jokers, Teams and Categories. Opened, paused and cancelled a clue without awarding points. No reference settings, content or uploads were changed. Token actions and finale playback were not executed, so the specification reports their visible controls rather than asserting unverified behaviour.

The [feature matrix](GAME-SPEC.md#what-the-lovable-example-actually-has) identifies missing editor/preset, team-correction, timer-setting, sound, token, intermission and finale functionality. They are a roadmap, not completed features.

## Remaining limits

- The public rehearsal pack has 22 playable clues and 8 explicit drafts. Four mashups and four personal questions require verified content.
- The recommended Party Science and visual geography upgrades are specified but not yet in the running pack.
- There is no in-app editor, private pack import/export, manual score adjustment or token system yet.
- Scores are local to one browser/device. There is no remote backup or shared team-phone session.
- Only the 1280×720 browser layout was verified in this pass; a physical TV and an actual narrow mobile viewport still need a rehearsal. Mobile has a horizontally scrollable board by design.
- Sound/video are not implemented. Reduced-motion CSS and default-off reactions are present; a system-level reduced-motion browser test was not run in this pass.
- Public RSVP/photo storage remains a separate unfinished connection. This game verification does not claim public guest submissions work.
