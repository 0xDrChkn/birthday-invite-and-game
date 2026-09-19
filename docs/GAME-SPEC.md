# Sara's birthday game — specification and reference comparison

Updated 19 September 2026. This document separates the **working rehearsal game** from the **recommended party version**. The content brief is in [GAME-CATEGORIES.md](GAME-CATEGORIES.md); the actual running questions remain in `game/pack.js`.

## The game we should make

One host, one laptop, one television, 2–6 teams. Guests answer aloud. A six-column board keeps the whole game readable; 30 questions is enough variety without reproducing the reference's ten-column board. Budget 45–60 minutes as a rehearsal estimate, including stories and laughter.

Keep neutral black, warm gold, ivory type and restrained Art Deco framing. The fun comes from the questions, Sara's face mashups and her reaction stickers. The host should not have to navigate a settings screen between questions.

| Category | Format | Progression |
| --- | --- | --- |
| **Famous Saras** | Real and fictional Sara/Sarah name trivia. | Familiar TV roles → music → fictional character → Swedish sport. |
| **The Birthday Girl** | Sara's face blended into a celebrity; identify the original person. | Gatsby toast → strong occupation/stage clues → less obvious portraits. Reveal the original alongside the mashup. |
| **What's That Country?** | Large outlines, a landmark and a regional map. | Italy → France → Japan → Iceland → New Zealand. Reorder after testing the actual pictures. |
| **The Roaring Twenties** | Dance, Prohibition vocabulary, early cinema and Gatsby. | Charleston → speakeasy → talkies → Fitzgerald → put three historical events in order. |
| **The Sara Archives** | Table tennis, a trip, a real quote, a story ending and a matching puzzle. | Visible evidence first; harder personal clues include context and choices so newer friends can participate. |
| **Party Science** | Fizz, floating ice, condensation, sound/light and topspin. | Everyday observations → simple explanations → a table-tennis connection. No formulas needed. |

**Recommendation:** Party Science takes the last column. Famous Saras and the mashups already give celebrity/film fans two categories. Keep the current **Bad Movie Plots** column ready as a substitute. The [30-clue brief](GAME-CATEGORIES.md) supplies formats, proposed wording, accepted answers, sources and exact asset needs. These new questions and mashups are specified, not all built.

## Working game today

The rehearsal board has **22 playable clues and 8 disabled drafts**. Four celebrity mashups and four personal Sara clues still need real material. Drafts do not count against completing a game.

The following are implemented: 2–6 unique team names; team selection; 100–500 clue values; text and picture clues; plus/minus points and negative scores; one attempt per team per clue; another team after a wrong answer; manual reveal and automatic reveal after a correct award; finish or return to an unfinished clue; repeated undo; an optional 45-second timer with start, pause, resume and reset; English/Norwegian; fullscreen with a fallback message; final winners including ties; local restoration of scores, current clue and paused timer.

A host can pass by switching teams without awarding points, or finish with no score. Finishing marks a tile used. Returning to the board without finishing preserves attempts and points. Undo can recover a score decision even after the clue has been finished. Manual reveal currently leaves adjudication to the host: it is not a lock against awarding points after seeing the answer.

### Sara's correct/wrong reactions

Use the two selected WebPs as transparent cutouts **without a surrounding card or picture frame**, as in the reference screenshot. A correct decision gets a warm gold glow; a wrong decision gets a muted red glow. The page itself stays black and gold.

The pink-sweater pose is always correct; the sceptical face is always wrong. Three entrance effects still rotate independently for each result. Correct uses pop, float or swing; wrong uses shake, drop or wobble. The current images are static originals: CSS supplies the movement. One reaction appears per score decision, displays the team and signed points, and dismisses after 2.6 seconds or immediately with Continue/Escape. The selected face stays the same; consecutive entrance effects differ. Reactions can be switched off and default off under reduced motion; if enabled with reduced motion, their entrances remain still.

| Result | Original files | Game copies |
| --- | --- | --- |
| Correct | `sticker5.webp` (pink sweater) | `reaction-02.webp` |
| Wrong | `sticker3.webp` (sceptical face) | `reaction-06.webp` |

