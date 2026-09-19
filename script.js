(() => {
  'use strict';
  const config = window.BIRTHDAY_CONFIG;
  const root = document.getElementById('gatsby-invitation');
  const state = { language: config.appearance.defaultLanguage === 'nb' ? 'nb' : 'en', opened: false, section: 'evening', page: 0, selectedPhoto: null };
  let lastReply = null;
  let lastContribution = null;
  const photos = config.photos || [];
  const pageCount = Math.ceil(photos.length / 3);
  const opener = root.querySelector('.party-open');
  const tabs = [...root.querySelectorAll('[data-section]')];
  const template = text => String(text ?? '').replace(/\{(name|fullName|age)\}/g, (_, key) => String(config.person[key]));
  const localized = value => template(typeof value === 'string' ? value : value?.[state.language] ?? value?.en ?? '');
  function lines(element, values) {
    element.replaceChildren();
    values.forEach((value, index) => {
      if (index) element.append(document.createElement('br'));
      element.append(document.createTextNode(template(value)));
    });
  }
  function formatDate() {
    const locale = state.language === 'nb' ? 'nb-NO' : 'en-GB';
    const start = new Date(config.event.start);
    const date = new Intl.DateTimeFormat(locale, { day:'numeric', month:'long', year:'numeric', timeZone:config.event.timeZone }).format(start);
    const time = new Intl.DateTimeFormat(locale, { hour:'2-digit', minute:'2-digit', hourCycle:'h23', timeZone:config.event.timeZone }).format(start);
    return `${date} · ${state.language === 'nb' ? 'kl. ' : ''}${time}`;
  }
  function render() {
    const isNb = state.language === 'nb';
    const copy = config.copy[state.language];
    const hero = config.hero[state.language];
    root.lang = state.language;
    document.documentElement.lang = state.language;
    document.title = template(hero.masthead);
    document.querySelector('meta[name="description"]').content = `${config.person.fullName} · ${formatDate()} · ${config.event.venue.city}`;
    root.dataset.direction = config.appearance.direction;
    root.dataset.ornament = config.appearance.ornament;
    root.setAttribute('aria-label', isNb ? `Bursdagsinvitasjon for ${config.person.name}` : `${config.person.name}’s birthday invitation`);
    root.querySelector('.party-tabs').setAttribute('aria-label', isNb ? 'Invitasjonsdetaljer' : 'Invitation details');
    root.querySelector('.party-permit').setAttribute('aria-label', isNb ? 'Mat og drikke' : 'Food and drinks');
    root.querySelector('.party-album').setAttribute('aria-label', isNb ? `Bilder av ${config.person.name}` : `Photographs of ${config.person.name}`);
    root.querySelectorAll('[data-i18n]').forEach(element => { element.textContent = template(copy[element.dataset.i18n] ?? config.copy.en[element.dataset.i18n]); });
    root.querySelectorAll('[data-language]').forEach(element => element.setAttribute('aria-pressed', String(element.dataset.language === state.language)));
    root.querySelector('[data-masthead]').textContent = template(hero.masthead);
    const heading = root.querySelector('[data-headline]');
    heading.replaceChildren();
    hero.headline.forEach(line => {
      const span = document.createElement('span');
      if (line.emphasis) { const em = document.createElement('em'); em.textContent = template(line.text); span.append(em); }
      else span.textContent = template(line.text);
      heading.append(span);
    });
    lines(root.querySelector('[data-deck]'), hero.deck);
    root.querySelector('[data-signoff]').textContent = template(hero.signoff);
    root.querySelector('[data-full-name]').textContent = config.person.fullName;
    root.querySelector('[data-age]').textContent = config.person.age;
    root.querySelector('[data-event-date]').textContent = formatDate();
    const venue = config.event.venue;
    root.querySelectorAll('[data-street]').forEach(el => { el.textContent = venue.street; });
    root.querySelectorAll('[data-town]').forEach(el => { el.textContent = `${venue.postalCode} ${venue.city}`; });
    root.querySelector('[data-country]').textContent = localized(venue.country);
    root.querySelector('[data-map-link]').href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${venue.street}, ${venue.postalCode} ${venue.city}, ${venue.country.en}`)}`;
    opener.setAttribute('aria-expanded', String(state.opened));
    root.querySelector('[data-open-label]').textContent = isNb ? (state.opened ? 'Lukk detaljene' : 'Åpne invitasjonen') : (state.opened ? 'Close invitation details' : 'Open your invitation');
    root.querySelector('.party-details').hidden = !state.opened;
    tabs.forEach(button => {
      const active = button.dataset.section === state.section;
      button.setAttribute('aria-pressed', String(active));
      document.getElementById(button.getAttribute('aria-controls')).hidden = !active;
    });
    const portrait = root.querySelector('[data-hero-photo]');
    if (portrait.getAttribute('src') !== config.heroPhoto.src) portrait.src = config.heroPhoto.src;
    portrait.alt = localized(config.heroPhoto.alt);
    root.querySelector('.party-album').hidden = photos.length === 0;
    root.querySelectorAll('[data-memory]').forEach((button, slot) => {
      const photo = photos[state.page * 3 + slot];
      button.hidden = !photo;
      if (!photo) return;
      const img = button.querySelector('img');
      if (img.getAttribute('src') !== photo.src) img.src = photo.src;
      img.alt = localized(photo.alt);
      img.loading = 'lazy';
      button.querySelector('span').textContent = localized(photo.caption);
      button.setAttribute('aria-label', (isNb ? 'Se bildet: ' : 'View photograph: ') + localized(photo.caption));
    });
    const selected = state.selectedPhoto !== null;
    root.querySelector('.party-collage').hidden = selected;
    root.querySelector('.party-photo-view').hidden = !selected;
    root.querySelector('[data-next-page]').hidden = selected || pageCount <= 1;
    root.querySelector('[data-close-photo]').hidden = !selected;
    if (selected) {
      const photo = photos[state.selectedPhoto];
      const large = root.querySelector('[data-large-photo]');
      large.src = photo.src;
      large.alt = localized(photo.alt);
      root.querySelector('[data-photo-caption]').textContent = localized(photo.caption);
    }
    root.querySelector('[data-page-count]').textContent = `${String(state.page + 1).padStart(2,'0')} / ${String(pageCount).padStart(2,'0')}`;
    root.querySelector('[data-next-page]').textContent = isNb ? 'Flere minner →' : 'More memories →';
    root.querySelector('[data-close-photo]').textContent = isNb ? 'Tilbake til albumet' : 'Back to the album';
    root.querySelector('#party-evening').setAttribute('aria-label', copy.eveningTab);
    root.querySelector('#party-dress').setAttribute('aria-label', copy.dressTab);
    root.querySelector('#party-location').setAttribute('aria-label', copy.locationTab);
    renderFeedback();
    window.dispatchEvent(new CustomEvent('birthday:language', {detail:{language:state.language}}));
  }
  function renderFeedback() {
    if (lastReply) {
      const { name, accepted } = lastReply;
      root.querySelector('[data-rsvp-status]').textContent = state.language === 'nb' ? `${name}: ${accepted ? 'Jeg kommer' : 'Har bedre ting å gjøre'} — kun forhåndsvisning. Svaret er ikke sendt.` : `${name}: ${accepted ? 'I will be there' : 'Got better stuff to do'} — preview only. Your reply has not been sent.`;
    }
    if (lastContribution) {
      const { name, story, count } = lastContribution;
      root.querySelector('[data-contribution-status]').textContent = state.language === 'nb' ? `${name} · ${count} bilde(r)\n${story}\n\nKun forhåndsvisning. Bidraget er ikke sendt.` : `${name} · ${count} photo(s)\n${story}\n\nPreview only. Your contribution has not been sent.`;
    }
  }
  function setLanguage(language) {
    if (!['en','nb'].includes(language)) return;
    state.language = language;
    render();
    // Keep validation feedback in the chosen language without changing entered data.
    validatePhotos();
  }
  opener.addEventListener('click', () => { state.opened = !state.opened; render(); });
  tabs.forEach(button => button.addEventListener('click', () => { state.section = button.dataset.section; render(); }));
  root.querySelectorAll('[data-language]').forEach(button => button.addEventListener('click', () => setLanguage(button.dataset.language)));
  window.addEventListener('birthday:request-language', event => setLanguage(event.detail?.language));
  root.querySelector('[data-next-page]').addEventListener('click', () => { state.page = (state.page + 1) % pageCount; render(); });
  root.querySelectorAll('[data-memory]').forEach(button => button.addEventListener('click', () => { state.selectedPhoto = state.page * 3 + Number(button.dataset.memory); render(); root.querySelector('[data-close-photo]').focus(); }));
  root.querySelector('[data-close-photo]').addEventListener('click', () => { const slot = state.selectedPhoto % 3; state.selectedPhoto = null; render(); root.querySelector(`[data-memory="${slot}"]`).focus(); });
  root.querySelector('#party-rsvp-form').addEventListener('submit', event => {
    event.preventDefault();
    const name = root.querySelector('#party-guest-name').value.trim();
    if (!name) { root.querySelector('#party-guest-name').focus(); return; }
    const accepted = event.submitter?.value === 'yes';
    lastReply = { name, accepted };
    renderFeedback();
  });
  const photoInput = root.querySelector('#party-photos');
  const photoPreview = root.querySelector('[data-photo-previews]');
  let previewUrls = [];
  function validatePhotos() {
    const files = [...(photoInput.files || [])];
    let error = '';
    if (files.length > 3) error = state.language === 'nb' ? 'Velg opptil tre bilder.' : 'Please choose no more than three photos.';
    else if (files.some(file => file.size > 20 * 1024 * 1024)) error = state.language === 'nb' ? 'Hvert bilde må være under 20 MB.' : 'Each photo must be under 20 MB.';
    else if (files.some(file => !file.type.startsWith('image/') && !/\.(heic|heif)$/i.test(file.name))) error = state.language === 'nb' ? 'Velg bare bildefiler.' : 'Please choose image files only.';
    photoInput.setCustomValidity(error);
    root.querySelector('#party-photo-error').textContent = error;
    return error ? null : files;
  }
  photoInput.addEventListener('change', () => {
    previewUrls.forEach(url => URL.revokeObjectURL(url));
    previewUrls = [];
    photoPreview.replaceChildren();
    root.querySelector('[data-contribution-status]').textContent = '';
    lastContribution = null;
    const files = validatePhotos();
    if (!files) return;
    files.forEach(file => {
      const figure = document.createElement('figure');
      const img = document.createElement('img');
      const caption = document.createElement('figcaption');
      const url = URL.createObjectURL(file);
      previewUrls.push(url);
      img.src = url;
      img.alt = file.name;
      caption.textContent = file.name;
      img.addEventListener('error', () => { img.hidden = true; caption.textContent = file.name + (state.language === 'nb' ? ' — forhåndsvisning er ikke tilgjengelig' : ' — preview unavailable'); });
      figure.append(img, caption);
      photoPreview.append(figure);
    });
  });
  root.querySelector('#party-contribution-form').addEventListener('submit', event => {
    event.preventDefault();
    const files = validatePhotos();
    if (!files) { photoInput.reportValidity(); return; }
    const name = root.querySelector('#party-contributor').value.trim();
    const story = root.querySelector('#party-story').value.trim();
    if (!name || !story) return;
    lastContribution = { name, story, count: files.length };
    renderFeedback();
  });
  window.addEventListener('pagehide', () => previewUrls.forEach(url => URL.revokeObjectURL(url)));
  render();
})();
