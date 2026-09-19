# Birthday quiz — future implementation plan

**Status: planned, not implemented.** The invitation comes first. The user has deferred the game and guest-submission storage until a later phase. This document preserves the agreed direction for a reusable birthday invitation and game project.

## The experience

A Jeopardy-style category board runs on one laptop connected to a TV. The host operates it with a mouse. Guests form **2–6 teams**, answer aloud, and see their scores on the television. The host enters team names; guests do not need accounts, phones, QR codes, or remote buzzers.

For Sara’s party, the visual style should continue the invitation’s Gatsby theme: dark green or charcoal, warm gold, Art Deco details, large readable type, and a little dry humour. The event is Sara Matilda Berner’s 30th birthday on **17 November 2026 at 19:00**. Keep the game reusable for other people and themes; do not bake Sara’s name or party date into the scoring logic.

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
| **Sara or Celebrity?** | Merge Sara’s face into a recognisable celebrity photograph; teams identify the celebrity, film, character or scene. | Selected Sara reference photos, celebrity/scene references, the chosen question and accepted answer. Images are prepared in advance. |
| **Where in the World Is Sara?** | Identify a place from a travel photo, map crop or clue. Mix personal travels with geography if desired. | Sara’s travel photos and verified locations. Avoid inferring locations from an unconfirmed picture. |
| **Science, Darling** | A science round with playful wording and increasing difficulty. | A short set of checked questions and unambiguous accepted answers. |
| **The Sara Archives** | Stories, milestones, childhood photos, “what happened next?” and other evidence from her journey to thirty. | Real stories and dates supplied by the host or guests; only use material approved for the party. |
| **Who Said That?** | Match a quotation or anecdote to the person who said it, or distinguish a Sara quote from a decoy. | Actual quotations and their authors; clearly distinguish authored decoys from real quotations. |
| **The Roaring Twenties** | Gatsby, music, film, the 1920s and a farewell to Sara’s twenties. | Checked general questions, plus any personal questions the host chooses to add. |

Do not fill missing personal clues with invented Sara facts. During preparation, empty slots should be visibly marked as drafts and unavailable for play. The finished party board can use fewer categories or clues if that produces a better game than filler.

## Guest stories and top three photos

The invitation should eventually let a guest submit **one favourite Sara story and up to three photographs**. Explain that the host may select contributions for a collage or party quiz. Contributions should go to a private host review area, where the host can select, caption and adapt them into clues.

**Submission handling is deferred and requires future private storage.** A public Git repository or GitHub Pages asset folder is not a submission inbox. Do not commit guest submissions, personal anecdotes, unapproved photographs, response lists, credentials or upload tokens to the public repository. A preview must not claim that a story or upload has been sent when no receiving service is connected.

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