The setup screen previews every sticker without awarding points. Sound is not yet part of the reaction. The source images are unchanged.

## What the Lovable example actually has

Inspected [Bright Play Show](https://bright-play-show.lovable.app/) and its [admin editor](https://bright-play-show.lovable.app/admin) on 19 September 2026. Opened a clue, paused its automatic countdown and cancelled it; inspected Presets, Display, Sounds, Wildcards, Jokers, Teams and Categories. No reference scores, settings, uploads or questions were saved or changed. Controls below were observed; untested scoring/token semantics are not assumed.

| Feature observed in the reference | Sara game now | Integration decision |
| --- | --- | --- |
| Text/picture category editor: names, questions, answers, uploaded image or URL, reorder, add/remove | Source-controlled pack only | **Next priority.** A preparation editor with a preview and validation. TV play remains separate. |
| Named presets containing questions, teams, settings and uploads | One rehearsal pack | Add reusable event packs. Local import/export is our proposed addition; it was not observed in the reference. |
| Editable team list; host turn selector; standalone ±100 controls | Setup names, selected answering team, clue-based scoring | Add rename and a logged manual score correction. Model the choosing team separately from the answering team. |
| Timer starts when a clue opens; configurable duration and four styles | Optional manual 45-second timer | Keep manual start as the default so the host can read aloud. Add duration setting; one clear countdown is enough initially. |
| Correct/incorrect popup image; size setting; optional frame; eight selectable rotating entrance effects | Two fixed Sara images; frameless treatment; six entrance effects across the two outcomes | Core requested effect is implemented. A size/animation chooser can live in preparation settings later. |
| Multiple correct/wrong audio clips, non-repeating rotation, time-up sound and built-in fallbacks | Silent | Optional next layer: separate mute/volume, brief clips and a test button. Never make scoring wait for media. |
| DOUBLE UP, FIRST LETTER and STEAL actions; one-use token indicators on team cards | No tokens | Add only after rules are explicit. Start with one Double Up per team; keep the rest optional. Reference token behaviour was not activated/tested. |
| Joker pool with speed prank, missing-word, reverse and shuffle variants | None | Later experiment, disabled by default. Some are unsuitable for image clues. Avoid disrupting the first rehearsal. |
| Scheduled wildcards after a specified number of answered questions; text, colour, fade, sound, preview | None | Optional host-written intermission after 10/20 completed clues. Keep surprises out of the public invitation. Do not copy the reference's party-specific announcements. |
| Final reveal video, then winner/fireworks/scoreboard described in editor | Simple winners/ties panel | Add a short winner reveal and optional video after core preparation. The reference finale was inspected as a setting, not played end to end. |
| Themes, ambient effects, question/title sizes, category wrapping and point sizes | Gatsby theme and responsive CSS | Keep the Gatsby theme; add a TV readability setting. A broad theme picker is unnecessary for Sara's party. |

There is no need to embed or fork the Lovable application. Bring the useful interaction patterns into this repository; keep its private content and uploads out of ours.

## Recommended party rules

These are the target rules for the fuller version; controls beyond the current behaviour above remain to be implemented.

1. The host names teams, selects the pack and previews a picture/reaction on the actual TV. Names are editable without changing team IDs or scores.
2. A choosing team picks a tile. The host selects the answering team. These roles are separate so a steal does not silently change who chooses next.
3. Start the optional timer when everyone can see/read the clue. The host can pause, reset or allow more time. Timeout alerts the host; it does not deduct points automatically.
4. Correct is +value; wrong is −value; pass is zero. Each team gets at most one attempt. Allow one offered steal after a miss, at the ordinary clue value, and then reveal. The host decides whom to offer it to; no shouting-speed detector.
5. Once the answer is exposed, no new steal may start. The host can still judge the team whose answer was already given. This needs an explicit answer/attempt state; it is not enforced by today's manual reveal.
6. Finish the clue; the last correct team chooses next. If nobody answers correctly, the previous choosing team keeps control. The current app requires the host to manage choosing order manually.
7. An optional **Double Up** is declared before answering/reveal, once per team: +2×value or −2×value. It does not double a later team's steal. Clearly show the stake before starting the timer.
8. A first-letter hint, if added, consumes that team's token and halves the available positive award for this attempt; negative value stays normal. A paid “Steal” token is unnecessary if ordinary steals are enabled. Pick one system, rather than combining conflicting rules from the reference.
9. Every point change/token use is undoable together. Finishing with no score is also undoable. A manual correction needs an amount, a reason and an event in the same history.
10. At completion, display all teams in score order and acknowledge ties. An optional final face puzzle is specified in the category brief; it is not required to finish the base game.

## How to integrate it in this codebase

### 1. Preparation and a complete pack

Extend the existing pack model, not the scoring UI. Add optional `acceptedAnswers`, `hint`, `explanation`, `answerImage`, `source` and `mediaType` fields to each stable clue ID, with `{en, nb}` for text. A missing verified answer/image keeps a clue in draft. All user-authored strings render as text, not HTML. Adding science does not require changing the engine.

Build a separate host preparation view for editing and ordering six categories, text/picture clues, answer variants and media. Support a reusable pack name and export/import containing JSON plus local image files. Use a private local archive, not remote image links that may break on party night. Validate duplicate IDs, sizes, unsupported files and missing answers before a pack becomes playable. Confirm before loading a different pack over an active game.

The public GitHub Pages pack remains a rehearsal pack. Final guest anecdotes, original photos and unrevealed clues should be loaded locally on the host's laptop and not committed to the public repository. Local pack loading is still missing; for now leave those draft slots blank. Guest RSVP/story collection is a separate backend concern and is not required for host-controlled scoring.

### 2. Safe host controls

`engine.js` remains responsible for state changes. Add explicit events for team rename, manual score correction, turn ownership and token use. Their undo must restore scores, attempts, token availability and turn together. Version the saved-game schema and validate imported/restored histories. Keep media/timers out of score calculation.

`app.js` handles clue presentation and controls. Put preparation settings behind a host button; preserve the calm TV board. Never put answers in the question image's filename, alt text or visible title. Side-by-side answer images appear only on reveal. An import should reject an invalid pack before replacing the last working one.

`session-store.js` guards local saves against a stale second tab. A detected conflict stops that tab and offers reload instead of overwriting newer scores. This is single-host browser storage, not collaborative realtime synchronization. A later export/backup should let the host move an in-progress game to another laptop.

### 3. Optional show controls

Keep correct/wrong effects in the presentation layer: scoring commits first, then a short overlay plays. Add audio rotation, mute and volume without changing the score event. A clip failure or slow image must never block Finish/Undo. Preload the reaction deck. Use local, user-provided/permitted clips and require a host gesture before sound playback.

Scheduled intermissions must count completed playable clues, not raw score clicks. Record which intermissions fired so undo/reload does not repeatedly interrupt the game. Treat a finale video as skippable; always reach standings when it ends, fails or is skipped. Respect reduced-motion settings and provide a no-effects mode.

## Acceptance checks and remaining work

The scoring tests cover teams, drafts, positive/negative awards, duplicate attempts, multiple teams, reveal, cancel, finish, undo, all-clue completion, ties, serialization and rejecting corrupt/changed packs. Additional save-guard tests exercise stale tabs and unavailable storage. Browser checks cover visible score/reaction flow and reload; see [GAME-QA.md](GAME-QA.md) for the concrete results and limits.

Before party use, require:

- All intended 30 clues ready, both languages equivalent, original/mashup pairs matched and personal answers confirmed by the host.
- A real-TV rehearsal: every country outline/face visible, long category names readable, controls in reach at the chosen display resolution.
- A wrong → steal → correct → undo sequence with no duplicated score/token changes; pass and timeout must not deduct automatically.
- A reload during a clue, after a reaction and after an undo restores the same game. A stale tab cannot overwrite it.
- Every media failure has a usable text/skip fallback. Scores work with effects muted/off.
- A reviewed private pack and a backup before guests arrive.

**Next implementation order:** finish verified content and visual clues → private editor/import → team corrections/turn handling → optional Double Up and sound → optional intermissions/finale. The requested meme treatment and confirmed save bug are part of this pass; the other items are specifications, not a claim of completed features.
