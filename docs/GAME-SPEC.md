# Sara's birthday game — specification and reference comparison

Updated 22 September 2026. The host plays from one laptop connected to a TV. Teams answer aloud; the host operates the mouse, timer and scores. No phone joining or game backend is needed.

## Current game

Keep the neutral black, warm gold and ivory Art Deco presentation. The public bank now has **10 categories / 50 slots / 42 playable clues**. Setup selects **six categories** so the TV board remains six columns wide. The recommended selection has **30 fully playable clues**:

| Default category | Format |
| --- | --- |
| Famous Saras | Celebrity and fictional Sara/Sarah clues. |
| What's That Country? | Five country silhouettes; the hardest also asks for its capital. |
| The Roaring Twenties | Gatsby, dance, Prohibition vocabulary and historical chronology. |
| Bad Movie Plots | Identify a film from an unhelpful description. |
| Name That Tune | Identify a song from text clues; no audio playback required. |
| Before or After? | Compare two cultural or historical events. |

Alternatives: **Hold My Drink** (party science), **The Impostor** (odd one out), **The Birthday Girl** (celebrity mashups) and **The Sara Archives** (personal clues). The two personal columns each have one ready clue and four disabled drafts. The host must supply four verified mashups and four personal questions. See [GAME-CATEGORIES.md](GAME-CATEGORIES.md) for formats and [GAME-CONTENT.md](GAME-CONTENT.md) for sources.

Implemented host controls:

- 2–6 unique team names; stable team IDs; answering-team selection.
- Exactly six categories selected before starting, with ready/draft counts and a recommended preset.
- 100–500 clues; text or picture; correct/incorrect decisions; negative scores; one attempt per team per clue; another team after a miss.
- Manual answer reveal, automatic reveal after a correct decision, reveal-only answer image/accepted variants/context when provided.
- Finish a clue or return without finishing; repeatable undo after scoring or completion.
- **Adjust scores**: signed integer correction, required reason, recent correction log and the same undo history. This does not create a clue attempt.
- Timer duration of 15, 30, 45, 60, 90 or 120 seconds. Manual start, pause/resume and reset. Timeout never deducts points.
- EN/NB, fullscreen with fallback, final winning team(s), local restoration of the selected board, imported bank, scores, current clue and paused timer.
- Private JSON bank import/export at setup. Invalid imports leave the previous bank intact.
- Stale-tab protection: another tab's newer save pauses the older tab and requires reload.

The host still manages choosing order and steals. Revealing an answer does not lock adjudication, so the host can judge an answer already spoken. There is no automatic shouting-speed detector, phone buzzer or token system.

## Sara reactions

Only the two selected images are used:

| Result | Source | Game asset |
| --- | --- | --- |
| Correct | Pink-sweater pose (`sticker5.webp`) | `reaction-02.webp` |
| Wrong | Sceptical face (`sticker3.webp`) | `reaction-06.webp` |

They appear as frameless cutouts with a warm gold correct glow or muted red wrong glow. Each outcome rotates among three CSS entrance effects; the image itself stays fixed. A result displays the team and signed points and closes after 2.6 seconds or Continue/Escape. Scoring commits before the effect. Reactions are optional and default off for reduced-motion users. There is no sound playback yet.

## Private preparation and reuse

The public pack is a rehearsal bank: its answers are visible in public source code. Do not commit private guest stories, photos or secret final questions to this repository.

Setup's **Prepare a private question pack** lets the host download JSON, edit it locally and import it again. The imported bank stays in browser storage and exported local files; nothing is sent to a server. A game must be reset before replacing its bank. The two fixed Sara reactions remain regardless of import contents.

Import constraints: 6–12 categories with unique IDs; five uniquely identified clues per category with values 100–500 in order; six valid default category IDs; up to 2 MB total. Text may be a string or `{en, nb}`; either supplied language fills an absent translation. Required question/answer fields must be present unless an answer is explicitly a draft. Supported optional fields are `image`, `imageAlt`, `answerImage`, `acceptedAnswers`, `explanation`, `hostNote` and reserved `hint`.

