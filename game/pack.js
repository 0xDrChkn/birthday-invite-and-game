/* Public rehearsal pack. Keep private guest stories out of this file.
 * All text fields accept { en, nb }; image paths are relative to /game/.
 * A draft clue is intentionally unavailable until its answer is verified.
 */
(() => {
  'use strict';
  const text = (en, nb = en) => ({ en, nb });
  const draft = (id, value, question, norwegian) => ({
    id, value, draft: true,
    question: text(question, norwegian),
    answer: text('Add a host-confirmed answer before playing.', 'Legg inn et svar bekreftet av verten før dere spiller.')
  });

  window.BIRTHDAY_GAME_PACK = {
    id: 'sara-rehearsal-v1',
    title: text('The Sara Show', 'Sara-showet'),
    subtitle: text('A roaring birthday quiz', 'En bursdagsquiz med stil'),
    categories: [
      {
        id: 'famous-saras',
        title: text('Famous Saras', 'Kjente Saraer'),
        description: text('Real Saras. Fictional Sarahs. The extra H is allowed.', 'Virkelige Saraer og fiktive Saraher. En ekstra H er lov.'),
        clues: [
          { id: 'fs-100', value: 100, question: text('Which Sarah plays Carrie Bradshaw in Sex and the City?', 'Hvilken Sarah spiller Carrie Bradshaw i Sex og singelliv?'), answer: text('Sarah Jessica Parker') },
          { id: 'fs-200', value: 200, question: text('Which Sarah played Buffy in the television series Buffy the Vampire Slayer?', 'Hvilken Sarah spilte Buffy i TV-serien Buffy the Vampire Slayer?'), answer: text('Sarah Michelle Gellar') },
          { id: 'fs-300', value: 300, question: text('Name the fictional Sarah played by Linda Hamilton in the Terminator films.', 'Hva heter den fiktive Sarah som Linda Hamilton spiller i Terminator-filmene?'), answer: text('Sarah Connor') },
          { id: 'fs-400', value: 400, question: text('Which Sarah played prosecutor Marcia Clark in The People v. O.J. Simpson: American Crime Story?', 'Hvilken Sarah spilte aktor Marcia Clark i The People v. O.J. Simpson: American Crime Story?'), answer: text('Sarah Paulson') },
          { id: 'fs-500', value: 500, question: text('Sofie Gråbøl plays this Danish detective in The Killing / Forbrydelsen. What is her full name?', 'Sofie Gråbøl spiller denne danske etterforskeren i Forbrydelsen. Hva er hennes fulle navn?'), answer: text('Sarah Lund') }
        ]
      },
      {
        id: 'birthday-girl',
        title: text('The Birthday Girl', 'Bursdagsbarnet'),
        description: text('Sara takes over the big screen. Name the original star.', 'Sara tar over lerretet. Hvem var den opprinnelige stjernen?'),
        clues: [
          { id: 'bg-100', value: 100, question: text('Sara has borrowed an iconic Gatsby toast. Which actor raised the glass in the 2013 film?', 'Sara har lånt en ikonisk Gatsby-skål. Hvilken skuespiller løftet glasset i filmen fra 2013?'), answer: text('Leonardo DiCaprio'), image: 'assets/clue-bg-100.jpg', imageAlt: text('Sara raising a glass in a recreated film scene.', 'Sara løfter et glass i en gjenskapt filmscene.') },
          draft('bg-200', 200, 'Celebrity mashup — image and accepted answer needed.', 'Kjendismiks — bilde og godkjent svar mangler.'),
          draft('bg-300', 300, 'Celebrity mashup — image and accepted answer needed.', 'Kjendismiks — bilde og godkjent svar mangler.'),
          draft('bg-400', 400, 'Celebrity mashup — image and accepted answer needed.', 'Kjendismiks — bilde og godkjent svar mangler.'),
          draft('bg-500', 500, 'Celebrity mashup — image and accepted answer needed.', 'Kjendismiks — bilde og godkjent svar mangler.')
        ]
      },
      {
        id: 'countries',
        title: text('What’s That Country?', 'Hvilket land?'),
        description: text('A little geography. No passport required.', 'Litt geografi. Pass er ikke nødvendig.'),
        clues: [
          { id: 'geo-100', value: 100, question: text('Paris. The Eiffel Tower. Which country are we in?', 'Paris. Eiffeltårnet. Hvilket land er vi i?'), answer: text('France', 'Frankrike') },
          { id: 'geo-200', value: 200, question: text('This European country is famously shaped like a boot. Name it.', 'Dette europeiske landet er kjent for å ligne en støvel. Hvilket land?'), answer: text('Italy', 'Italia') },
          { id: 'geo-300', value: 300, question: text('Tokyo, Kyoto and Mount Fuji are all in which country?', 'Tokyo, Kyoto og Fuji-fjellet ligger alle i hvilket land?'), answer: text('Japan') },
          { id: 'geo-400', value: 400, question: text('Reykjavík is the capital of which country?', 'Reykjavík er hovedstaden i hvilket land?'), answer: text('Iceland', 'Island') },
          { id: 'geo-500', value: 500, question: text('Its capital is Canberra — not Sydney. Which country?', 'Hovedstaden er Canberra — ikke Sydney. Hvilket land?'), answer: text('Australia') }
        ]
      },
      {
        id: 'twenties',
        title: text('The Roaring Twenties', 'De glade 20-årene'),
        description: text('Gatsby, questionable parties and actual history.', 'Gatsby, tvilsomme fester og ekte historie.'),
        clues: [
          { id: 'rt-100', value: 100, question: text('During US Prohibition, what was an illegal bar commonly called?', 'Hva ble en ulovlig bar vanligvis kalt under forbudstiden i USA?'), answer: text('A speakeasy.', 'En speakeasy.') },
          { id: 'rt-200', value: 200, question: text('Silent films found their voices. What English nickname was given to films with spoken dialogue?', 'Stumfilmen fikk en stemme. Hvilket engelsk kallenavn fikk filmer med talt dialog?'), answer: text('Talkies.') },
          { id: 'rt-300', value: 300, question: text('Which dance belongs at a 1920s party: the Charleston, the Macarena or the moonwalk?', 'Hvilken dans passer på en 1920-tallsfest: charleston, macarena eller moonwalk?'), answer: text('The Charleston.', 'Charleston.') },
          { id: 'rt-400', value: 400, question: text('Before Leonardo raised his glass, who wrote the 1925 novel The Great Gatsby?', 'Før Leonardo løftet glasset: Hvem skrev romanen The Great Gatsby fra 1925?'), answer: text('F. Scott Fitzgerald. Accept Fitzgerald.', 'F. Scott Fitzgerald. Godta Fitzgerald.') },
          { id: 'rt-500', value: 500, question: text('Norway had a spirits ban too. Was it formally repealed in 1923, 1927 or 1933?', 'Norge hadde også brennevinsforbud. Ble det formelt opphevet i 1923, 1927 eller 1933?'), answer: text('1927. The referendum was in 1926; formal repeal followed in 1927.', '1927. Folkeavstemningen var i 1926; forbudet ble formelt opphevet i 1927.') }
        ]
      },
      {
        id: 'sara-archives',
        title: text('The Sara Archives', 'Sara-arkivet'),
        description: text('The real stories behind the photographs.', 'De ekte historiene bak bildene.'),
        clues: [
          { id: 'sa-100', value: 100, question: text('Before tonight’s party, Sara had a different kind of game face. Which sport did she play?', 'Før kveldens fest hadde Sara et helt annet konkurranseansikt. Hvilken idrett drev hun med?'), answer: text('Table tennis. Accept ping-pong.', 'Bordtennis. Godta pingpong.'), image: 'assets/clue-sa-100.jpg', imageAlt: text('A photograph from Sara’s sporting days.', 'Et bilde fra Saras idrettsdager.') },
          draft('sa-200', 200, 'Where was this taken? Add a photo and its confirmed location.', 'Hvor ble dette tatt? Legg inn et bilde og et bekreftet sted.'),
          draft('sa-300', 300, 'Who said it? Add a real Sara quote with a confirmed source.', 'Hvem sa det? Legg inn et ekte Sara-sitat med bekreftet kilde.'),
          draft('sa-400', 400, 'What happened next? Add a guest story and its real ending.', 'Hva skjedde så? Legg inn en gjestehistorie og den ekte slutten.'),
          draft('sa-500', 500, 'The deep cut. Add a host-approved story for the final clue.', 'For de innvidde. Legg inn en historie verten har godkjent.')
        ]
      },
      {
        id: 'movie-plots',
        title: text('Bad Movie Plots', 'Dårlige filmreferat'),
        description: text('Good films. Deeply unhelpful descriptions.', 'Gode filmer. Håpløse beskrivelser.'),
        clues: [
          { id: 'mp-100', value: 100, question: text('A couple’s new relationship hits an iceberg. Name the 1997 film.', 'Et helt nytt forhold treffer et isfjell. Hvilken film fra 1997?'), answer: text('Titanic.') },
          { id: 'mp-200', value: 200, question: text('The family goes to France. Their forgotten child stays home and becomes a burglar’s worst Christmas present.', 'Familien drar til Frankrike. Barnet de glemte hjemme blir innbruddstyvenes verste julegave.'), answer: text('Home Alone (1990).', 'Alene hjemme / Home Alone (1990).') },
          { id: 'mp-300', value: 300, question: text('In this 1993 film, a dinosaur theme park discovers that its attractions also enjoy the visitors.', 'I denne filmen fra 1993 oppdager en dinosaurpark at attraksjonene også setter pris på gjestene.'), answer: text('Jurassic Park.') },
          { id: 'mp-400', value: 400, question: text('An anxious fish crosses the ocean with a very forgetful stranger because his son has ended up at the dentist.', 'En engstelig fisk krysser havet med en svært glemsk fremmed fordi sønnen har havnet hos tannlegen.'), answer: text('Finding Nemo.', 'Oppdrag Nemo / Finding Nemo.') },
          { id: 'mp-500', value: 500, question: text('A team breaks into a man’s dreams to plant a business idea. The meeting could have been an email.', 'Et team bryter seg inn i en manns drømmer for å plante en forretningsidé. Møtet kunne vært en e-post.'), answer: text('Inception.') }
        ]
      }
    ],
    reactions: {
      correct: ['assets/reaction-01.webp', 'assets/reaction-02.webp', 'assets/reaction-03.webp', 'assets/reaction-04.webp'],
      wrong: ['assets/reaction-05.webp', 'assets/reaction-06.webp', 'assets/reaction-07.webp', 'assets/reaction-08.webp']
    }
  };
})();
