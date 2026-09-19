(() => {
  'use strict';
  const config = window.BIRTHDAY_CONFIG;
  const settings = config.music;
  if (!settings?.src) return;
  const root = document.getElementById('gatsby-invitation');
  const audio = root.querySelector('[data-background-music]');
  const button = root.querySelector('[data-music-toggle]');
  const label = root.querySelector('[data-music-label]');
  const status = root.querySelector('[data-music-status]');
  const preferenceKey = `birthday:${config.id}:sound-muted`;
  let mutedByGuest = false;
  let pending = false;
  let failed = false;
  try { mutedByGuest = localStorage.getItem(preferenceKey) === 'yes'; } catch { /* Storage is optional. */ }
  audio.src = settings.src;
  audio.loop = settings.loop !== false;
  const volume = Number(settings.volume);
  audio.volume = Number.isFinite(volume) ? Math.min(1, Math.max(0, volume)) : 0.3;
  audio.preload = 'metadata';
  button.hidden = false;
  // Keep the single quiet control available during the cinematic entrance too.
  button.classList.add('party-sound-floating');
  function render() {
    const nb = root.lang === 'nb';
    const playing = !audio.paused && !audio.ended;
    label.textContent = nb ? (playing ? 'Lyd på' : 'Lyd av') : (playing ? 'Sound on' : 'Sound off');
    button.setAttribute('aria-label', nb ? (playing ? 'Slå av lyd' : 'Slå på lyd') : (playing ? 'Turn sound off' : 'Turn sound on'));
    button.setAttribute('aria-pressed', String(playing));
    status.hidden = !failed;
    status.textContent = failed ? (nb ? 'Musikken kunne ikke spilles akkurat nå.' : 'The music could not play just now.') : '';
  }
  async function play() {
    if (pending || mutedByGuest || failed) return;
    pending = true;
    try {
      await audio.play();
      // A pause click may arrive while the browser is resolving play().
      if (mutedByGuest) audio.pause();
    } catch (error) {
      if (error.name !== 'NotAllowedError' && error.name !== 'AbortError') failed = true;
    } finally { pending = false; render(); }
  }
  function rememberMute() {
    try { localStorage.setItem(preferenceKey, mutedByGuest ? 'yes' : 'no'); } catch { /* Storage is optional. */ }
  }
  button.addEventListener('click', () => {
    if (!audio.paused || pending) { mutedByGuest = true; audio.pause(); }
    else { mutedByGuest = false; failed = false; play(); }
    rememberMute();
    render();
  });
  function firstGesture(event) {
    if (event.target.closest?.('[data-music-toggle]')) return;
    if (event.type === 'keydown' && !['Enter',' '].includes(event.key)) return;
    if (settings.autoplay !== false && audio.paused && !mutedByGuest) play();
  }
  document.addEventListener('click', firstGesture);
  document.addEventListener('keydown', firstGesture);
  audio.addEventListener('play', render);
  audio.addEventListener('pause', render);
  audio.addEventListener('error', () => { failed = true; render(); });
  window.addEventListener('birthday:language', render);
  window.addEventListener('pagehide', () => audio.pause());
  render();
  if (settings.autoplay !== false) play();
})();
