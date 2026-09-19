(() => {
  'use strict';
  const config = window.BIRTHDAY_CONFIG;
  const root = document.getElementById('gatsby-invitation');
  const state = { language: config.appearance.defaultLanguage === 'nb' ? 'nb' : 'en', page: 0, selectedPhoto: null };
  let lastReply = null;
  let lastContribution = null;
  const submissions = window.BirthdaySubmissions;
  const isConfigured = () => submissions?.configured === true;
  const rsvpForm = root.querySelector('#party-rsvp-form');
  const contributionForm = root.querySelector('#party-contribution-form');
  const guestInput = root.querySelector('#party-guest-name');
  const storyInput = root.querySelector('#party-story');
  const photoInput = root.querySelector('#party-photos');
  const photoPreview = root.querySelector('[data-photo-previews]');
  const submissionState = { restoring: isConfigured(), rsvpBusy: false, contributionBusy: false, rsvpStatus: null, contributionStatus: null, progress: null, pendingUpload: false };
  let previewUrls = [];
  const submissionCopy = {
    en: {
      unavailable: 'RSVP and photo submissions aren’t open yet. Please check back soon.',
      serviceUnavailable: 'We couldn’t connect to save this. Your entries are still here. Please try again in a moment.',
      restoring: 'Checking for your saved reply…',
      restoreFailed: 'We couldn’t load your previous reply. You can try submitting it again.',
      savingRsvp: 'Sending your reply…',
      savingContribution: 'Sending your contribution…',
      uploading: (done, total) => `Uploading photos: ${done} of ${total}…`,
      rsvpSaved: (name, accepted) => `${name}, your reply is saved: ${accepted ? 'I will be there' : 'Got better stuff to do'}.`,
      contributionSaved: count => `Your story${count ? ` and ${count === 1 ? 'photo' : `${count} photos`}` : ''} ${count ? 'are' : 'is'} saved. Thank you!`,
      rsvpNote: 'Choose your reply below. You can update it here later on this device.',
      contributionNote: 'Optional: share a story, with or without photos. It goes privately to the host for the birthday collage and game.',
      submit: 'Send contribution', update: 'Update contribution',
      optional: ' (optional)',
      photosHint: 'Up to 3 photos · 20 MB each · JPG, PNG, WebP or HEIC. Choose photos you’re happy to show at the party.',
      replacing: 'Choosing new photos replaces your saved photos. Leave this empty to keep them.',
      savedPhoto: 'Saved photo', previewUnavailable: 'preview unavailable',
      tooMany: 'Please choose no more than three photos.', tooLarge: 'Each photo must be 20 MB or smaller.',
      invalidPhoto: 'Please choose JPG, PNG, WebP, HEIC or HEIF photos only.', emptyPhoto: 'One of these files is empty. Please choose another photo.',
      emptyStory: 'Please add your story before sending.',
      error: 'We couldn’t save this. Your entries are still here. Please try again.',
      network: 'Connection interrupted. Your entries are still here. Please try again.',
      expired: 'Your session has expired. Please send your RSVP again, then retry your contribution.',
      uploadIncomplete: 'Your RSVP is saved, but the photo upload was interrupted. Please choose the photos again and retry.',
      uploadFailed: 'The photos could not be uploaded. Your entries are still here. Please try again.',
      closed: 'Submissions for this party are now closed.',
      rateLimited: 'Too many attempts just now. Please wait a moment and try again.',
      invalid: 'Please check your name, story and photos, then try again.'
    },
    nb: {
      unavailable: 'Påmelding og bildeinnsending er ikke åpnet ennå. Kom tilbake snart.',
      serviceUnavailable: 'Vi fikk ikke kontakt for å lagre dette. Det du har fylt inn er fortsatt her. Prøv igjen om litt.',
      restoring: 'Ser etter det lagrede svaret ditt…',
      restoreFailed: 'Vi kunne ikke hente det forrige svaret ditt. Du kan prøve å sende det inn på nytt.',
      savingRsvp: 'Sender svaret ditt…',
      savingContribution: 'Sender bidraget ditt…',
      uploading: (done, total) => `Laster opp bilder: ${done} av ${total}…`,
      rsvpSaved: (name, accepted) => `${name}, svaret ditt er lagret: ${accepted ? 'Jeg kommer' : 'Har bedre ting å gjøre'}.`,
      contributionSaved: count => `Historien din${count ? ` og ${count === 1 ? 'bildet ditt' : `${count} bilder`}` : ''} er lagret. Tusen takk!`,
      rsvpNote: 'Velg svaret ditt nedenfor. Du kan endre det her senere på denne enheten.',
      contributionNote: 'Valgfritt: del en historie, med eller uten bilder. Den sendes privat til verten for bursdagscollagen og spillet.',
      submit: 'Send bidrag', update: 'Oppdater bidrag',
      optional: ' (valgfritt)',
      photosHint: 'Opptil 3 bilder · 20 MB per bilde · JPG, PNG, WebP eller HEIC. Velg bilder du gjerne vil vise på festen.',
      replacing: 'Nye bilder erstatter bildene du har sendt inn. La feltet stå tomt for å beholde dem.',
      savedPhoto: 'Lagret bilde', previewUnavailable: 'forhåndsvisning er ikke tilgjengelig',
      tooMany: 'Velg opptil tre bilder.', tooLarge: 'Hvert bilde må være på 20 MB eller mindre.',
      invalidPhoto: 'Velg bare bilder i JPG-, PNG-, WebP-, HEIC- eller HEIF-format.', emptyPhoto: 'En av filene er tom. Velg et annet bilde.',
      emptyStory: 'Skriv en historie før du sender.',
      error: 'Vi kunne ikke lagre dette. Det du har fylt inn er fortsatt her. Prøv igjen.',
      network: 'Forbindelsen ble brutt. Det du har fylt inn er fortsatt her. Prøv igjen.',
      expired: 'Økten din har utløpt. Send påmeldingssvaret på nytt, og prøv deretter å sende bidraget igjen.',
      uploadIncomplete: 'Påmeldingssvaret ditt er lagret, men bildeopplastingen ble avbrutt. Velg bildene på nytt og prøv igjen.',
      uploadFailed: 'Bildene kunne ikke lastes opp. Det du har fylt inn er fortsatt her. Prøv igjen.',
      closed: 'Det er ikke lenger mulig å sende inn svar til denne festen.',
      rateLimited: 'Det ble for mange forsøk akkurat nå. Vent litt og prøv igjen.',
      invalid: 'Kontroller navn, historie og bilder, og prøv igjen.'
    }
  };
  photoInput.accept = 'image/jpeg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic,.heif';
  const photos = config.photos || [];
  const pageCount = Math.ceil(photos.length / 3);
  const template = text => String(text ?? '').replace(/\{(name|fullName|age)\}/g, (_, key) => String(config.person[key]));
  const localized = value => template(typeof value === 'string' ? value : value?.[state.language] ?? value?.en ?? '');
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
    const story = config.story[state.language];
    root.lang = state.language;
    document.documentElement.lang = state.language;
    document.title = template(config.hero[state.language].masthead);
    document.querySelector('meta[name="description"]').content = `${config.person.fullName} · ${formatDate()} · ${config.event.venue.city}`;
    root.dataset.direction = config.appearance.direction;
    root.dataset.ornament = config.appearance.ornament;
    root.setAttribute('aria-label', isNb ? `Bursdagsinvitasjon for ${config.person.name}` : `${config.person.name}’s birthday invitation`);
    root.querySelectorAll('[data-i18n]').forEach(element => { element.textContent = template(copy[element.dataset.i18n] ?? config.copy.en[element.dataset.i18n]); });
    root.querySelectorAll('[data-story-copy]').forEach(element => { element.textContent = template(story[element.dataset.storyCopy]); });
    root.querySelectorAll('[data-language]').forEach(element => element.setAttribute('aria-pressed', String(element.dataset.language === state.language)));
    root.querySelector('[data-signoff]').textContent = template(config.hero[state.language].signoff);
    root.querySelector('[data-event-date]').textContent = formatDate();
    const venue = config.event.venue;
    root.querySelectorAll('[data-street]').forEach(el => { el.textContent = venue.street; });
    root.querySelectorAll('[data-town]').forEach(el => { el.textContent = `${venue.postalCode} ${venue.city}`; });
    root.querySelector('[data-country]').textContent = localized(venue.country);
    root.querySelector('[data-map-link]').href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${venue.street}, ${venue.postalCode} ${venue.city}, ${venue.country.en}`)}`;
    root.querySelector('#dress-dialog').setAttribute('aria-label', story.dressAction);
    root.querySelector('#food-dialog').setAttribute('aria-label', story.foodAction);
    root.querySelectorAll('[data-dialog-close]').forEach(button => button.setAttribute('aria-label', isNb ? 'Lukk' : 'Close'));
    root.querySelector('#party-evidence').hidden = !lastReply;
    if (lastReply) {
      root.querySelector('#party-contributor').value = lastReply.name;
      root.querySelector('[data-contributor-name]').textContent = lastReply.name;
    }
    root.querySelectorAll('#party-rsvp-form button[name="reply"]').forEach(button => {
      button.setAttribute('aria-pressed', String(!!lastReply && (button.value === 'yes') === lastReply.accepted));
    });
    root.querySelector('#party-memories').hidden = photos.length === 0;
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
    renderFeedback();
    window.dispatchEvent(new CustomEvent('birthday:language', {detail:{language:state.language}}));
  }
  function errorMessage(error) {
    const copy = submissionCopy[state.language];
    const code = String(error?.code || '').toLowerCase();
    if (code === 'not_configured') return copy.unavailable;
    if (code === 'unavailable') return copy.serviceUnavailable;
    if (code === 'upload_incomplete') return copy.uploadIncomplete;
    if (code === 'upload_failed') return copy.uploadFailed;
    if (code === 'closed') return copy.closed;
    if (/network|fetch|timeout|offline/.test(code) || error instanceof TypeError) return copy.network;
    if (/unauthorized|not.authorized|expired|auth|session|rsvp.required/.test(code)) return copy.expired;
    if (/rate|too.many/.test(code)) return copy.rateLimited;
    if (/invalid|validation|file|size/.test(code)) return copy.invalid;
    return copy.error;
  }
  function renderFeedback() {
    const copy = submissionCopy[state.language];
    const busy = submissionState.restoring || submissionState.rsvpBusy || submissionState.contributionBusy;
    const disabled = busy;
    rsvpForm.setAttribute('aria-busy', String(submissionState.restoring || submissionState.rsvpBusy));
    contributionForm.setAttribute('aria-busy', String(submissionState.contributionBusy));
    rsvpForm.querySelectorAll('input, button').forEach(element => { element.disabled = disabled; });
    contributionForm.querySelectorAll('input, textarea, button').forEach(element => { element.disabled = disabled || !lastReply; });
    const rsvpNote = root.querySelector('[data-i18n="rsvpNote"]');
    rsvpNote.textContent = isConfigured() ? copy.rsvpNote : copy.unavailable;
    // The live status announces this same message after an unavailable submission.
    rsvpNote.hidden = submissionState.rsvpStatus?.error?.code === 'not_configured';
    root.querySelector('[data-i18n="contributeNote"]').textContent = isConfigured() ? copy.contributionNote : copy.unavailable;
    root.querySelector('[data-i18n="photosLabel"]').textContent = template(config.copy[state.language].photosLabel) + copy.optional;
    root.querySelector('#party-photos-hint').textContent = copy.photosHint + (lastContribution?.photos?.length ? ` ${copy.replacing}` : '');
    root.querySelector('[data-i18n="contributeButton"]').textContent = submissionState.contributionBusy ? copy.savingContribution : lastContribution ? copy.update : copy.submit;
    const rsvpStatus = root.querySelector('[data-rsvp-status]');
    const contributionStatus = root.querySelector('[data-contribution-status]');
    const replyStatus = submissionState.rsvpStatus;
    const storyStatus = submissionState.contributionStatus;
    rsvpStatus.dataset.status = replyStatus?.kind || '';
    contributionStatus.dataset.status = storyStatus?.kind || '';
    rsvpStatus.textContent = submissionState.restoring ? copy.restoring
      : submissionState.rsvpBusy ? copy.savingRsvp
      : replyStatus?.kind === 'restore-error' ? copy.restoreFailed
      : replyStatus?.kind === 'error' ? errorMessage(replyStatus.error)
      : lastReply ? copy.rsvpSaved(lastReply.name, lastReply.accepted) : '';
    contributionStatus.textContent = submissionState.contributionBusy
      ? submissionState.progress?.total ? copy.uploading(submissionState.progress.done, submissionState.progress.total) : copy.savingContribution
      : storyStatus?.kind === 'error' ? errorMessage(storyStatus.error)
      : submissionState.pendingUpload ? copy.uploadIncomplete
      : storyStatus?.kind === 'success' && lastContribution ? copy.contributionSaved(lastContribution.photos?.length || 0) : '';
    photoPreview.querySelectorAll('figcaption').forEach(caption => {
      caption.textContent = `${caption.dataset.filename}${caption.dataset.saved ? ` · ${copy.savedPhoto}` : ''}${caption.dataset.unavailable ? ` — ${copy.previewUnavailable}` : ''}`;
    });
  }
  function setLanguage(language) {
    if (!['en','nb'].includes(language)) return;
    state.language = language;
    render();
    // Keep validation feedback in the chosen language without changing entered data.
    validatePhotos();
  }
  root.querySelectorAll('[data-language]').forEach(button => button.addEventListener('click', () => setLanguage(button.dataset.language)));
  window.addEventListener('birthday:request-language', event => setLanguage(event.detail?.language));
  root.querySelector('[data-next-page]').addEventListener('click', () => {
    state.page = (state.page + 1) % pageCount;
    render();
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      root.querySelector('.party-collage').animate([{opacity:0,transform:'translateY(18px)'},{opacity:1,transform:'translateY(0)'}], {duration:480,easing:'ease-out'});
    }
  });
  root.querySelectorAll('[data-memory]').forEach(button => button.addEventListener('click', () => { state.selectedPhoto = state.page * 3 + Number(button.dataset.memory); render(); root.querySelector('[data-close-photo]').focus(); }));
  root.querySelector('[data-close-photo]').addEventListener('click', () => { const slot = state.selectedPhoto % 3; state.selectedPhoto = null; render(); root.querySelector(`[data-memory="${slot}"]`).focus(); });
  rsvpForm.addEventListener('submit', async event => {
    event.preventDefault();
    if (submissionState.restoring || submissionState.rsvpBusy || submissionState.contributionBusy) return;
    if (!isConfigured()) {
      submissionState.rsvpStatus = { kind: 'error', error: { code: 'not_configured' } };
      renderFeedback();
      return;
    }
    const name = guestInput.value.trim();
    if (!name) { guestInput.focus(); return; }
    // Enter in the name field defaults to the first, affirmative choice.
    const accepted = event.submitter?.value !== 'no';
    submissionState.rsvpBusy = true;
    submissionState.rsvpStatus = null;
    renderFeedback();
    try {
      const saved = await submissions.saveRsvp({ eventId: config.id, name, accepted });
      if (!saved || typeof saved.name !== 'string' || typeof saved.accepted !== 'boolean') throw new Error('Invalid save response');
      lastReply = { name: saved.name, accepted: saved.accepted };
      guestInput.value = saved.name;
      submissionState.rsvpStatus = { kind: 'success' };
      render();
      window.dispatchEvent(new CustomEvent('birthday:evidence'));
      requestAnimationFrame(() => {
        root.querySelector('#party-evidence').scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
      });
    } catch (error) {
      submissionState.rsvpStatus = { kind: 'error', error };
    } finally {
      submissionState.rsvpBusy = false;
      renderFeedback();
    }
  });
  function validatePhotos() {
    const copy = submissionCopy[state.language];
    const files = [...(photoInput.files || [])];
    const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']);
    let error = '';
    if (files.length > 3) error = copy.tooMany;
    else if (files.some(file => file.size > 20 * 1024 * 1024)) error = copy.tooLarge;
    else if (files.some(file => file.size === 0)) error = copy.emptyPhoto;
    else if (files.some(file => !allowedTypes.has(file.type.toLowerCase()) && (file.type !== '' || !/\.(jpe?g|png|webp|heic|heif)$/i.test(file.name)))) error = copy.invalidPhoto;
    photoInput.setCustomValidity(error);
    photoInput.setAttribute('aria-invalid', String(!!error));
    root.querySelector('#party-photo-error').textContent = error;
    return error ? null : files;
  }
  function renderPhotoPreviews(files = []) {
    previewUrls.forEach(url => URL.revokeObjectURL(url));
    previewUrls = [];
    photoPreview.replaceChildren();
    const selected = files.length > 0;
    const entries = selected ? files : lastContribution?.photos || [];
    entries.forEach(entry => {
      const figure = document.createElement('figure');
      const caption = document.createElement('figcaption');
      const url = selected ? URL.createObjectURL(entry) : entry.url;
      if (selected) previewUrls.push(url);
      caption.dataset.filename = entry.name;
      if (!selected) caption.dataset.saved = 'true';
      if (url) {
        const img = document.createElement('img');
        img.src = url;
        img.alt = entry.name;
        img.addEventListener('error', () => {
          img.hidden = true;
          caption.dataset.unavailable = 'true';
          renderFeedback();
        });
        figure.append(img);
      }
      figure.append(caption);
      photoPreview.append(figure);
    });
    renderFeedback();
  }
  photoInput.addEventListener('change', () => {
    submissionState.contributionStatus = null;
    const files = validatePhotos();
    renderPhotoPreviews(files || []);
  });
  storyInput.addEventListener('input', () => {
    storyInput.setCustomValidity('');
    submissionState.contributionStatus = null;
    renderFeedback();
  });
  guestInput.addEventListener('input', () => {
    submissionState.rsvpStatus = null;
    // An earlier saved reply remains authoritative until the new name is sent.
    renderFeedback();
  });
  contributionForm.addEventListener('submit', async event => {
    event.preventDefault();
    if (!isConfigured() || !lastReply || submissionState.restoring || submissionState.rsvpBusy || submissionState.contributionBusy) return;
    const files = validatePhotos();
    if (!files) { photoInput.reportValidity(); return; }
    const story = storyInput.value.trim();
    if (!story) {
      storyInput.setCustomValidity(submissionCopy[state.language].emptyStory);
      storyInput.reportValidity();
      return;
    }
    submissionState.contributionBusy = true;
    submissionState.contributionStatus = null;
    submissionState.progress = null;
    renderFeedback();
    try {
      const saved = await submissions.saveContribution({
        eventId: config.id, story, files,
        onProgress: progress => { submissionState.progress = progress; renderFeedback(); }
      });
      if (!saved || typeof saved.story !== 'string' || !Array.isArray(saved.photos)) throw new Error('Invalid save response');
      lastContribution = saved;
      submissionState.pendingUpload = false;
      storyInput.value = saved.story;
      photoInput.value = '';
      submissionState.contributionStatus = { kind: 'success' };
      renderPhotoPreviews();
    } catch (error) {
      submissionState.contributionStatus = { kind: 'error', error };
    } finally {
      submissionState.contributionBusy = false;
      submissionState.progress = null;
      renderFeedback();
    }
  });
  async function restoreGuest() {
    if (!isConfigured()) return;
    try {
      const guest = await submissions.restoreGuest(config.id);
      if (guest && typeof guest.name === 'string' && typeof guest.accepted === 'boolean') {
        lastReply = { name: guest.name, accepted: guest.accepted };
        guestInput.value = guest.name;
        submissionState.pendingUpload = guest.pendingUpload === true;
        if (guest.contributedAt || guest.story) {
          lastContribution = { name: guest.name, story: guest.story || '', photos: guest.photos || [], contributedAt: guest.contributedAt };
          storyInput.value = lastContribution.story;
          submissionState.contributionStatus = { kind: 'success' };
          renderPhotoPreviews();
        }
      }
    } catch (error) {
      submissionState.rsvpStatus = { kind: 'restore-error', error };
    } finally {
      submissionState.restoring = false;
      render();
      window.dispatchEvent(new CustomEvent('birthday:evidence'));
    }
  }
  window.addEventListener('pagehide', event => {
    if (!event.persisted) previewUrls.forEach(url => URL.revokeObjectURL(url));
  });
  render();
  restoreGuest();
})();
