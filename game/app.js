(() => {
  'use strict';
  const engine = window.BirthdayGameEngine;
  const publicPack = window.BIRTHDAY_GAME_PACK;
  let pack = publicPack;
  let privatePack = null;
  const packTools = window.BirthdayGamePackTools;
  const trustedImages = publicPack.categories.flatMap(category => category.clues.flatMap(clue => [clue.image,clue.answerImage].filter(Boolean)));
  const $ = selector => document.querySelector(selector);
  const STORE = 'birthday-game:' + pack.id + ':v1';
  const session = window.BirthdayGameSessionStore.create(() => window.localStorage, STORE);
  const initialSave = session.read();
  const clueDialog = $('#clue-dialog');
  const reactionDialog = $('#reaction-dialog');
  const english = {};
  document.querySelectorAll('[data-copy]').forEach(node => { english[node.dataset.copy] = node.innerHTML; });
  const norwegian = {
    privateTitle:'Klargjør en privat spørsmålspakke', privateHint:'Last ned spørsmålsbanken som JSON, rediger spørsmålene og svarene, og importer den her. Den blir i denne nettleseren; ingenting lastes opp til invitasjonen. Behold en kopi på laptopen.', privateFormat:'6–12 kategorier med fem spørsmål hver. Maks 2 MB, inkludert innebygde PNG-, JPG- eller WebP-bilder. De to Sara-reaksjonene beholdes.', exportPack:'Last ned spørsmålsbanken', importPack:'Importer privat JSON', defaultPack:'Bruk den offentlige spørsmålsbanken',
    timerSetting:'Sekunder per spørsmål', timerHint:'Start klokken når dere er klare. Tiden endrer aldri poengsummen.', chooseBoard:'Velg brettet ↓',
    categoryEyebrow:'SPØRSMÅLSBANKEN', chooseSix:'Velg seks kategorier.', categoryHint:'Et fullt brett har 30 spørsmål. Uferdige personlige spørsmål er låst til de er klargjort.', recommended:'Bruk de seks anbefalte',
    adjustScores:'Juster poeng', adjustHint:'Rett en poengsum eller gi en bonus etter husreglene. Hver endring har en begrunnelse og kan angres.', adjustTeam:'Lag', adjustAmount:'Poeng som legges til eller trekkes fra', adjustReason:'Begrunnelse', applyCorrection:'Bruk endringen',
    how:'Slik spiller dere', edition:'SPILLKVELD I GATSBYS ÅND', setupTitle:'Litt vennskapelig<br><em>konkurranse.</em>',
    setupIntro:'Seks kategorier. Favorittmenneskene dine. Og Sara, som følger med på poengene.',
    points:'POENG PER SPØRSMÅL', teams:'LAG RUNDT BORDET', host:'VERT MED KONTROLL',
    starter:'Bygg brettet fra kategoribanken. Velg seks ferdige kategorier, eller ta med Saras personlige runder når de er klare.',
    guestList:'KONKURRENTENE', nameTeams:'Hva heter lagene?', removeTeam:'− Fjern lag', addTeam:'+ Legg til lag',
    begin:'La spillet begynne', localSave:'Spillet lagres i denne nettleseren, så festen tåler en oppdatering.',
    reactionEyebrow:'SARA HAR EN REAKSJON PÅ DET', reactionTitle:'Riktig? Feil? Hun sier fra.',
    reactionHint:'Trykk på et bilde for å prøve reaksjonene.', boardEyebrow:'TJUEÅRENE OM IGJEN · SPILLET',
    boardTitle:'Sara-quizen<span class="gold">.</span>', undo:'↶ Angre', newGame:'Nytt spill',
    boardHint:'Velg et lag ovenfor, og deretter et spørsmål. Verten avgjør hvem som får poeng.',
    footer:'PENT ANTREKK. VENNSKAPELIG RIVALISERING.', backInvite:'Tilbake til invitasjonen ↗',
    answerLabel:'SVARET', startTimer:'Start klokken', reveal:'Vis svaret', answering:'HVEM SVARER?',
    wrong:'Feil', correct:'Riktig', finish:'Avslutt spørsmålet →', continue:'Fortsett →',
    hostNotes:'TIL VERTEN', rule1:'Koble laptopen til TV-en. Lag to til seks lag og skriv inn lagnavnene.',
    rule2:'Et lag velger kategori og poeng. Åpne spørsmålet, velg laget som svarer, og start eventuelt klokken.',
    rule3:'Gi eller trekk fra poengene. Etter et feil svar kan et annet lag prøve. Vis svaret når dere er klare.',
    rule4:'Avslutt spørsmålet for å markere det som spilt. Angre retter en poengfeil, også etter at du har gått tilbake til brettet.',
    draftHelp:'Ruter merket «Må klargjøres» trenger personlige spørsmål eller bilder. De kan ikke åpnes før innholdet er lagt inn.',
    understood:'Skjønner', newRound:'EN NY START', resetTitle:'Starte et nytt spill?',
    resetBody:'Dette nullstiller poengene og spilte spørsmål i denne nettleseren. Spørsmålspakken beholdes.',
    keepPlaying:'Fortsett spillet', resetConfirm:'Start nytt spill',
    conflictTitle:'Spillet er endret i en annen fane.', conflictBody:'Denne fanen er satt på pause for å beskytte de nyeste poengene. Last inn det lagrede spillet på nytt før du fortsetter.', reloadGame:'Last inn nyeste spill'
  };
  const ui = {
    en:{team:'Team',draft:'To prepare',played:'Played',done:'clues played',paused:'Resume timer',pause:'Pause',start:'Start timer',time:'Time’s up',on:'Sara reactions: on',off:'Sara reactions: off',pick:'Choose the answering team.',tried:'This team has already tried. Choose another team or undo.',resolved:'Points awarded. Finish the clue when ready.',wrong:'Another team can try, or reveal the answer.',savedError:'This browser cannot save your game. Keep this page open to retain your scores.',restoreError:'The saved game could not be restored with this question pack. Start a new game below.',names:'Give each team a different name (1–40 characters).',error:'That action could not be completed. Please try again.',fullscreen:'Full screen is unavailable here. You can use your browser’s full-screen control.',preview:'Reaction preview',correct:'CORRECT ANSWER',incorrect:'WRONG ANSWER',winner:'THE WINNING TEAM',tie:'HONOURS SHARED',points:'points',back:'Return to board',close:'Close',seconds:'Seconds remaining',resetTimer:'Reset timer',reaction:'Sara reaction',image:'Picture clue',selected:'Selected',timerEnded:'Time is up. The host decides whether to accept an answer.'},
    nb:{team:'Lag',draft:'Må klargjøres',played:'Spilt',done:'spørsmål spilt',paused:'Fortsett klokken',pause:'Pause',start:'Start klokken',time:'Tiden er ute',on:'Sara-reaksjoner: på',off:'Sara-reaksjoner: av',pick:'Velg laget som svarer.',tried:'Dette laget har allerede prøvd. Velg et annet lag eller angre.',resolved:'Poengene er gitt. Avslutt spørsmålet når dere er klare.',wrong:'Et annet lag kan prøve, eller du kan vise svaret.',savedError:'Nettleseren kan ikke lagre spillet. Hold siden åpen for å beholde poengene.',restoreError:'Det lagrede spillet kunne ikke hentes med denne spørsmålspakken. Start et nytt spill nedenfor.',names:'Gi hvert lag et eget navn (1–40 tegn).',error:'Handlingen kunne ikke fullføres. Prøv igjen.',fullscreen:'Fullskjerm er ikke tilgjengelig her. Bruk nettleserens fullskjermfunksjon.',preview:'Prøv en reaksjon',correct:'RIKTIG SVAR',incorrect:'FEIL SVAR',winner:'VINNERLAGET',tie:'DELT SEIER',points:'poeng',back:'Tilbake til brettet',close:'Lukk',seconds:'Sekunder igjen',resetTimer:'Nullstill klokken',reaction:'Sara reagerer',image:'Bildespørsmål',selected:'Valgt',timerEnded:'Tiden er ute. Verten avgjør om svaret godtas.'}
  };
  Object.assign(ui.en, {packLoaded:'Private pack loaded. Choose six categories below.', packFailed:'The pack could not be loaded. Check the JSON format, category IDs, five clue values per category and embedded images (maximum 2 MB). Your previous bank is unchanged.', selectedCategories:'categories selected', ready:'ready', unfinished:'to prepare', chooseSix:'Choose exactly six categories to start.', adjustmentError:'Enter a non-zero whole number and a short reason.', adjustments:'Recent corrections', accepts:'Also accept', context:'For the host'});
  Object.assign(ui.nb, {packLoaded:'Privat pakke lastet inn. Velg seks kategorier nedenfor.', packFailed:'Pakken kunne ikke lastes inn. Sjekk JSON-formatet, kategori-ID-ene, fem poengverdier per kategori og innebygde bilder (maks 2 MB). Den forrige banken er uendret.', selectedCategories:'kategorier valgt', ready:'klare', unfinished:'må klargjøres', chooseSix:'Velg nøyaktig seks kategorier for å starte.', adjustmentError:'Skriv inn et heltall som ikke er null, og en kort begrunnelse.', adjustments:'Siste endringer', accepts:'Godta også', context:'Til verten'});
  const timerDurations = [15,30,45,60,90,120];
  const defaultCategories = () => (pack.defaultCategoryIds || pack.categories.slice(0,6).map(category => category.id)).slice();
  let selectedCategoryIds = defaultCategories();
  let timerDuration = 45;
  let language = 'en';
  let state = null;
  let names = ['The Bootleggers', 'Champagne Problems', 'The Old Sports'];
  let reactionsEnabled = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let reactionIndex = {correct:0,wrong:0};
  let effectIndex = {correct:0,wrong:0};
  const reactionEffects = {correct:['pop','float','swing'],wrong:['shake','drop','wobble']};
  let reactionTimeout = null;
  let timer = {clueId:null,remaining:timerDuration,running:false,deadline:0};
  let timerInterval = null;
  let storageFailed = initialSave.status === 'unavailable';
  let restoreFailed = false;
  let notice = '';
  const clues = new Map();
  function indexClues() {
    clues.clear();
    pack.categories.forEach(category => category.clues.forEach(clue => clues.set(clue.id, { ...clue, category })));
  }
  const text = value => typeof value === 'string' ? value : value?.[language] || value?.en || '';
  const copy = () => ui[language];
  const element = (tag, className, value) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (value !== undefined) node.textContent = value;
    return node;
  };
  function lockConflictedSession() {
    pauseTimer();
    clearTimeout(reactionTimeout);
    document.querySelectorAll('dialog[open]').forEach(dialog => {
      if (dialog.id !== 'conflict-dialog') dialog.close();
    });
    $('.game-shell').inert = true;
    if (!$('#conflict-dialog').open) $('#conflict-dialog').showModal();
  }
  function checkSession() {
    const result = session.check();
    if (result.status === 'conflict') { lockConflictedSession(); return false; }
    storageFailed = result.status === 'unavailable';
    return true;
  }
  function save() {
    try {
      const result = session.write(JSON.stringify({state,language,reactionsEnabled,selectedCategoryIds,timerDuration,privatePack,timer:{clueId:timer.clueId,remaining:timer.remaining}}));
      if (result.status === 'conflict') { lockConflictedSession(); return; }
      storageFailed = result.status === 'unavailable';
    } catch { storageFailed = true; }
    renderNotice();
  }
  try {
    const saved = JSON.parse(initialSave.raw || 'null');
    if (saved) {
      if (saved.privatePack) {
        privatePack = packTools.parse(JSON.stringify(saved.privatePack),trustedImages);
        pack = {...privatePack,reactions:publicPack.reactions};
        selectedCategoryIds = defaultCategories();
      }
      language = saved.language === 'nb' ? 'nb' : 'en';
      if (timerDurations.includes(saved.timerDuration)) timerDuration = saved.timerDuration;
      timer.remaining = timerDuration;
      if (Array.isArray(saved.selectedCategoryIds) && saved.selectedCategoryIds.length <= 6 && new Set(saved.selectedCategoryIds).size === saved.selectedCategoryIds.length && saved.selectedCategoryIds.every(id => pack.categories.some(category => category.id === id))) selectedCategoryIds = saved.selectedCategoryIds.slice();
      if (typeof saved.reactionsEnabled === 'boolean') reactionsEnabled = saved.reactionsEnabled;
      if (saved.state) {
        state = engine.restore(saved.state, pack);
        restoreFailed = !state;
        if (state) { names = state.teams.map(team => team.name); selectedCategoryIds = state.categoryIds.slice(); }
      }
      if (state?.currentClueId && saved.timer?.clueId === state.currentClueId && Number.isInteger(saved.timer.remaining) && saved.timer.remaining >= 0 && saved.timer.remaining <= timerDuration) timer = {...timer,clueId:saved.timer.clueId,remaining:saved.timer.remaining};
    }
  } catch { restoreFailed = true; }
  indexClues();
  function renderNotice() {
    $('#notice').textContent = storageFailed ? copy().savedError : restoreFailed ? copy().restoreError : notice;
  }
  function renderLocale() {
    document.documentElement.lang = language;
    document.title = language === 'nb' ? 'Sara-quizen · Bursdagsspillet' : 'The Sara quiz · The birthday game';
    document.querySelectorAll('[data-copy]').forEach(node => {
      // Only these source-controlled interface strings contain HTML; guest names use textContent.
      node.innerHTML = language === 'nb' ? norwegian[node.dataset.copy] || english[node.dataset.copy] : english[node.dataset.copy];
    });
    $('#language').textContent = language === 'en' ? 'NO' : 'EN';
    $('#language').ariaLabel = language === 'en' ? 'Bytt til norsk' : 'Switch to English';
    $('#fullscreen').ariaLabel = language === 'en' ? 'Full screen' : 'Fullskjerm';
    $('#clue-cancel').ariaLabel = copy().back;
    $('#timer-reset').ariaLabel = copy().resetTimer;
    $('#timer-value').ariaLabel = copy().seconds;
    $('#reaction-image').alt = copy().reaction;
    document.querySelectorAll('[data-close]').forEach(button => { if (button.textContent === '×') button.ariaLabel = copy().close; });
  }
  function readNames() { names = [...$('#team-inputs').querySelectorAll('input')].map(input => input.value); }
  function renderSetup() {
    $('#team-inputs').replaceChildren(...names.map((name,index) => {
      const label = element('label','team-label',copy().team + ' ' + (index+1));
      const input = element('input');
      input.name = 'team-' + (index+1); input.value = name; input.required = true; input.maxLength = 40; input.autocomplete = 'off';
      label.append(input);
      return label;
    }));
    $('#timer-duration').value = String(timerDuration);
    renderCategories();
    $('#remove-team').disabled = names.length <= 2;
    $('#add-team').disabled = names.length >= 6;
  }
  function renderCategories() {
    $('#pack-default').hidden = !privatePack;
    $('#category-options').replaceChildren(...pack.categories.map(category => {
      const label = element('label','category-option');
      const input = element('input'); input.type = 'checkbox'; input.value = category.id;
      input.checked = selectedCategoryIds.includes(category.id);
      input.disabled = selectedCategoryIds.length >= 6 && !input.checked;
      const ready = category.clues.filter(clue => !clue.draft && text(clue.question) && text(clue.answer)).length;
      const title = element('strong','',text(category.title));
      label.append(input,title,element('small','',text(category.description)),element('span','ready-count',ready + ' / ' + category.clues.length + ' ' + copy().ready));
      input.addEventListener('change', () => {
        if (!checkSession()) return;
        selectedCategoryIds = input.checked ? selectedCategoryIds.concat(category.id) : selectedCategoryIds.filter(id => id !== category.id);
        save(); renderCategories();
        $('#category-options').querySelector('input[value="' + CSS.escape(category.id) + '"]')?.focus({preventScroll:true});
      });
      return label;
    }));
    const chosen = pack.categories.filter(category => selectedCategoryIds.includes(category.id));
    const ready = chosen.flatMap(category => category.clues).filter(clue => !clue.draft && text(clue.question) && text(clue.answer)).length;
    const total = chosen.reduce((count,category) => count + category.clues.length,0);
    $('#category-count').textContent = selectedCategoryIds.length + ' / 6 ' + copy().selectedCategories + ' · ' + ready + ' ' + copy().ready + (total > ready ? ' · ' + (total-ready) + ' ' + copy().unfinished : '');
    $('#start-game').disabled = selectedCategoryIds.length !== 6;
  }
  function renderAdjustments() {
    $('#adjust-team').replaceChildren(...state.teams.map(team => {
      const option = element('option','',team.name + ' · ' + team.score); option.value = team.id; return option;
    }));
    $('#adjust-team').value = state.selectedTeamId || state.teams[0].id;
    const recent = state.history.filter(event => event.type === 'adjust').slice(-5).reverse();
    $('#adjust-history').replaceChildren(...(recent.length ? [element('p','eyebrow',copy().adjustments),...recent.map(event => {
      const row = element('p');
      row.append(element('strong','',state.teams.find(team => team.id === event.teamId).name + ' ' + (event.amount > 0 ? '+' : '') + event.amount), document.createTextNode(' · ' + event.reason));
      return row;
    })] : []));
  }
  function renderGallery() {
    const stickers = ['correct','wrong'].flatMap(kind => (pack.reactions[kind] || []).map((src,index) => ({kind,src,index})));
    $('#reaction-gallery').replaceChildren(...stickers.map(({kind,src,index}) => {
      const button = element('button','sticker-button'); button.type = 'button';
      button.ariaLabel = copy().preview + ': ' + (kind === 'correct' ? copy().correct : copy().incorrect) + ' ' + (index+1);
      const image = element('img'); image.src = src; image.alt = ''; image.loading = 'lazy'; button.append(image);
      button.addEventListener('click',() => showReaction(kind, null, null, src));
      return button;
    }));
  }
  function renderScoreboard() {
    $('#scoreboard').style.setProperty('--team-count',state.teams.length);
    $('#scoreboard').replaceChildren(...state.teams.map(team => {
      const button = element('button','team-score'); button.type = 'button';
      button.setAttribute('aria-pressed',String(state.selectedTeamId === team.id));
      button.append(element('span','team-name',team.name),element('strong','',String(team.score)));
      button.addEventListener('click',() => act('selectTeam',team.id));
      return button;
    }));
  }
  function renderBoard() {
    $('#board').replaceChildren(...state.categoryIds.map((id,index) => {
      const category = pack.categories.find(item => item.id === id);
      const column = element('section','category-column');
      const heading = element('div','category-heading');
      heading.append(element('span','',String(index+1).padStart(2,'0')),element('h2','',text(category.title)));
      column.append(heading);
      category.clues.forEach(clue => {
        const playable = engine.getClue(state,clue.id)?.playable;
        const used = state.completedClueIds.includes(clue.id);
        const button = element('button','clue-tile' + (used ? ' used' : !playable ? ' draft' : ''),used ? '◇' : String(clue.value));
        button.type = 'button'; button.disabled = used || !playable;
        button.dataset.clue = clue.id;
        button.ariaLabel = text(category.title) + ' · ' + clue.value + (used ? ' · ' + copy().played : !playable ? ' · ' + copy().draft : '');
        if (!playable) button.append(element('small','',copy().draft));
        button.addEventListener('click',() => act('openClue',clue.id));
        column.append(button);
      });
      return column;
    }));
    const total = state.clueCatalog.filter(clue => clue.playable).length;
    $('#progress').textContent = state.completedClueIds.length + ' / ' + total + ' ' + copy().done;
    $('#undo').disabled = !engine.canUndo(state);
    $('#reactions-toggle').textContent = reactionsEnabled ? copy().on : copy().off;
    $('#reactions-toggle').setAttribute('aria-pressed',String(reactionsEnabled));
    $('#standings').hidden = !engine.isComplete(state);
    if (engine.isComplete(state)) {
      const top = Math.max(...state.teams.map(team => team.score));
      const winners = state.teams.filter(team => team.score === top);
      $('#standings').replaceChildren(element('p','eyebrow',winners.length > 1 ? copy().tie : copy().winner),element('h2','',winners.map(team => team.name).join(' & ')),element('p','',top + ' ' + copy().points));
    }
  }
  function renderTimer() {
    $('#timer-value').textContent = String(timer.remaining).padStart(2,'0');
    $('#timer-toggle').textContent = timer.remaining === 0 ? copy().time : timer.running ? copy().pause : timer.remaining < timerDuration ? copy().paused : copy().start;
    $('#timer-toggle').disabled = timer.remaining === 0 || !!state?.resolved;
    $('#timer-reset').disabled = !!state?.resolved;
  }
  function pauseTimer() {
    if (timer.running) timer.remaining = Math.max(0,Math.ceil((timer.deadline-Date.now())/1000));
    timer.running = false;
    clearInterval(timerInterval); timerInterval = null;
    renderTimer();
  }
  function renderClue() {
    if (!state.currentClueId) {
      pauseTimer();
      if (clueDialog.open) clueDialog.close();
      return;
    }
    const clue = clues.get(state.currentClueId);
    if (timer.clueId !== clue.id) { pauseTimer(); timer = {clueId:clue.id,remaining:timerDuration,running:false,deadline:0}; }
    $('#clue-category').textContent = text(clue.category.title);
    $('#clue-value').textContent = clue.value;
    $('#clue-question').textContent = text(clue.question);
    const image = $('#clue-image');
    image.hidden = !clue.image; $('#clue-stage').classList.toggle('has-image',!!clue.image);
    if (clue.image) { if (image.getAttribute('src') !== clue.image) image.src = clue.image; image.alt = text(clue.imageAlt) || copy().image; } else image.removeAttribute('src');
    $('#answer').hidden = !state.revealed;
    $('#answer-text').textContent = state.revealed ? text(clue.answer) : '';
    const extra = [clue.acceptedAnswers && copy().accepts + ': ' + (Array.isArray(clue.acceptedAnswers) ? clue.acceptedAnswers.map(text).join(' · ') : text(clue.acceptedAnswers)), text(clue.explanation), text(clue.hostNote)].filter(Boolean).join('\n');
    const answerImage = $('#answer-image');
    answerImage.hidden = !state.revealed || !clue.answerImage;
    if (state.revealed && clue.answerImage) { answerImage.src=clue.answerImage; answerImage.alt=text(clue.answer); } else answerImage.removeAttribute('src');
    $('#answer-extra').textContent = state.revealed ? extra : '';
    $('#answer-extra').hidden = !state.revealed || !extra;
    $('#reveal').disabled = state.revealed;
    $('#clue-teams').replaceChildren(...state.teams.map(team => {
      const attempt = state.attempts.find(a => a.clueId === clue.id && a.teamId === team.id);
      const button = element('button','clue-team',team.name + (attempt ? ' · ' + (attempt.sign > 0 ? '+' : '−') + attempt.value : '')); button.type='button';
      button.setAttribute('aria-pressed',String(team.id === state.selectedTeamId));
      button.addEventListener('click',() => act('selectTeam',team.id)); return button;
    }));
    const tried = state.attempts.some(a => a.clueId === clue.id && a.teamId === state.selectedTeamId);
    $('#correct').disabled = $('#wrong').disabled = !state.selectedTeamId || tried || state.resolved;
    $('#plus-value').textContent = '+' + clue.value; $('#minus-value').textContent = '−' + clue.value;
    $('#clue-status').textContent = state.resolved ? copy().resolved : !state.selectedTeamId ? copy().pick : tried ? copy().tried : timer.remaining === 0 ? copy().timerEnded : '';
    $('#clue-undo').disabled = !engine.canUndo(state);
    renderTimer();
    if (!clueDialog.open) clueDialog.showModal();
  }
  function render() {
    if (session.hasConflict()) { lockConflictedSession(); return; }
    document.body.classList.toggle('playing',!!state);
    $('#setup').hidden = !!state; $('#play').hidden = !state;
    if (state) { renderScoreboard(); renderBoard(); renderClue(); }
    renderNotice();
  }
  function act(action,...args) {
    if (!checkSession()) return false;
    try {
      if (['finishClue','cancelClue','reveal','undo'].includes(action)) pauseTimer();
      state = engine[action](state,...args);
      notice = ''; restoreFailed = false; save(); render(); return !session.hasConflict();
    } catch (error) {
      notice = ['invalid_name','duplicate_name','invalid_teams'].includes(error.code) ? copy().names : copy().error;
      renderNotice();
      if (clueDialog.open) $('#clue-status').textContent = notice;
      return false;
    }
  }
  function showReaction(kind,value,team,src) {
    pauseTimer(); clearTimeout(reactionTimeout);
    const list = pack.reactions[kind] || [];
    const image = src || list[reactionIndex[kind]++ % list.length];
    if (!image) return;
    reactionDialog.classList.toggle('wrong',kind === 'wrong');
    reactionDialog.dataset.effect = reactionEffects[kind][effectIndex[kind]++ % reactionEffects[kind].length];
    $('#reaction-heading').textContent = kind === 'correct' ? copy().correct : copy().incorrect;
    $('#reaction-image').src = image;
    $('#reaction-points').textContent = value == null ? (kind === 'correct' ? '✓' : '×') : (kind === 'correct' ? '+' : '−') + value;
    $('#reaction-team').textContent = team || copy().preview;
    if (!reactionDialog.open) reactionDialog.showModal();
    reactionTimeout = setTimeout(() => { if (reactionDialog.open) reactionDialog.close(); },2600);
  }
  function award(sign) {
    const clue = clues.get(state.currentClueId);
    const team = state.teams.find(team => team.id === state.selectedTeamId);
    pauseTimer();
    if (act('award',sign)) {
      if (sign === 1) act('reveal');
      if (reactionsEnabled) showReaction(sign === 1 ? 'correct' : 'wrong',clue.value,team.name);
    }
  }
  // Any tab that observes a newer save must reload before taking control.
  window.addEventListener('storage', event => { if (event.key === STORE || event.key === null) checkSession(); });
  document.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (button && button.id !== 'reload-game' && !checkSession()) {
      event.preventDefault(); event.stopImmediatePropagation();
    }
  }, true);
  document.addEventListener('submit', event => {
    if (!checkSession()) { event.preventDefault(); event.stopImmediatePropagation(); }
  }, true);
  $('#conflict-dialog').addEventListener('cancel', event => event.preventDefault());
  $('#reload-game').addEventListener('click', () => window.location.reload());
  // Small local cutouts are ready before the first scoring decision.
  Object.values(pack.reactions).flat().forEach(src => { const image = new Image(); image.src = src; });
  $('#team-form').addEventListener('submit',event => {
    event.preventDefault(); readNames();
    if (selectedCategoryIds.length !== 6) { notice=copy().chooseSix; renderNotice(); return; }
    try { state = engine.create(names,pack,selectedCategoryIds); notice=''; restoreFailed=false; timer={clueId:null,remaining:timerDuration,running:false,deadline:0}; save(); render(); window.scrollTo({top:0}); }
    catch { notice=copy().names; renderNotice(); }
  });
  $('#pack-export').addEventListener('click', () => {
    const url=URL.createObjectURL(new Blob([packTools.exportPack(pack)],{type:'application/json'}));
    const link=element('a'); link.href=url; link.download=pack.id + '.json'; document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url),1000);
  });
  $('#pack-import').addEventListener('change', async event => {
    if (!checkSession() || state) return;
    const file=event.target.files[0];
    if (!file) return;
    try {
      if (file.size > packTools.MAX_BYTES) throw new Error('too_large');
      const imported=packTools.parse(await file.text(),trustedImages);
      if (!checkSession() || state) return;
      engine.create(['Validation A','Validation B'],imported,imported.defaultCategoryIds);
      privatePack=imported; pack={...imported,reactions:publicPack.reactions}; selectedCategoryIds=defaultCategories();
      indexClues(); save(); renderCategories(); $('#pack-status').textContent=copy().packLoaded;
    } catch { $('#pack-status').textContent=copy().packFailed; }
    event.target.value='';
  });
  $('#pack-default').addEventListener('click', () => {
    if (state) return;
    privatePack=null; pack=publicPack; selectedCategoryIds=defaultCategories(); indexClues(); save(); renderCategories(); $('#pack-status').textContent='';
  });
  $('#default-categories').addEventListener('click', () => { selectedCategoryIds=defaultCategories(); save(); renderCategories(); });
  $('#timer-duration').addEventListener('change', () => { if (!checkSession()) return; timerDuration=Number($('#timer-duration').value); timer.remaining=timerDuration; save(); });
  $('#adjust-open').addEventListener('click', () => { renderAdjustments(); $('#adjust-error').textContent=''; $('#adjust-reason').value=''; $('#adjust-dialog').showModal(); });
  $('#adjust-form').addEventListener('submit', event => {
    event.preventDefault();
    const amount = Number($('#adjust-amount').value);
    const reason = $('#adjust-reason').value.trim();
    if (!Number.isSafeInteger(amount) || amount === 0 || Math.abs(amount) > 1000000 || !reason || reason.length > 160 || /[\u0000-\u001f\u007f]/.test(reason)) { $('#adjust-error').textContent=copy().adjustmentError; return; }
    if (act('adjustScore',$('#adjust-team').value,amount,reason)) $('#adjust-dialog').close();
  });
  $('#add-team').addEventListener('click',() => { readNames(); if(names.length<6) names.push(copy().team+' '+(names.length+1)); renderSetup(); $('#team-inputs').lastElementChild?.querySelector('input')?.focus(); });
  $('#remove-team').addEventListener('click',() => { readNames(); if(names.length>2) names.pop(); renderSetup(); });
  $('#language').addEventListener('click',() => {
    if (!state) readNames();
    language = language === 'en' ? 'nb' : 'en'; renderLocale(); renderSetup(); renderGallery(); save(); render();
  });
  $('#help-open').addEventListener('click',() => { pauseTimer(); $('#help-dialog').showModal(); });
  document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click',() => document.getElementById(button.dataset.close).close()));
  $('#fullscreen').addEventListener('click',async () => {
    try { if(document.fullscreenElement) await document.exitFullscreen(); else if(document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen(); else throw new Error(); }
    catch { notice=copy().fullscreen; renderNotice(); }
  });
  $('#undo').addEventListener('click',() => act('undo'));
  $('#clue-undo').addEventListener('click',() => act('undo'));
  $('#new-game').addEventListener('click',() => $('#reset-dialog').showModal());
  $('#confirm-reset').addEventListener('click',() => {
    names = state.teams.map(team => team.name); state=null; pauseTimer(); timer={clueId:null,remaining:timerDuration,running:false,deadline:0}; restoreFailed=false; notice=''; save();
    $('#reset-dialog').close(); renderSetup(); render(); $('#setup').scrollIntoView({block:'start'});
  });
  $('#clue-cancel').addEventListener('click',() => act('cancelClue'));
  clueDialog.addEventListener('cancel',event => { event.preventDefault(); act('cancelClue'); });
  $('#clue-finish').addEventListener('click',() => act('finishClue'));
  $('#reveal').addEventListener('click',() => act('reveal'));
  $('#correct').addEventListener('click',() => award(1));
  $('#wrong').addEventListener('click',() => award(-1));
  $('#reactions-toggle').addEventListener('click',() => { reactionsEnabled=!reactionsEnabled; save(); renderBoard(); });
  $('#reaction-close').addEventListener('click',() => reactionDialog.close());
  reactionDialog.addEventListener('close',() => clearTimeout(reactionTimeout));
  $('#timer-toggle').addEventListener('click',() => {
    if(timer.running){pauseTimer();save();return;}
    if(timer.remaining<=0 || !state?.currentClueId || state.resolved)return;
    timer.running=true; timer.deadline=Date.now()+timer.remaining*1000;
    timerInterval=setInterval(() => {
      timer.remaining=Math.max(0,Math.ceil((timer.deadline-Date.now())/1000));
      renderTimer();
      if(timer.remaining===0){pauseTimer();save();$('#clue-status').textContent=copy().timerEnded;}
    },200); renderTimer();
  });
  $('#timer-reset').addEventListener('click',() => { pauseTimer();timer.remaining=timerDuration;renderClue();save(); });
  document.addEventListener('visibilitychange',() => { if(document.hidden){pauseTimer();save();} });
  window.addEventListener('pagehide',() => {pauseTimer();save();});
  renderLocale(); renderSetup(); renderGallery(); render();
})();
