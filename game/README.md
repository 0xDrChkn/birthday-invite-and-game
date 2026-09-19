# The Sara quiz

A host-controlled game for one laptop connected to a television. Open [the game](https://0xdrchkn.github.io/birthday-invite-and-game/game/) and enter 2–6 team names.

1. Pick the answering team in the score bar.
2. Click a category/point tile. Start the optional 45-second timer.
3. Use **Correct** to award points or **Wrong** to deduct them. Each brings up a Sara reaction. A different team can try after a wrong answer.
4. Reveal the answer when ready, then **Finish clue** to mark the tile as played.
5. Use **Undo** for a scoring mistake, even after finishing the clue. Closing a clue without finishing keeps existing scores and allows you to return to it.

Reactions can be switched off from the board; they default off for reduced-motion preferences. The eight source stickers are static WebPs, animated with a CSS entrance or shake. There is no automatic sound.

The English/Norwegian switch changes the interface and clues. The board is designed for a landscape TV/laptop. On small phones, swipe the board horizontally to keep all six columns legible.

## Current content

There are six categories with five slots each. **22 clues are playable; 8 personal/mashup slots are marked “To prepare”.** Draft tiles do not count against finishing the game. No personal stories or answers have been invented to fill them.

- `pack.js` contains the question pack, translations and reaction paths.
- `assets/` contains the supplied stickers and two already-approved photo clues.
- `engine.js` owns teams, score events, duplicate prevention, completion, undo and validated restoration.
- `app.js` owns the browser interface and timer.
- `game.css` owns the black-and-gold presentation.

To reuse the game, change the pack ID, content and branding. To complete a draft clue, add verified question/answer text and any image, then remove `draft: true`. Clue IDs must remain unique. The pack fingerprint detects changed content and prevents an old game being restored against different questions.

Scores save only in this browser on this device. They are not shared with guests or backed up remotely. Reload restores the current clue and paused timer. New game clears scores only after confirmation. Local saving failures are shown rather than silently ignored.

The public pack is a rehearsal pack: its answers are public source code. Do not commit private guest stories or secret final answers to this repository. Private local pack import remains future work.

## Checks

```sh
node --test tests/game-engine.cjs
node --check game/app.js
node --check game/pack.js
```

See [content sources and remaining clues](../docs/GAME-CONTENT.md) and [the broader game plan](../docs/GAME-PLAN.md).
