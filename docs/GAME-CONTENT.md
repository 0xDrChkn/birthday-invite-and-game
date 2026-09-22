# The Sara Show — content and source notes

Updated 22 September 2026. `game/pack.js` contains **10 categories × 5 clues: 42 playable clues and 8 personal drafts**. All questions and answers have English and Norwegian Bokmål text. Six complete categories are selected by default (30 playable clues); four other categories are available in the bank.

The eight drafts are `bg-200` through `bg-500` (celebrity mashups) and `sa-200` through `sa-500` (personal stories). They must remain unavailable until the host supplies reviewed material. No personal facts, celebrity blends or guest stories were invented to fill these slots.

## Content format

`window.BIRTHDAY_GAME_PACK` contains `id`, localized `title` / `subtitle`, `defaultCategoryIds`, `categories` and `reactions`. Category IDs are stable; the new IDs are `name-that-tune`, `before-or-after`, `party-science` and `the-impostor`.

Each category has an ID, localized title/description and five clues, worth 100–500. A clue has `id`, `value`, localized `question` / `answer`, optional `image` / `imageAlt`, and `draft: true` when unfinished. Localized text is `{ en, nb }`. Accepted title/spelling variants are included in the answer text. Source notes stay in this document so they do not reveal answers on the television.

The unchanged pack ID is `sara-rehearsal-v1`; the engine’s content fingerprint detects edits, so an old saved game cannot silently reuse scores against changed questions. Select a new game when changing the bank. Category selection, scoring and timers belong to the game controls, not the pack.

## Assets and selected reactions

Only the host’s two chosen reaction faces are active:

| Result | Asset | Supplied original |
| --- | --- | --- |
| Correct | `game/assets/reaction-02.webp` | Pink-sweater pose, originally `sticker5.webp`. |
| Wrong | `game/assets/reaction-06.webp` | Sceptical face, originally `sticker3.webp`. |

Other previously copied stickers remain on disk but are not selected by `pack.reactions`. The WebPs are static; the interface animates them. The outcome assignments are creative choices, not claims about Sara’s feelings in the original photographs.

Existing picture clues:

- `clue-bg-100.jpg`: Sara’s approved Gatsby toast recreation. The actor answer follows the host’s explicit Leonardo DiCaprio reference; it is not a real scene of Sara acting in the film.
- `clue-sa-100.jpg`: the table-tennis action photo explicitly identified by the host as Sara’s ping-pong days. No year, tournament, ranking or award is inferred.

