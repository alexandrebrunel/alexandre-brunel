(() => {
  const root = document.documentElement;

  /* ---------- "What to look for": point at the matching highlight ---------- */
  document.querySelectorAll('[data-look]').forEach((list) => {
    const scope = list.closest('[data-scope]');
    if (!scope) return;
    const marks = scope.querySelectorAll('.mark');
    const items = list.querySelectorAll('li[data-mark]');
    let pinned = null;

    const show = (n) => {
      scope.classList.toggle('is-pointing', Boolean(n));
      marks.forEach((m) => m.classList.toggle('is-on', m.dataset.mark === n));
      items.forEach((li) => li.classList.toggle('is-on', li.dataset.mark === n));
    };

    items.forEach((li) => {
      li.addEventListener('mouseenter', () => show(li.dataset.mark));
      li.addEventListener('mouseleave', () => show(pinned));
      li.addEventListener('click', () => {
        pinned = pinned === li.dataset.mark ? null : li.dataset.mark;
        show(pinned);
      });
    });
  });

  /* ---------- Before / after tabs (side by side on wide screens, see CSS) ---------- */
  document.querySelectorAll('[data-tabs]').forEach((wrap) => {
    const tabs = Array.from(wrap.querySelectorAll('[role="tab"]'));
    const select = (tab, focus) => {
      tabs.forEach((t) => {
        const on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
      });
      if (focus) tab.focus();
    };
    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => select(tab, false));
      tab.addEventListener('keydown', (e) => {
        let next = null;
        if (e.key === 'ArrowRight') next = tabs[(i + 1) % tabs.length];
        if (e.key === 'ArrowLeft') next = tabs[(i - 1 + tabs.length) % tabs.length];
        if (e.key === 'Home') next = tabs[0];
        if (e.key === 'End') next = tabs[tabs.length - 1];
        if (next) { e.preventDefault(); select(next, true); }
      });
    });
    select(tabs.find((t) => t.getAttribute('aria-selected') === 'true') || tabs[0], false);
  });

  /* ---------- Case reasoning: folded on phones, always open on wider screens ---------- */
  const more = Array.from(document.querySelectorAll('details.more'));
  if (more.length && window.matchMedia) {
    const small = window.matchMedia('(max-width: 719px)');
    const sync = () => more.forEach((d) => { d.open = !small.matches || d.hasAttribute('data-keep-open'); });
    sync();
    if (small.addEventListener) small.addEventListener('change', sync);
    // Printing shows everything.
    window.addEventListener('beforeprint', () => more.forEach((d) => { d.open = true; }));
    window.addEventListener('afterprint', sync);
  }

  /* ---------- Full-size view ---------- */
  const dialog = document.querySelector('.lightbox');
  if (dialog && typeof dialog.showModal === 'function') {
    const stage = dialog.querySelector('[data-lightbox-stage]');
    const caption = dialog.querySelector('[data-lightbox-caption]');
    let opener = null;

    const open = (btn) => {
      const shot = btn.closest('.shot');
      const copy = shot.cloneNode(true);
      const img = copy.querySelector('img');
      const inner = copy.querySelector('.shot__btn');
      img.removeAttribute('loading');
      inner.replaceWith(img);
      copy.querySelectorAll('.mark').forEach((m) => m.classList.remove('is-on'));
      stage.replaceChildren(copy);
      caption.textContent = btn.dataset.caption || '';
      dialog.classList.toggle('is-slide', shot.classList.contains('shot--slide'));
      opener = btn;
      root.classList.add('is-locked');
      dialog.showModal();
      stage.scrollTo(0, 0);
    };

    document.querySelectorAll('[data-zoom]').forEach((btn) => {
      btn.addEventListener('click', () => open(btn));
    });
    dialog.querySelector('[data-lightbox-close]').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog || e.target === stage) dialog.close();
    });
    dialog.addEventListener('close', () => {
      root.classList.remove('is-locked');
      stage.replaceChildren();
      if (opener) opener.focus();
    });
  }

  /* ---------- Video: fetch the metadata only when it comes into view ---------- */
  const video = document.querySelector('[data-lazy-video]');
  if (video) {
    // The film belongs to Getzem Secure: no download button, no "Save video as" menu.
    video.addEventListener('contextmenu', (e) => e.preventDefault());
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          video.preload = 'metadata';
          video.load();
          io.disconnect();
        }
      }, { rootMargin: '300px' });
      io.observe(video);
    }
  }

  /* ---------- Copy email address ---------- */
  const status = document.querySelector('.contact__status');
  const say = (en, fr) => (root.lang.startsWith('fr') ? fr : en);
  document.querySelectorAll('[data-copy]').forEach((btn) => {
    let label = null;
    let result = null;
    let timer = null;
    const feedback = () => {
      btn.textContent = result ? say('Copied', 'Copié') : say('Copy failed', 'Échec de la copie');
      if (status) status.textContent = result ? say('Email address copied.', 'Adresse e-mail copiée.') : '';
    };
    document.addEventListener('langchange', () => {
      if (label === null) return;
      label = btn.textContent;
      feedback();
    });
    btn.addEventListener('click', async () => {
      if (label === null) label = btn.textContent;
      const text = btn.dataset.copy;
      let ok = false;
      try {
        await navigator.clipboard.writeText(text);
        ok = true;
      } catch (e) {
        const area = document.createElement('textarea');
        area.value = text;
        area.setAttribute('readonly', '');
        area.style.position = 'fixed';
        area.style.opacity = '0';
        document.body.appendChild(area);
        area.select();
        try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
        area.remove();
      }
      result = ok;
      feedback();
      clearTimeout(timer);
      timer = setTimeout(() => {
        btn.textContent = label;
        label = null;
        if (status) status.textContent = '';
      }, 2200);
    });
  });

  /* ---------- Top bar: mark the section in view ---------- */
  // The current section is the last one whose top has passed the upper part of the
  // viewport. Nothing is marked while the hero is still the main thing on screen.
  const links = Array.from(document.querySelectorAll('.topbar__nav a[href^="#"]'));
  const sections = links.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  if (sections.length) {
    const update = () => {
      const line = window.innerHeight * 0.4;
      let current = null;
      sections.forEach((s) => { if (s.getBoundingClientRect().top <= line) current = s; });
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      if (atBottom && window.scrollY > 0) current = sections[sections.length - 1];
      links.forEach((a) => {
        if (current && a.getAttribute('href') === '#' + current.id) a.setAttribute('aria-current', 'true');
        else a.removeAttribute('aria-current');
      });
    };
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  }
})();
