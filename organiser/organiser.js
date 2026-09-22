(() => {
  'use strict';

  const config = window.BIRTHDAY_CONFIG || {};
  const service = window.BirthdaySubmissions;
  const $ = (id) => document.getElementById(id);
  const ui = Object.fromEntries([
    'event-name', 'page-status', 'setup', 'login', 'login-form', 'email', 'password', 'sign-in',
    'dashboard', 'account-email', 'sign-out', 'total-replies', 'total-yes', 'total-no',
    'total-contributions', 'refresh', 'export', 'search', 'reply-filter', 'list-summary', 'submissions',
  ].map((id) => [id, $(id)]));
  let rows = [];
  let session = null;
  let requestVersion = 0;
  let busy = false;
  let hasLoaded = false;

  const personName = config.person?.name || 'The birthday';
  const eventTitle = config.person?.fullName || personName;
  ui['event-name'].textContent = config.person?.age ? `${eventTitle} · ${config.person.age}` : eventTitle;
  document.title = `${personName} · Private guest book`;

  function status(message = '', error = false) {
    ui['page-status'].textContent = message;
    ui['page-status'].dataset.error = String(error);
  }

  function node(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }

  function readableDate(value) {
    if (!value) return 'Date unavailable';
    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) return 'Date unavailable';
    return new Intl.DateTimeFormat('en-GB', {
      dateStyle: 'medium', timeStyle: 'short', timeZone: config.event?.timeZone || 'Europe/Oslo',
    }).format(date);
  }

  function photosFor(row) {
    return Array.isArray(row.photos) ? row.photos.slice(0, 3) : [];
  }

  function hasContribution(row) {
    return Boolean(row.story?.trim() || photosFor(row).length);
  }

  function safePhotoUrl(value) {
    try {
      const url = new URL(value);
      const local = url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname);
      return (url.protocol === 'https:' || local) && !url.username && !url.password ? url.href : null;
    } catch {
      return null;
    }
  }

  function safeLink(url, text) {
    const link = node('a', '', text);
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.referrerPolicy = 'no-referrer';
    return link;
  }

  function downloadFile(blob, name) {
    const url = URL.createObjectURL(blob);
    const anchor = node('a');
    anchor.href = url;
    anchor.download = name;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function photoCard(photo, index, guestName) {
    const figure = node('figure', 'photo');
    const url = safePhotoUrl(photo.url);
    const name = String(photo.name || `Photo ${index + 1}`);
    if (!url) {
      figure.append(node('p', 'photo-error', `${name}: preview unavailable. Refresh to try again.`));
      return figure;
    }

    const imageLink = safeLink(url);
    imageLink.className = 'photo-image-link';
    imageLink.setAttribute('aria-label', `Open photo ${index + 1} from ${guestName}`);
    const image = node('img');
    image.src = url;
    image.alt = `Photo ${index + 1} submitted by ${guestName}`;
    image.loading = 'lazy';
    image.referrerPolicy = 'no-referrer';
    imageLink.append(image);
    const caption = node('figcaption', '', name);
    const actions = node('div', 'photo-actions');
    const open = safeLink(url, 'Open original ↗');
    const download = safeLink(url, 'Download');
    const feedback = node('p', 'photo-error');
    feedback.setAttribute('role', 'status');
    let downloading = false;
    download.addEventListener('click', async (event) => {
      event.preventDefault();
      if (downloading) return;
      downloading = true;
      download.textContent = 'Downloading…';
      download.setAttribute('aria-disabled', 'true');
      feedback.textContent = '';
      try {
        const response = await fetch(url, { credentials: 'omit', referrerPolicy: 'no-referrer' });
        if (!response.ok) throw new Error('download');
        const blob = await response.blob();
        const filename = name.replace(/[\x00-\x1f\x7f/\\:*?"<>|]/g, '_').slice(0, 160) || `photo-${index + 1}`;
        downloadFile(blob, filename);
      } catch {
        feedback.textContent = 'The download didn’t complete. Refresh the guest book or use “Open original” to save it.';
      } finally {
        downloading = false;
        download.textContent = 'Download';
        download.removeAttribute('aria-disabled');
      }
    });
    image.addEventListener('error', () => {
      feedback.textContent = 'This photo could not be displayed. Try opening the original, or refresh to renew the link.';
    });
    actions.append(open, download);
    figure.append(imageLink, caption, actions, feedback);
    return figure;
  }

  function guestCard(row) {
    const card = node('details', 'guest');
    const summary = node('summary');
    const guestName = String(row.name || 'Unnamed guest');
    const identity = node('span');
    identity.append(node('span', 'guest-name', guestName));
    const photoCount = photosFor(row).length;
    const contributionParts = [];
    if (row.story?.trim()) contributionParts.push('1 story');
    if (photoCount) contributionParts.push(`${photoCount} photo${photoCount === 1 ? '' : 's'}`);
    if (row.pendingUpload) contributionParts.push('Photo upload incomplete');
    identity.append(node('span', 'guest-meta', contributionParts.join(' · ') || 'No story or photos yet'));
    const badge = node('span', 'reply-badge', row.accepted ? 'Joining the party' : 'Can’t make it');
    badge.dataset.accepted = String(Boolean(row.accepted));
    summary.append(identity, badge);

    const content = node('div', 'guest-content');
    if (row.email) content.append(node('p', 'guest-meta', `Email: ${row.email}`));
    content.append(node('p', 'eyebrow', 'Their story'));
    content.append(node('p', row.story?.trim() ? 'guest-story' : 'empty-story', row.story?.trim() ? row.story : 'No story submitted yet.'));
    if (row.pendingUpload) content.append(node('p', 'photo-error', 'This guest’s photo upload hasn’t finished. Their reply and story are saved; they can return to the invitation to retry their photos.'));
    if (photoCount) {
      const photos = node('div', 'photos');
      photosFor(row).forEach((photo, index) => photos.append(photoCard(photo, index, guestName)));
      content.append(photos);
    }
    const bottom = node('div', 'guest-bottom');
    const dates = node('div', 'guest-date');
    dates.append(node('p', '', `Reply updated ${readableDate(row.updatedAt)}`));
    if (row.contributedAt) dates.append(node('p', '', `Memories updated ${readableDate(row.contributedAt)}`));
    const remove = node('button', 'text-button delete-button', 'Delete reply & memories');
    remove.type = 'button';
    remove.addEventListener('click', async () => {
      if (busy || !session) return;
      if (!window.confirm(`Permanently delete ${guestName}’s reply, story, and uploaded photos? This cannot be undone.`)) return;
      const version = requestVersion;
      busy = true;
      remove.disabled = true;
      remove.textContent = 'Deleting…';
      ui.refresh.disabled = true;
      status('Deleting the selected reply and memories…');
      try {
        await service.deleteSubmission({ eventId: config.id, userId: row.userId });
        if (version !== requestVersion || !session) return;
        busy = false;
        await loadSubmissions('The reply and memories were deleted.');
      } catch {
        if (version !== requestVersion || !session) return;
        status('The deletion could not be completed. Refresh to check the current record before trying again.', true);
      } finally {
        if (version === requestVersion && session) {
          busy = false;
          remove.disabled = false;
          remove.textContent = 'Delete reply & memories';
          ui.refresh.disabled = false;
        }
      }
    });
    bottom.append(dates, remove);
    content.append(bottom);
    card.append(summary, content);
    return card;
  }

  function renderRows() {
    ui.submissions.replaceChildren();
    if (!hasLoaded) return;
    const query = ui.search.value.trim().toLocaleLowerCase();
    const filter = ui['reply-filter'].value;
    const filtered = rows.filter((row) => {
      const matchesText = `${row.name || ''} ${row.story || ''}`.toLocaleLowerCase().includes(query);
      const matchesFilter = filter === 'all' ||
        (filter === 'yes' && row.accepted) ||
        (filter === 'no' && !row.accepted) ||
        (filter === 'contributions' && hasContribution(row));
      return matchesText && matchesFilter;
    });
    ui['list-summary'].textContent = `${filtered.length} of ${rows.length} repl${rows.length === 1 ? 'y' : 'ies'} shown`;
    if (!filtered.length) {
      ui.submissions.append(node('p', 'empty', rows.length ? 'No replies match this search.' : 'The guest book is ready. Replies will appear here as your guests respond.'));
      return;
    }
    const fragment = document.createDocumentFragment();
    filtered.forEach((row) => fragment.append(guestCard(row)));
    ui.submissions.append(fragment);
  }

  function clearData() {
    rows = [];
    hasLoaded = false;
    ui.submissions.replaceChildren();
    ui['list-summary'].textContent = '';
    ['total-replies', 'total-yes', 'total-no', 'total-contributions'].forEach((id) => { ui[id].textContent = '—'; });
    ui.export.disabled = true;
  }

  async function loadSubmissions(successMessage = '') {
    const version = ++requestVersion;
    busy = true;
    clearData();
    ui.refresh.disabled = true;
    ui.submissions.setAttribute('aria-busy', 'true');
    ui['list-summary'].textContent = 'Loading replies and private photo links…';
    status();
    try {
      const data = await service.listSubmissions(config.id);
      if (version !== requestVersion || !session) return;
      if (!Array.isArray(data)) throw new Error('Invalid response');
      rows = data;
      hasLoaded = true;
      ui['total-replies'].textContent = String(rows.length);
      ui['total-yes'].textContent = String(rows.filter((row) => row.accepted).length);
      ui['total-no'].textContent = String(rows.filter((row) => !row.accepted).length);
      ui['total-contributions'].textContent = String(rows.filter(hasContribution).length);
      ui.export.disabled = !rows.length;
      renderRows();
      status(successMessage);
    } catch {
      if (version !== requestVersion || !session) return;
      clearData();
      ui['list-summary'].textContent = 'Replies are unavailable.';
      status('Couldn’t load the guest book. Check your connection and organizer access, then refresh or sign in again.', true);
    } finally {
      if (version === requestVersion) {
        busy = false;
        ui.refresh.disabled = false;
        ui.submissions.setAttribute('aria-busy', 'false');
      }
    }
  }

  async function showDashboard(account) {
    session = account;
    ui.login.hidden = true;
    ui.dashboard.hidden = false;
    ui['account-email'].textContent = account.email || 'Organizer';
    ui.password.value = '';
    await loadSubmissions();
  }

  ui['login-form'].addEventListener('submit', async (event) => {
    event.preventDefault();
    if (busy || !ui['login-form'].reportValidity()) return;
    busy = true;
    ui['sign-in'].disabled = true;
    ui['sign-in'].textContent = 'Signing in…';
    status('Checking organizer access…');
    try {
      const account = await service.signInOrganiser({ email: ui.email.value.trim(), password: ui.password.value });
      if (!account) throw new Error('Access unavailable');
      await showDashboard(account);
    } catch {
      session = null;
      clearData();
      ui.dashboard.hidden = true;
      ui.login.hidden = false;
      ui.password.value = '';
      status('Sign-in failed. Check your email and password, and make sure this account has organizer access.', true);
      ui.password.focus();
    } finally {
      busy = false;
      ui['sign-in'].disabled = false;
      ui['sign-in'].textContent = 'Sign in';
    }
  });

  ui['sign-out'].addEventListener('click', async () => {
    ++requestVersion;
    session = null;
    busy = false;
    clearData();
    ui.dashboard.hidden = true;
    ui.login.hidden = true;
    ui['account-email'].textContent = '';
    ui.search.value = '';
    ui['reply-filter'].value = 'all';
    status('Signing out…');
    try {
      await service.signOutOrganiser();
      status('Signed out.');
    } catch {
      status('The guest book has been cleared from this page, but sign-out could not be confirmed. Close this tab if you’re using a shared device.', true);
    } finally {
      ui.login.hidden = false;
      ui.email.focus();
    }
  });

  ui.refresh.addEventListener('click', () => { if (!busy && session) loadSubmissions(); });
  ui.search.addEventListener('input', renderRows);
  ui['reply-filter'].addEventListener('change', renderRows);

  // Prefix spreadsheet formulas (including whitespace-prefixed ones) before quoting CSV cells.
  function csvCell(value) {
    let text = String(value ?? '');
    if (/^[\s\uFEFF]*[=+\-@]/u.test(text) || /^[\t\r\n]/u.test(text)) text = `'${text}`;
    return `"${text.replace(/"/g, '""')}"`;
  }

  ui.export.addEventListener('click', () => {
    if (!session || !hasLoaded || !rows.length) return;
    const records = [
      ['Name', 'Email', 'Reply', 'Reply updated', 'Story', 'Memories updated', 'Photo count'],
      ...rows.map((row) => [row.name, row.email || '', row.accepted ? 'Joining' : 'Not attending', row.updatedAt, row.story, row.contributedAt, photosFor(row).length]),
    ];
    const csv = '\uFEFF' + records.map((record) => record.map(csvCell).join(',')).join('\r\n');
    const eventSlug = String(config.id || 'birthday').replace(/[^a-z0-9_-]/gi, '-').slice(0, 80);
    downloadFile(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), `${eventSlug}-replies-${new Date().toISOString().slice(0, 10)}.csv`);
  });

  async function start() {
    if (!service?.configured || !config.id) {
      status();
      ui.setup.hidden = false;
      return;
    }
    try {
      const account = await service.organiserSession();
      if (account) await showDashboard(account);
      else {
        status();
        ui.login.hidden = false;
      }
    } catch {
      status('Couldn’t restore organizer access. Please sign in again.', true);
      ui.login.hidden = false;
    }
  }

  start();
})();
