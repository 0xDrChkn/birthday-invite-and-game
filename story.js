(() => {
  'use strict';
  const root = document.getElementById('gatsby-invitation');
  const story = root.querySelector('.party-story');
  const chapters = [...story.querySelectorAll('.story-chapter')];
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = value => Math.max(0, Math.min(1, value));
  let queued = false;
  function update() {
    queued = false;
    const height = window.innerHeight;
    chapters.forEach(chapter => {
      if (chapter.hidden) return;
      const card = chapter.querySelector('.story-card');
      const previousOffset = Number.parseFloat(chapter.style.getPropertyValue('--story-y')) || 0;
      const top = card.getBoundingClientRect().top - previousOffset;
      // Scroll-driven, not a one-shot animation: the chapter arrives with the reader.
      // Keep it fully visible above the reading line and while a form has focus.
      const readable = motion.matches || card.contains(document.activeElement);
      const progress = readable ? 1 : clamp((height * .97 - top) / (height * .50));
      const eased = 1 - Math.pow(1 - progress, 3);
      chapter.style.setProperty('--story-opacity', String(eased));
      chapter.style.setProperty('--story-y', `${(1 - eased) * 52}px`);
      chapter.dataset.storyReady = '';
    });
  }
  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(update);
  }
  window.addEventListener('scroll', schedule, {passive:true});
  window.addEventListener('resize', schedule, {passive:true});
  window.addEventListener('birthday:evidence', schedule);
  window.addEventListener('birthday:language', schedule);
  story.addEventListener('focusin', schedule);
  story.addEventListener('focusout', schedule);
  motion.addEventListener('change', schedule);
  if ('ResizeObserver' in window) new ResizeObserver(schedule).observe(story);
  story.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', event => {
      const target = document.getElementById(link.hash.slice(1));
      if (!target || target.hidden) return;
      event.preventDefault();
      target.scrollIntoView({behavior:motion.matches ? 'auto' : 'smooth',block:'start'});
    });
  });
  story.querySelectorAll('[data-dialog-open]').forEach(button => {
    button.addEventListener('click', () => {
      const dialog = document.getElementById(button.dataset.dialogOpen);
      if (!dialog.open) dialog.showModal();
    });
  });
  story.querySelectorAll('[data-dialog-close]').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
  story.querySelectorAll('dialog').forEach(dialog => {
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
    });
  });
  update();
})();
