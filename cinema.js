/* A scroll-directed arrival. The invitation below stays independent of this scene. */
(() => {
  'use strict';
  const root = document.getElementById('gatsby-invitation');
  const config = window.BIRTHDAY_CONFIG;
  if (!root || !config || root.querySelector('.cinema-intro')) return;

  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const person = config.person || {};
  const name = person.name || person.fullName || '';
  const fullName = person.fullName || name;
  let language = root.lang === 'nb' ? 'nb' : (config.appearance?.defaultLanguage === 'nb' ? 'nb' : 'en');
  const copy = {
    en: {
      label: 'Your arrival at the party', skip: 'Skip to the invitation',
      chapter: `${fullName} · Chapter ${person.age || ''}`,
      opening: ['The twenties', 'are calling.'],
      openingNote: 'An invitation to one more extraordinary night.',
      scroll: 'Scroll to step inside', welcomeKicker: 'An evening with',
      welcome: name,
      welcomeNote: 'Step inside. The twenties aren’t quite over.',
      continue: 'Let the evening begin',
      portrait: `${name} raising a champagne glass in a Gatsby-inspired AI portrait`
    },
    nb: {
      label: 'Din ankomst til festen', skip: 'Gå til invitasjonen',
      chapter: `${fullName} · Kapittel ${person.age || ''}`,
      opening: ['Tjueårene', 'kaller.'],
      openingNote: 'En invitasjon til enda en uforglemmelig kveld.',
      scroll: 'Rull ned og kom inn', welcomeKicker: 'En kveld med',
      welcome: name,
      welcomeNote: 'Kom inn. Tjueårene er ikke helt over ennå.',
      continue: 'La kvelden begynne',
      portrait: `${name} som løfter et champagneglass i et KI-laget Gatsby-portrett`
    }
  };
  const intro = document.createElement('section');
  intro.className = 'cinema-intro';
  intro.id = 'arrival';
  intro.innerHTML = `
    <div class="cinema-sticky">
      <div class="cinema-mansion" aria-hidden="true">
        <img class="cinema-wide-shot" src="assets/gatsby-mansion-wide-open.jpg" alt="" fetchpriority="high" decoding="async">
      </div>
      <div class="cinema-vignette" aria-hidden="true"></div>
      <div class="cinema-dust" aria-hidden="true"></div>
      <div class="cinema-nav">
        <a class="cinema-skip" href="#invitation"><span data-cinema-copy="skip"></span><span aria-hidden="true">↘</span></a>
        <div class="cinema-languages" role="group" aria-label="Language / Språk">
          <button type="button" data-cinema-language="en" lang="en">EN</button>
          <span aria-hidden="true">/</span>
          <button type="button" data-cinema-language="nb" lang="nb">NO</button>
        </div>
      </div>
      <div class="cinema-arrival">
        <p class="cinema-eyebrow" data-cinema-copy="chapter"></p>
        <h1 class="cinema-opening"><span data-cinema-opening="0"></span><em data-cinema-opening="1"></em></h1>
        <p class="cinema-arrival-note" data-cinema-copy="openingNote"></p>
      </div>
      <div class="cinema-guest-scene">
        <div class="cinema-guest-backdrop" aria-hidden="true"><img alt="" decoding="async"></div>
        <img class="cinema-portrait" decoding="async">
      </div>
      <div class="cinema-welcome">
        <p class="cinema-eyebrow" data-cinema-copy="welcomeKicker"></p>
        <h2 data-cinema-copy="welcome"></h2>
        <p class="cinema-welcome-note" data-cinema-copy="welcomeNote"></p>
        <a class="cinema-continue" href="#invitation"><span data-cinema-copy="continue"></span><span aria-hidden="true">↓</span></a>
      </div>
      <p class="cinema-scroll-cue"><span data-cinema-copy="scroll"></span><span class="cinema-scroll-line" aria-hidden="true"></span></p>
      <div class="cinema-progress" aria-hidden="true"><span></span></div>
    </div>`;

  const portrait = intro.querySelector('.cinema-portrait');
  if (config.heroPhoto?.src) {
    portrait.src = config.heroPhoto.src;
    intro.querySelector('.cinema-guest-backdrop img').src = config.heroPhoto.src;
  }
  else portrait.hidden = true;
  const welcome = intro.querySelector('.cinema-welcome');
  const arrival = intro.querySelector('.cinema-arrival');
  const continueLink = intro.querySelector('.cinema-continue');
  const frame = root.querySelector('#invitation');

  function translate(next) {
    language = next === 'nb' ? 'nb' : 'en';
    const text = copy[language];
    intro.lang = language;
    intro.setAttribute('aria-label', text.label);
    intro.querySelectorAll('[data-cinema-copy]').forEach(node => {
      node.textContent = text[node.dataset.cinemaCopy];
    });
    intro.querySelectorAll('[data-cinema-opening]').forEach(node => {
      node.textContent = text.opening[Number(node.dataset.cinemaOpening)];
    });
    intro.querySelectorAll('[data-cinema-language]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.cinemaLanguage === language));
    });
    const configuredAlt = config.heroPhoto?.alt;
    const alt = typeof configuredAlt === 'string' ? configuredAlt : configuredAlt?.[language];
    portrait.alt = (alt || text.portrait).replaceAll('{name}', name).replaceAll('{fullName}', fullName).replaceAll('{age}', String(person.age || ''));
  }

  translate(language);
  root.insertBefore(intro, frame || root.firstChild);
  // Separate controls deliberately avoid the invitation's [data-language] hooks.
  intro.querySelectorAll('[data-cinema-language]').forEach(button => {
    button.addEventListener('click', () => {
      const requested = button.dataset.cinemaLanguage;
      translate(requested);
      window.dispatchEvent(new CustomEvent('birthday:request-language', { detail: { language: requested } }));
    });
  });
  window.addEventListener('birthday:language', event => {
    if (event.detail?.language) translate(event.detail.language);
  });

  intro.querySelectorAll('a[href="#invitation"]').forEach(link => {
    link.addEventListener('click', event => {
      const target = document.getElementById('invitation') || frame;
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: motion.matches ? 'auto' : 'smooth', block: 'start' });
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    });
  });

  const clamp = value => Math.min(1, Math.max(0, value));
  const ramp = (progress, start, end) => clamp((progress - start) / (end - start));
  const ease = value => value * value * (3 - 2 * value);
  let scheduled = false;
  let welcomeVisible = true;
  function setWelcomeVisibility(visible) {
    if (visible === welcomeVisible) return;
    welcomeVisible = visible;
    welcome.setAttribute('aria-hidden', String(!visible));
    welcome.inert = !visible;
    continueLink.tabIndex = visible ? 0 : -1;
  }
  function updateScene() {
    scheduled = false;
    if (motion.matches) {
      setWelcomeVisibility(true);
      arrival.setAttribute('aria-hidden', 'true');
      return;
    }
    const rect = intro.getBoundingClientRect();
    const stage = intro.querySelector('.cinema-sticky');
    const viewport = stage.offsetHeight;
    const width = stage.clientWidth;
    const progress = clamp(-rect.top / Math.max(1, rect.height - viewport));
    // Fit the complete landscape photograph first, including on portrait screens.
    // Track the real doorway through the letterboxing as the camera moves forward.
    const imageAspect = 1672 / 941;
    const photoWidth = Math.min(width, viewport * imageAspect);
    const photoHeight = photoWidth / imageAspect;
    const wideDoorY = (viewport - photoHeight) / 2 + photoHeight * .655;
    const approach = ease(ramp(progress, .06, .80));
    const finalZoom = Math.min(12, width * .65 / (photoWidth * .065));
    const zoom = Math.pow(finalZoom, approach);
    const cameraY = approach * (viewport * .53 - wideDoorY);
    // One photograph throughout the approach, then a direct dissolve into Sara.
    const dissolve = ease(ramp(progress, .70, .91));
    const welcomeIn = ease(ramp(progress, .80, .96));
    const values = {
      '--cinema-progress': progress,
      '--cinema-zoom': zoom,
      '--cinema-door-y': `${wideDoorY}px`,
      '--cinema-camera-y': `${cameraY}px`,
      '--cinema-mansion-opacity': 1 - dissolve,
      '--cinema-arrival-opacity': 1 - ease(ramp(progress, .08, .31)),
      '--cinema-arrival-y': `${-ramp(progress, .06, .36) * 52}px`,
      '--cinema-guest-opacity': dissolve,
      '--cinema-guest-zoom': 1.04 - dissolve * .04,
      '--cinema-welcome-opacity': welcomeIn,
      '--cinema-welcome-y': `${(1 - welcomeIn) * 26}px`,
      '--cinema-cue-opacity': 1 - ramp(progress, .13, .3)
    };
    Object.entries(values).forEach(([key, value]) => intro.style.setProperty(key, value));
    setWelcomeVisibility(progress >= .85);
    arrival.setAttribute('aria-hidden', String(progress > .31));
  }
  function scheduleScene() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(updateScene);
  }
  function setMotion() {
    intro.classList.toggle('is-animated', !motion.matches);
    intro.classList.toggle('is-static', motion.matches);
    updateScene();
  }

  window.addEventListener('scroll', scheduleScene, { passive: true });
  window.addEventListener('resize', scheduleScene, { passive: true });
  motion.addEventListener('change', setMotion);
  setMotion();

})();
