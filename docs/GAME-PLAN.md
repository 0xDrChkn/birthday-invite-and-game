# Birthday quiz — future implementation plan

**Status: category/design proposal, not a playable game yet.** Updated 19 September 2026 after exploring the user's game reference. The user wants a simple host-operated TV game and recommendations for the rounds. Submission code exists separately; the live collection service is still being chosen.

## The experience

A Jeopardy-style category board runs on one laptop connected to a TV. The host operates it with a mouse. Guests form **2–6 teams**, answer aloud, and see their scores on the television. The host enters team names; guests do not need accounts, phones, QR codes, or remote buzzers.

For Sara’s party, the visual style continues the invitation’s Gatsby theme: **neutral black, charcoal and warm gold; no green**, Art Deco details and large readable type. The event is Sara Matilda Berner’s 30th birthday on **17 November 2026 at 19:00**. Keep the game reusable for other people and themes; do not bake Sara’s name or party date into the scoring logic.

## Reference explored

[Bright Play Show](https://bright-play-show.lovable.app/) was inspected through the board, category editor and text/picture question dialogs. Its active “Philip Bday” preset has ten categories, five values, team scores, a 45-second countdown, pause, answer reveal, correct/incorrect scoring and undo. It also exposes reusable presets, team editing and optional wildcards. No reference settings, scores, uploads or question content were saved or changed.

The user's two favourites are different formats: **Famous Philips** is trivia about people named Philip/Phil; **The Birthday Boy** shows celebrity face mashups. Keep that distinction in Sara's adaptation. The geography round uses country silhouettes.

## The host’s flow

1. Create 2–6 teams and enter their names.
2. Show a board with six categories and five clue values per category: **100, 200, 300, 400 and 500**.
3. A team chooses a category and value aloud. The host clicks that tile to display the clue full-screen or in a large dialog.
4. Select the answering team. Award the clue’s value for a correct answer, or deduct it for an incorrect answer. Negative totals are allowed. Another team may attempt a missed clue if the host permits it.
5. Reveal the accepted answer when ready. The host judges the answer and awards points; the game does not need speech recognition or automated judging.
6. Finish the clue, mark its tile as used, and return to the board. The host can finish without awarding points.
7. Continue until the board is complete, then show the final standings and any tied winners.

Allow **undo of the most recent score change** and show enough context to confirm what was undone. Guard against accidental duplicate awards. Require confirmation before clearing an active game. Renaming a team should preserve its score; removing a team must explain what happens to its points.

## Sara’s proposed categories

These are creative directions, not a completed question bank. Personal facts, photographs, quotations and accepted answers must come from the host or guests and be reviewed before use.

| Category | Round idea | Content needed |
| --- | --- | --- |
| **Famous Saras** | Identify well-known Saras/Sarahs from a photograph or short clue. This is the adaptation of Famous Philips. | Five recognisable public figures or fictional characters and checked clues. Candidate pool: Sarah Jessica Parker, Sarah Michelle Gellar, Sarah Paulson, Sarah Connor and Sarah Lund. Confirm which references suit the guest group. |
| **The Birthday Girl** | Sara's face is blended into a celebrity; name the other person. Keep it purely visual and allow time for the room to react. | Five prepared mashups and accepted answers. Candidate targets: Leonardo DiCaprio, Taylor Swift, Rihanna, Gordon Ramsay and Ryan Gosling. These are proposed targets, not finished assets. |
| **What’s That Country?** | Country silhouettes, flags or one unmistakable landmark. Easy questions let everyone contribute. | Five verified maps/images with answer-neutral filenames and alt text. Use familiar shapes for 100/200; rotate or crop only in the harder clues. Personal travel photos can be a bonus once their locations are confirmed. |
| **The Roaring Twenties** | Prohibition, dance, early cinema and Gatsby, with amusing but accurate clues. | See the sourced draft below. Keep Norway's spirits ban distinct from US Prohibition. No invented historical licences. |
| **The Sara Archives** | Sporting days, real quotes and “what happened next?” from guest stories. | Five host-checked stories/photos/answers. Use multiple choice where only a few close friends would know the answer. The table-tennis pictures are good material, but the host must confirm any date, event or achievement. |
| **Bad Movie Plots** | Recognise a familiar film from a deliberately unglamorous one-sentence synopsis. | Five original descriptions of films the group knows. Keep them accurate and avoid ambiguous franchise-wide answers. |

**Recommendation: six categories × five clues = 30 questions.** This gives a readable television board and a mix of personal material, pictures, geography, history and mainstream entertainment. Allow roughly 45–60 minutes as a planning estimate, depending on conversation and photo reactions. The 100/200 questions should be welcoming; 400/500 should remain solvable rather than obscure.

Backup/swap-in rounds:

- **Science + Tech:** everyday science, common inventions and one playful experiment/photo. Swap for Bad Movie Plots if the group prefers science.
- **Match Point:** table-tennis rules plus Sara's confirmed sporting memories. Use instead of The Sara Archives if there is enough good material.
- **Who Said It?:** real Sara quotes mixed with recognisable film lines. Requires verified quotes; do not invent Sara quotations.
- **One-Hit Wonders:** artist/song identification. Audio clips need permitted sources; do not depend on automatic playback.

## Black-and-gold TV treatment

Use the same Cormorant Garamond headings and Jost labels as the invitation, black `#080808`, charcoal `#141414`, ivory `#f3ead7` and champagne gold `#cfad70`. Six even columns, thin Art Deco borders, large gold point values without dollar signs, and a compact team-score rail. No blue game-show background or green panels.

Clicking a tile should expand into a calm, nearly full-screen clue. Images use `object-fit: contain`; never crop a face or a country silhouette. Keep the timer in a small corner and the reveal/scoring controls along the bottom. A short gold line sweep and fade are enough animation; no long interstitials between every question. Returning to the board marks completed clues with a small gold diamond.

Borrow the useful controls from the reference: 45-second optional timer, pause, reveal, current-team selection, plus/minus, undo, and reusable question packs. A single optional **Double or Nothing** token per team is enough for the first version; decide it before revealing the answer. Leave other wildcards out of the initial flow unless the host requests them.

## Sourced Roaring Twenties draft

These are draft clue ideas, not deployed game answers. Difficulty/order can change after a rehearsal.

| Points | Question | Answer and source |
| --- | --- | --- |
| 100 | During US Prohibition, what was an illicit bar commonly called? | **A speakeasy.** [The Mob Museum](https://prohibition.themobmuseum.org/the-history/the-prohibition-underworld/the-speakeasies-of-the-1920s/) |
| 200 | What nickname did films with spoken dialogue acquire as silent cinema gave way to sound? | **Talkies.** [Library of Congress](https://loc.gov/loc/lcib/08012/silent.html) |
| 300 | Pick the dance most associated with 1920s flappers: the Charleston, the Macarena or the moonwalk. | **The Charleston.** [Library of Congress](https://guides.loc.gov/chronicling-america-flappers) |
| 400 | Before Leonardo raised his glass, who wrote the 1925 novel The Great Gatsby? | **F. Scott Fitzgerald**; accept Fitzgerald. [Library of Congress](https://loc.gov/exhibits/america-reads/1900-to-1949.html) |
| 500 | Norway had a spirits ban too. Was it formally repealed in 1923, 1927 or 1933? | **1927.** [FHI](https://www.fhi.no/le/alkohol/alkoholinorge/alkohol-i-historien/historisk-oversikt-alkohol-i-norge-1816-2019/) |

Host note: the Norwegian referendum was in 1926, but formal repeal was in 1927. The fortified-wine ban ended separately in 1923. The invitation itself gives the 1927 answer, rewarding guests who read it.

Do not fill missing personal clues with invented Sara facts. During preparation, empty slots should be visibly marked as drafts and unavailable for play. The finished party board can use fewer categories or clues if that produces a better game than filler.

## Guest stories and top three photos

The invitation collects **one favourite Sara story and up to three photographs** once a live service is connected. Explain that the host may select contributions for a collage or party quiz. Contributions go to a private host review area, where the host can select, caption and adapt them into clues.

**The Supabase implementation is built and locally tested; the user has now requested a simpler hosted-form or Discord alternative. Live collection is not yet connected.** See `SUBMISSIONS.md` for the existing implementation. A public Git repository or GitHub Pages asset folder is not a submission inbox. Do not commit guest submissions, personal anecdotes, unapproved photographs, response lists, credentials or upload tokens to the public repository. A preview must not claim that a story or upload has been sent when no receiving service is connected.

When storage is chosen, define the accepted image formats and size limits, a maximum of three uploads, guest attribution, consent for party use, host access, and deletion/export. Use server-enforced checks rather than relying only on the browser. Reuse reviewed contributions across the collage and quiz without publishing the whole submission collection.

## Reusable structure

Keep three concerns separate:

- **Event content:** honoree, celebration details, languages, theme, categories, clues, image references and accepted answers.
- **Game rules and state:** teams, completed clue IDs, score events, current selection and game version. Derive totals from score events so undo is reliable.
- **Presentation:** the board, clue display, host controls and standings. Use a theme layer so a later birthday can look different without changing the rules.

Use stable IDs for teams, categories and clues. Text and labels should support English and Norwegian, matching the invitation. Image clues need useful alternative text without disclosing their answer.

The first game can remain a small static HTML/CSS/JavaScript application. Avoid introducing a multiplayer service for the agreed in-room host workflow.

## Persistence and answers

Save an in-progress game locally in the host’s browser: team names, score events and completed clues. Restore it after reload, validate saved data, and handle unavailable browser storage visibly. Local persistence is specific to that browser and device; it is not a backup, shared session or guest database. An explicit export/import option can be considered later if the host needs to move devices.

**Host-only answer protection needs a separate decision before real personal content is deployed.** A hidden panel, unlinked page, JavaScript variable, client-side password or `noindex` tag does not keep answers private on a public static site. Suitable future approaches include:

- A host-run game that imports a private question pack locally on the party laptop and never uploads it to GitHub Pages.
- An authenticated host application that fetches private questions and answers from a service which enforces access on the server.

The public invitation can stay on GitHub Pages independently. Until a protection model is chosen, public previews should contain only clearly labelled sample material, with personal rounds left empty.

## Implementation sequence and acceptance checks

1. **Finish the reusable invitation.** Keep the game entry point an honest “coming later” placeholder.
2. **Choose private submission storage.** Connect story/photo collection and host review without exposing submissions in the public site.
3. **Approve the question pack and answer-access model.** Collect real Sara content, prepare face-mashup images, confirm answers and decide whether the game runs locally or behind authentication.
4. **Build and test the host-controlled game.** Verify 2 and 6 teams, positive and negative scores, undo, duplicate-award prevention, used clues, reload recovery, unavailable storage, reset cancellation and reset confirmation.
5. **Rehearse on the actual laptop and TV.** Check long team names, readable text and photos from across the room, fullscreen behaviour, keyboard focus and the full click-through flow. Confirm that guests cannot retrieve private answers from the public invitation.

Phone joining, online multiplayer, automatic buzzers, wagering, timed rounds and advanced tournament rules are optional future additions, not requirements for this first party game.

## Table-tennis chapter added

The host supplied two photographs from Sara’s table-tennis days: an action shot and a photo holding a trophy. They are included in the invitation’s public album as `assets/memory-10-table-tennis.jpg` and `assets/memory-11-trophy.jpg`.

A possible alternate category is **“Serve It, Sara” / “Servér, Sara”**: mix table-tennis rules with personal sporting memories. Ask the host to confirm the competition, year, trophy and any personal achievements before writing answers. The photographs alone do not establish those facts.
