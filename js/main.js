(() => {
  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Hero: type the search query once per visit ---------- */
  const query = document.querySelector('[data-typing]');
  if (query) {
    const box = query.closest('.query');
    if (reduceMotion || root.classList.contains('no-intro')) {
      box.classList.add('is-done');
    } else {
      const text = query.textContent;
      let i = 0;
      query.textContent = '';
      const type = () => {
        i += 1;
        query.textContent = text.slice(0, i);
        if (i < text.length) setTimeout(type, 24);
        else box.classList.add('is-done');
      };
      setTimeout(type, 120);
    }
  }

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

  /* ---------- Before / after tabs ---------- */
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

  /* ---------- Slide viewer ---------- */
  document.querySelectorAll('[data-deck]').forEach((deck) => {
    const track = deck.querySelector('.deck__track');
    const slides = track.children;
    const prev = deck.querySelector('[data-deck-prev]');
    const next = deck.querySelector('[data-deck-next]');
    const current = deck.querySelector('[data-deck-current]');
    const index = () => Math.round(track.scrollLeft / track.clientWidth);
    const go = (i) => {
      const target = Math.max(0, Math.min(slides.length - 1, i));
      track.scrollTo({ left: target * track.clientWidth, behavior: reduceMotion ? 'auto' : 'smooth' });
    };
    const update = () => {
      const i = index();
      current.textContent = String(i + 1);
      prev.disabled = i <= 0;
      next.disabled = i >= slides.length - 1;
    };
    prev.addEventListener('click', () => go(index() - 1));
    next.addEventListener('click', () => go(index() + 1));
    track.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); go(index() + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(index() - 1); }
    });
    let ticking = false;
    track.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => { update(); ticking = false; });
    }, { passive: true });
    window.addEventListener('resize', update);
    update();
  });

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
      copy.removeAttribute('aria-label');
      stage.replaceChildren(copy);
      caption.textContent = btn.dataset.caption || '';
      dialog.classList.toggle('is-slide', shot.classList.contains('deck__slide'));
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

  /* ---------- Video: fetch the first frame only when it comes into view ---------- */
  const video = document.querySelector('[data-lazy-video]');
  if (video && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        video.preload = 'metadata';
        video.load();
        io.disconnect();
      }
    }, { rootMargin: '300px' });
    io.observe(video);
  }

  /* ---------- Copy email address ---------- */
  const status = document.querySelector('.contact__status');
  document.querySelectorAll('[data-copy]').forEach((btn) => {
    const label = btn.textContent;
    btn.addEventListener('click', async () => {
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
      btn.textContent = ok ? 'Copied' : 'Copy failed';
      if (status) status.textContent = ok ? 'Email address copied.' : '';
      setTimeout(() => {
        btn.textContent = label;
        if (status) status.textContent = '';
      }, 2200);
    });
  });

  /* ---------- Top bar: mark the section in view ---------- */
  const links = Array.from(document.querySelectorAll('.topbar__nav a'));
  const sections = links.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  if (sections.length && 'IntersectionObserver' in window) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((a) => {
          if (a.getAttribute('href') === '#' + entry.target.id) a.setAttribute('aria-current', 'true');
          else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach((s) => spy.observe(s));
  }
})();
