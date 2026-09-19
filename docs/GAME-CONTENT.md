# The Sara Show — starter content

The public rehearsal pack in `game/pack.js` has **six categories, 30 board slots and 22 playable clues** in English and Norwegian Bokmål. Eight slots are explicitly marked `draft: true` and must remain unavailable for scoring. The four general-knowledge categories are complete; the personal rounds need real material from the host.

| Category | Ready | Still needed |
| --- | ---: | --- |
| Famous Saras / Kjente Saraer | 5 | Host can swap in public figures the guests recognise. |
| The Birthday Girl / Bursdagsbarnet | 1 | Four celebrity mashups and confirmed answers. The current picture clue uses Sara's existing Gatsby toast recreation. |
| What's That Country? / Hvilket land? | 5 | Text clues work now; silhouettes or landmark images can replace them later. |
| The Roaring Twenties / De glade 20-årene | 5 | No missing content. |
| The Sara Archives / Sara-arkivet | 1 | A confirmed location, a real quote, a story ending and one harder personal question. |
| Bad Movie Plots / Dårlige filmreferat | 5 | Original humorous descriptions; host may accept either English or Norwegian film titles. |

These are rehearsal questions, with approximate difficulty. Guests who have read the invitation may already know the answer to the Norwegian Prohibition question. Personal rounds should become the best part of the finished pack; placeholder questions must not be passed off as Sara facts.

## Supplied memes

All eight files from the user's `Sara memes` folder have been inspected visually. They are reaction stickers, not confirmed celebrity face mashups. Their RIFF containers contain **no `ANIM` or `ANMF` chunks**, so the supplied WebPs themselves are static. Entrance, bounce or shake animation belongs in the game interface. Files were copied byte-for-byte; no re-encoding or edits were performed.

The correct/wrong choices are creative reaction assignments, not claims about what Sara felt when the photos were taken. All eight are exposed through `pack.reactions` so a host can preview the complete set.

| Local game asset | Supplied file | Default use |
| --- | --- | --- |
| `game/assets/reaction-01.webp` | `sticker2.webp` | Correct — exaggerated grin |
| `game/assets/reaction-02.webp` | `sticker5.webp` | Correct — confident pose |
| `game/assets/reaction-03.webp` | `sticker.webp` | Correct — laughing face |
| `game/assets/reaction-04.webp` | `sticker4.webp` | Correct — smile |
| `game/assets/reaction-05.webp` | `6.webp` | Wrong — exaggerated crying face |
| `game/assets/reaction-06.webp` | `sticker3.webp` | Wrong — puzzled look |
| `game/assets/reaction-07.webp` | `sticker7.webp` | Wrong — distorted close-up |
| `game/assets/reaction-08.webp` | `sticker8.webp` | Wrong — unimpressed look |

Two existing invitation assets are reused with answer-neutral filenames:

- `game/assets/clue-bg-100.jpg`: copy of the existing Sara Gatsby toast recreation. The actor answer follows the host's explicit Leonardo DiCaprio reference; this is not a real scene of Sara acting in the film.
- `game/assets/clue-sa-100.jpg`: copy of the supplied table-tennis action photo. The host explicitly identified these as Sara's ping-pong days. No competition, year, ranking or award is inferred from the photo.

The public pack intentionally contains no guest submissions or unverified private anecdotes. Every clue and answer in a static public pack can be read by visitors; save the surprise party questions for a private pack or a later protected host workflow.

## Content format

`window.BIRTHDAY_GAME_PACK` contains stable `id`, localized `title` and `subtitle`, `categories`, and `reactions`.

Each category has `id`, localized `title`, localized `description`, and five `clues`. Each clue has `id`, `value`, localized `question` and `answer`; image clues also have an answer-neutral `image` URL and localized `imageAlt`. Missing personal content uses `draft: true`.

Localized fields have `{ en: 'English', nb: 'Norsk bokmål' }`. Asset URLs are relative to the game's page, for example `assets/reaction-01.webp`. The reaction lists contain URL strings: `reactions.correct` and `reactions.wrong`. Scoring, timer, storage and UI state stay outside this content file.

## Fact-check references

The following are source notes for the host, rather than clues shown on the television. Movie descriptions in the pack are original paraphrases, not quotations.

### Famous Saras

- Sarah Jessica Parker as Carrie: [Warner Bros. Discovery press release](https://press.wbd.com/us/media-release/max/hbo-max-releases-and-just-first-look-image-production-begins-nyc).
- Sarah Michelle Gellar as Buffy: [Disney+ series page](https://www.disneyplus.com/browse/entity-f2c277c5-62b4-417c-b277-8435b70176dd).
- Linda Hamilton as Sarah Connor: [Paramount — Terminator: Dark Fate](https://www.paramountpictures.com/movies/terminator-dark-fate).
- Sarah Paulson as Marcia Clark: [FX cast page](https://www.fxnetworks.com/shows/american-crime-story/people-vs-oj-simpson/cast/sarah-paulson-marcia-clark).
- Sofie Gråbøl as Sarah Lund in The Killing: [BBC Programme Index](https://genome.ch.bbc.co.uk/search/0/34?filt=p02m460t).

### Geography

France/Paris and Italy's boot shape are standard geographic identification clues. The other clues were checked against national tourism sources: [Japan National Tourism Organization](https://www.japan.travel/en/destinations/tokai/), [Visit Iceland — Reykjavík](https://www.visiticeland.com/the-regions/reykjavik-the-capital/) and [Tourism Australia — Australian Capital Territory](https://www.australia.com/en-gb/places/australian-capital-territory.html). These are geographic questions, not travel recommendations.

### The Roaring Twenties

- Speakeasies: [The Mob Museum](https://prohibition.themobmuseum.org/the-history/the-prohibition-underworld/the-speakeasies-of-the-1920s/).
- Talkies: [Library of Congress](https://loc.gov/loc/lcib/08012/silent.html).
- Charleston and flappers: [Library of Congress](https://guides.loc.gov/chronicling-america-flappers).
- Fitzgerald and The Great Gatsby: [Library of Congress — America Reads](https://loc.gov/exhibits/america-reads/1900-to-1949.html).
- Norwegian spirits ban: [FHI historical overview](https://www.fhi.no/le/alkohol/alkoholinorge/alkohol-i-historien/historisk-oversikt-alkohol-i-norge-1816-2019/). Referendum in 1926, formal repeal in 1927; the fortified-wine ban ended separately in 1923.

### Bad Movie Plots

- Titanic: [Paramount synopsis](https://www.paramountpictures.com/movies/titanic).
- Home Alone: [20th Century Studios synopsis](https://family.20thcenturystudios.com/movies/home-alone).
- Jurassic Park: [Universal Pictures synopsis and 1993 release](https://www.universalpicturesathome.com/movies/jurassic-park).
- Finding Nemo: [Pixar story and character page](https://www.pixar.com/finding-nemo).
- Inception: the dream-heist premise and idea-planting objective refer to the 2010 film; [Warner Bros. film page](https://www.warnerbros.com/movies/inception) is the official reference, though its text is not exposed in the research browser.
