# Game verification — 22 September 2026

Scope: `/game/`, the expanded bank, local preparation and host controls. Guest RSVP/storage is a separate feature.

## Automated checks

`node --test tests/game-engine.cjs tests/session-store.cjs tests/game-pack.cjs` — **39 tests pass** (20 engine, 13 session-store, 6 pack tests).

The suite covers:

- 2–6 teams, unique names, positive/negative scores, repeated-attempt protection, wrong→another team→correct, reveal, finish, cancel and undo after completion.
- Exactly selected category catalogs, unknown/duplicate selection rejection, selection restoration and independence from changes to unselected categories.
- Signed manual corrections, required reasons, replay, undo separately from clue awards and malformed-history rejection.
- A complete recommended 30-clue game from the real ten-category bank, completion and restore.
- JSON round-trip, private embedded media, bilingual fallback, rejected external/active image references, oversized/malformed data, duplicate IDs and invalid clue values.
- Restore rejecting changed selected clues; saved totals cannot override replayed scores.
- Stale-tab writes, storage denial, transient failures and newer-save conflict detection.

Syntax checks for changed game JavaScript and `git diff --check` also pass.

## Browser checks

Isolated local origins `http://127.0.0.1:49176/game/` and `http://127.0.0.1:49177/game/` were used so the user's earlier saved game at port 49174 was preserved. One agent checked import/export while a second independently checked scoring and setup. Viewport: 1280×720.

| Check | Observed result |
| --- | --- |
| Full bank and selection | Ten categories shown; defaults select six with 30 ready clues. Five selected disables Start. |
| Category swap | Replacing Before or After with The Impostor yields six board columns / 30 playable tiles. |
| Team and timer setup | Custom team name retained; selecting 60 seconds gives a 60-second clue timer that starts and pauses. |
| Score correction | −250 with a reason applied, survived reload and appeared in Recent corrections. Undo restored zero. |
| Wrong then correct | First team −100, another team +100; repeated award disabled. |
| Meme assignment | Wrong uses only `reaction-06.webp`; correct uses only `reaction-02.webp`. |
| Finish/reload/undo | Played tile and −100/+100 scores survive reload. Undo after finishing reopens the clue and removes only the latest +100. |
| Norwegian | Board and clue switch to Norwegian without losing the game. |
| Private import | A synthetic private question bank loads; the imported question, accepted answer and context display. |
| Bad import | Invalid JSON layout shows an error; the earlier private bank still starts successfully. |
| Private reload | Open revealed private clue, answer and context restored after reload. |
| Export | Downloaded `sara-rehearsal-v1.json` was read from Downloads: 28,632 bytes and contained the synthetic private question. The IAB download-event helper timed out, but the actual file was created correctly. |
| TV layout | Full six-column board fits in 1280×720, no page-level horizontal overflow, neutral black/gold palette. |
| Console | No browser errors/warnings in the private import/reload test tab. |

The synthetic private QA pack/files remain outside Git under ignored `tmp/game-qa/`. No real guest story or attachment was uploaded to the public game.

## Existing safeguards retained

A browser save is compared with the raw snapshot the tab last read/wrote. A newer save locks the older tab and offers reload instead of overwriting scores. The existing 13 session-store tests remain passing. A previous browser pass exercised actual stale-tab closing/reload; the new pass retained the same helper and exercised ordinary score reloads.

The timer remains manually started and pauses when the page hides. Timeout does not score. The existing timeout/reset behavior was browser-verified in the prior pass; new duration selection/start/pause was checked this pass. Reduced-motion styling and default-off reactions remain; no new system-level reduced-motion test was run.

## Remaining work and limits

- Eight personal/mashup slots still require host-confirmed content. The default selection avoids them and is fully playable.
- Private preparation uses JSON. There is no visual clue editor, image-file packaging UI, named preset list or in-progress game export.
- Imported banks and scores live in browser storage; there is no remote backup, multi-host synchronization or guest phone joining. A large import may exceed browser storage quota, which is reported visibly.
- Team renaming during play, separate choosing-team control, Double Up/other tokens, sounds, wildcards and finale video remain unimplemented.
- The actual TV and narrow mobile display still need a rehearsal. Mobile intentionally uses a horizontally scrollable board.
- Public deployment is verified separately by the root task; these results describe the exact local files, not proof of a Pages deployment.