Five new local SVGs use [Natural Earth’s 1:110m country polygons](https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_110m_admin_0_countries.geojson), whose [terms place the data in the public domain](https://www.naturalearthdata.com/about/terms-of-use/). These are simplified geographic outlines, not generated guesses. North stays up; longitude is scaled by the cosine of the view’s mean latitude before fitting the frame. SVG titles, filenames and visible text do not contain answers.

| Asset | Geographic content |
| --- | --- |
| `clue-geo-100.svg` | Italy, including Sicily and Sardinia. |
| `clue-geo-200.svg` | France’s European area, including Corsica; overseas polygons excluded. The question says “European territory”. |
| `clue-geo-300.svg` | Japan’s islands present at the dataset’s coarse scale. |
| `clue-geo-400.svg` | Iceland. |
| `clue-geo-500.svg` | New Zealand’s main islands in gold, Australia in grey; a regional view rather than a claim to show all outlying territories. |

## Fact-check references

These are host notes, not text to read out during the game. Questions use original wording; no song recordings, lyrics, movie stills or celebrity portraits were downloaded for the new categories. Existing film/cast/history sources are retained below; the expanded music, chronology, science, sport and outsider facts were checked against the linked primary sources on 22 September 2026.

### Famous Saras

- `fs-100`, Sarah Jessica Parker / Carrie Bradshaw: [Warner Bros. Discovery cast announcement](https://press.wbd.com/us/media-release/max/hbo-max-releases-and-just-first-look-image-production-begins-nyc).
- `fs-200`, Sarah Michelle Gellar / television Buffy: [Disney+ series page](https://www.disneyplus.com/browse/entity-f2c277c5-62b4-417c-b277-8435b70176dd). The clue distinguishes the television role from the earlier film.
- `fs-300`, Sara Bareilles / Love Song and Brave: [Sara Bareilles’ official documentary page](https://sarabmusic.com/pages/goodgriefdoc) names both songs.
- `fs-400`, Sarah Connor / Linda Hamilton: [Paramount’s Terminator: Dark Fate page](https://www.paramountpictures.com/movies/terminator-dark-fate).
- `fs-500`, Sarah Sjöström’s two Paris 2024 freestyle golds: [Swedish Olympic Committee athlete results](https://sok.se/idrottare/idrottare/s/sarah-sjostrom.html) lists first place at both 50 m and 100 m. The surname is enough; alternative Latin spellings are accepted.

### Geography and capitals

The silhouettes are derived from the country-labelled Natural Earth data above. The two-part final answer (New Zealand + Wellington) is confirmed by [Tourism New Zealand](https://www.newzealand.com/nz/feature/wellington-attractions/). No claim is made about precise coastline resolution or every offshore island being visible.

The Impostor’s capital clue uses [Tourism Australia — Australian Capital Territory](https://www.australia.com/en-gb/places/australian-capital-territory.html), [City of Ottawa](https://ottawa.ca/en/business/economic-development-services/economic-development/why-ottawa) and Tourism New Zealand. Sydney is the sole non-capital among the four options.

### The Roaring Twenties

- `rt-100`, Charleston: [Library of Congress — flappers](https://guides.loc.gov/chronicling-america-flappers).
- `rt-200`, speakeasy: [The Mob Museum’s Prohibition history](https://prohibition.themobmuseum.org/the-history/the-prohibition-underworld/the-speakeasies-of-the-1920s/).
- `rt-300`, talkies: [Library of Congress — sound in film](https://loc.gov/loc/lcib/08012/silent.html).
- `rt-400`, Fitzgerald’s 1925 novel: [Library of Congress — America Reads](https://loc.gov/exhibits/america-reads/1900-to-1949.html).
- `rt-500`, Norway’s spirits ban: [FHI historical overview](https://www.fhi.no/le/alkohol/alkoholinorge/alkohol-i-historien/historisk-oversikt-alkohol-i-norge-1816-2019/). Referendum: 1926; formal repeal: 1927. The fortified-wine ban ended separately in 1923. A “bootlegger licence” is not taught as historical fact.

### Bad Movie Plots

The descriptions are original comic paraphrases. Title variants in English/Norwegian are acceptable.

- `mp-100`, Titanic: [Paramount synopsis](https://www.paramountpictures.com/movies/titanic).
- `mp-200`, Home Alone: [20th Century Studios synopsis](https://family.20thcenturystudios.com/movies/home-alone).
- `mp-300`, Jurassic Park: [Universal synopsis and 1993 release](https://www.universalpicturesathome.com/movies/jurassic-park).
- `mp-400`, Finding Nemo: [Pixar’s story and character page](https://www.pixar.com/finding-nemo).
- `mp-500`, Inception: [Warner Bros. film page](https://www.warnerbros.com/movies/inception). The clue describes planting an idea inside dreams, rather than confusing it with stealing one. The prior research browser did not expose this page’s synopsis text.

### Name That Tune

This is a text-recognition category; no music playback is necessary and none is claimed.

- `nt-100`, Bohemian Rhapsody, Queen (1975): [Queen’s official history](https://www.queenonline.com/queen) and [Library of Congress recording essay](https://lcweb2.loc.gov/static/programs/national-recording-preservation-board/documents/Bohemian-Rhapsody_Breithaupt.pdf).
- `nt-200`, Dancing Queen, ABBA (1976): [ABBA’s official song history](https://abbasite.com/articles/dancing-queen/). The clue is a description of the title, not a quoted lyric.
- `nt-300`, …Baby One More Time: [Britney Spears’ official video](https://www.youtube.com/watch?v=C-u5WLJ9Yk4) and [official release](https://www.youtube.com/watch?v=91Niv2q4gvc). The school-corridor clue refers to the music video; no age guess is involved.
- `nt-400`, Take On Me: [a-ha’s official account of the pencil-sketch/live-action video](https://www.staging.a-ha.com/news/a-ha-reaches-one-billion-views-with-take-on-me).
- `nt-500`, Viva La Vida: [Coldplay’s account of the Kahlo painting that inspired the album name](https://timeline.coldplay.com/article/latin-america-tour/) and the [2008 single release](https://www.coldplay.com/release/viva-la-vida/). Song and album share the title.

### Before or After?

Every question specifies the event being compared. The country matters for release dates; the pack explicitly uses Japan for PlayStation and US cinemas for Toy Story. Teams only need “before” or “after”, not both dates.

| ID | Correct comparison | Sources |
| --- | --- | --- |
| `ba-100` | Shrek (2001) before the first iPhone unveiling (9 January 2007). | [DreamWorks](https://www.dreamworks.com/movies/shrek), [Apple announcement](https://www.apple.com/newsroom/2007/01/09Apple-Reinvents-the-Phone-with-iPhone/). |
| `ba-200` | Google incorporation (4 September 1998) after Titanic (1997). | [Google’s company account](https://blog.google/company-news/inside-google/company-announcements/marking-20ish-years-google/), [Paramount Titanic](https://www.paramountpictures.com/movies/titanic). The clue asks incorporation, not the start of the research project. |
| `ba-300` | Toy Story (22 November 1995) after Japanese PlayStation launch (3 December 1994). | [Pixar history](https://www.pixar.com/our-story), [PlayStation’s timeline](https://www.playstation.com/en-us/playstation-history/1994-ps-one/). |
| `ba-400` | First SMS (December 1992) before Jurassic Park (1993). | [Vodafone’s first-message account](https://www.vodafone.com/news/newsroom/technology/25-anniversary-text-message), [Universal](https://www.universalpicturesathome.com/movies/jurassic-park). |
| `ba-500` | Windows 95 on sale (24 August 1995) before Toy Story in US cinemas (22 November 1995). | [Microsoft anniversary](https://blogs.windows.com/windows-insider/2020/08/24/looking-back-the-25th-anniversary-of-windows-95/), [Pixar history](https://www.pixar.com/our-story). |

### Hold My Drink

- `ps-100`, carbon dioxide in sparkling wine: [Champagne research published by the American Chemical Society](https://www.acs.org/content/dam/acsorg/avweb/1c2web3536/champagnepouring.pdf).
- `ps-200`, condensation on a cold glass: [US Geological Survey](https://www.usgs.gov/water-science-school/science/condensation-and-water-cycle).
- `ps-300`, melting floating ice in plain water: [NASA’s explanation](https://sealevel.nasa.gov/news/261/melting-ocean-ice-affects-sea-level-unlike-ice-cubes-in-a-glass/). The question explicitly excludes evaporation/thermal expansion and does not generalise the result to fresh ice floating in salt water.
- `ps-400`, chilled sparkling wine retains more gas when poured: the [ACS research paper](https://www.acs.org/content/dam/acsorg/avweb/1c2web3536/champagnepouring.pdf) compares temperature-dependent CO₂ losses. This is about gas retention, not health or alcohol effects.
- `ps-500`, topspin: [NASA Glenn’s spinning-ball force explanation](https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/lift-of-a-baseball/) and [curveball pressure explanation](https://www.grc.nasa.gov/WWW/K-12/FoilSim/Manual/fsim000x.htm). Applying the stated spin/flow relationship to topspin gives the downward aerodynamic force in the clue. The direction, not the term “Magnus effect”, earns the points.

### The Impostor

- `im-100`, Bond actors: [official 007 film catalogue](https://www.007.com/the-films/). Matt Damon’s Bourne role is confirmed by [Universal](https://www.universalpictures.com/movies/jason-bourne).
- `im-200`, capitals: see Geography and capitals above.
- `im-300`, Nobel fields: [Nobel Prize organisation](https://www.nobelprize.org/about/). Mathematics is not a listed prize category. No speculative story about why is included.
- `im-400`, coastlines: [Portugal’s national tourism organisation](https://www.visitportugal.com/en/content/beaches) identifies its coast as Atlantic. Italy, Greece and Egypt have Mediterranean coastlines in the Natural Earth geography above.
- `im-500`, Champagne’s three main grapes: [Comité Champagne](https://www.champagne.fr/en/about-champagne/a-great-blended-wine/champagne-and-its-grape-varieties). The wording says “main”, not “only”, because other varieties are authorised too. Merlot is the outsider among the four options.

## Limits

The public static pack exposes its answers in source code. It is rehearsal content, not a protected party vault. Real guest stories and unrevealed final assets belong in a private host pack. The two personal columns still need eight completed entries; this expansion does not claim to have generated their missing images or obtained personal answers. Difficulty and name recognition should be rehearsed with this particular guest group.