Private media is embedded PNG/JPEG/WebP data URLs. Already bundled picture paths are allowed, including trusted country SVGs. Arbitrary external URLs, local filesystem paths and uploaded SVGs are rejected. Imported strings render as text. The file is validated before it replaces the previous bank; malformed data cannot silently replace a working selection.

This is a JSON preparation path, not yet a visual clue editor. Keep the JSON backup outside the browser. Scores and private banks are local to one browser/device; there is no cloud sync or game-session export. Clearing browser storage loses that local copy. Changing selected clue content invalidates an older game; changes to unselected categories do not.

## What the Lovable example has, and our integration

The [Bright Play Show reference](https://bright-play-show.lovable.app/) and its admin editor were inspected on 19 and 22 September 2026. The reviewer opened/cancelled a clue and inspected Presets, Display, Sounds, Wildcards, Jokers, Teams and Categories without saving settings, answers or scores. Token and finale semantics were observed as controls, not executed end to end.

| Observed reference feature | Sara game now | Next decision |
| --- | --- | --- |
| Category editor: text, picture, answers, upload/URL, add/reorder | Ten-category bank; choose six; private JSON import/export | Add a visual preparation editor with local media packaging. |
| Named presets with teams/settings/content | Recommended six and replaceable private JSON bank | Save named local presets; add whole-game backup if useful. |
| Editable teams, host turn selector, standalone ±100 | Setup names, answering team, arbitrary signed score correction with reason/undo | Team rename and separate choosing-team state remain missing. |
| Configurable timer; auto-start; multiple timer styles | 15–120 seconds; manual start/pause/reset | Keep manual start by default; extra styles are unnecessary. |
| Correct/wrong image and rotating entrance effects | Requested two fixed memes, frameless, six entrance effects total | Optional effect size preference later. |
| Correct/wrong sound pools and time-up clips | Silent | Optional local permitted clips, mute/volume and media-failure fallback. |
| DOUBLE UP, FIRST LETTER and STEAL tokens | None | Define exact scoring/undo rules before implementation. |
| Joker pool with speed/reverse/shuffle pranks | None | Optional later; avoid disrupting the first rehearsal. |
| Scheduled wildcards/intermissions | None | Host-written surprises after completed clue counts, if wanted. |
| Finale video and winner/fireworks controls | Winner/tie panel | A skippable finale can follow reliable base gameplay. |
| Themes, text sizes, ambient settings | Black/gold TV layout, reduced-motion handling | Keep Gatsby style; test readability on the real TV. |

The reference's editor exposes more categories than its initial board. Our game deliberately shows only the six selected columns, with the full bank visible during preparation. The reference is an interaction reference; it is not embedded or copied into the invitation.

## Rules for future tokens and choosing order

These are proposals, **not current controls**:

1. Separate the team choosing the next tile from the team answering a steal. A correct team chooses next; an unanswered clue preserves the previous choosing team.
2. Allow a host-offered steal after a miss, before exposing the answer. A team gets at most one attempt per clue.
3. Optional Double Up is declared before answering, once per team: ±2× the clue value. A later steal remains the ordinary value.
4. If a first-letter token is added, define its positive/negative scoring before building it. Avoid combining a paid steal token with free ordinary steals.
5. Score, token and turn changes must share one undo boundary and survive validated reload.

## Implementation boundaries

`engine.js` owns selected categories and the event history. Its replay recomputes scores instead of trusting saved totals. `app.js` owns preparation, timer and presentation. `pack-tools.js` validates local JSON and media references. `session-store.js` guards writes against another tab's newer snapshot.

Media and timer expiry must never award points. Imported content cannot replace the selected reaction pair. A final private pack should be previewed on the host laptop and actual TV, with local backups. The current controls are browser-tested at 1280×720; a physical TV rehearsal remains necessary.

See [GAME-QA.md](GAME-QA.md) for concrete verification. Guest RSVP/photo collection is separate from this local host game and is not established by game checks.
