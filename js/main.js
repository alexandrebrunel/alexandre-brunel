(() => {
  const root = document.documentElement;

  const wireNotes = (list, scope) => {
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
  };
  document.querySelectorAll('[data-look]').forEach((list) => wireNotes(list, list.closest('[data-scope]')));

  const more = Array.from(document.querySelectorAll('details.more'));
  if (more.length && window.matchMedia) {
    const small = window.matchMedia('(max-width: 719px)');
    const sync = () => more.forEach((d) => { d.open = !small.matches; });
    sync();
    if (small.addEventListener) small.addEventListener('change', sync);
    window.addEventListener('beforeprint', () => more.forEach((d) => { d.open = true; }));
    window.addEventListener('afterprint', sync);
  }

  const dialog = document.querySelector('.lightbox');
  if (dialog && typeof dialog.showModal === 'function') {
    const stage = dialog.querySelector('[data-lightbox-stage]');
    const caption = dialog.querySelector('[data-lightbox-caption]');
    const notes = dialog.querySelector('[data-lightbox-notes]');
    let opener = null;

    const open = (btn) => {
      const shot = btn.closest('.shot');
      const copy = shot.cloneNode(true);
      const img = copy.querySelector('img');
      const inner = copy.querySelector('.shot__btn');
      img.removeAttribute('loading');
      if (img.dataset.full) {
        img.src = img.dataset.full;
        img.width = Number(img.dataset.fullWidth);
        img.height = Number(img.dataset.fullHeight);
      }
      inner.replaceWith(img);
      if (copy.querySelector('.mark--full')) copy.querySelectorAll('.mark:not(.mark--full)').forEach((m) => m.remove());
      copy.querySelectorAll('.mark').forEach((m) => m.classList.remove('is-on'));
      stage.replaceChildren(copy);
      caption.textContent = btn.dataset.caption || '';

      const figure = shot.closest('figure');
      const legend = figure && figure.querySelector('.legend');
      if (notes) {
        notes.replaceChildren();
        notes.hidden = !legend;
        if (legend) {
          const list = legend.cloneNode(true);
          list.querySelectorAll('.is-on').forEach((li) => li.classList.remove('is-on'));
          notes.append(list);
          wireNotes(list, copy);
        }
      }

      dialog.classList.toggle('is-slide', shot.classList.contains('shot--slide'));
      opener = btn;
      root.classList.add('is-locked');
      dialog.showModal();
      stage.scrollTo(0, 0);
    };

    document.querySelectorAll('[data-zoom]').forEach((btn) => {
      btn.addEventListener('click', () => open(btn));
    });
    document.querySelectorAll('[data-zoom-proxy]').forEach((label) => {
      label.addEventListener('click', () => {
        const figure = label.closest('figure');
        const btn = figure && figure.querySelector('[data-zoom]');
        if (btn) btn.click();
      });
    });
    dialog.querySelector('[data-lightbox-close]').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog || e.target === stage) dialog.close();
    });
    dialog.addEventListener('close', () => {
      root.classList.remove('is-locked');
      root.classList.remove('is-pointing');
      stage.replaceChildren();
      if (notes) notes.replaceChildren();
      if (opener) opener.focus();
    });
  }

  const video = document.querySelector('[data-lazy-video]');
  if (video) {
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

  const status = document.querySelector('.contact__status');
  const say = (en, fr) => (root.lang.startsWith('fr') ? fr : en);
  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (e) {
      const area = document.createElement('textarea');
      area.value = text;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
      area.remove();
      return ok;
    }
  };

  const mailTimers = new WeakMap();
  document.querySelectorAll('a[href^="mailto:"]').forEach((link) => {
    link.addEventListener('click', () => {
      const address = link.getAttribute('href').replace(/^mailto:/, '').split('?')[0];
      const scope = link.closest('[data-mail-scope]');
      const note = (scope && scope.querySelector('[data-mail-status]')) || status;
      let left = false;
      const onLeave = () => { left = true; };
      window.addEventListener('blur', onLeave, { once: true });
      setTimeout(async () => {
        window.removeEventListener('blur', onLeave);
        if (left || document.hidden || !document.hasFocus()) return;
        const ok = await copyText(address);
        if (!note) return;
        note.textContent = ok
          ? say('No email app opened? The address is copied, paste it into your mail.', 'Aucune messagerie ne s’est ouverte ? L’adresse est copiée, collez-la dans votre messagerie.')
          : say('No email app opened? Write to ' + address + '.', 'Aucune messagerie ne s’est ouverte ? Écrivez à ' + address + '.');
        note.scrollIntoView({ block: 'nearest' });
        clearTimeout(mailTimers.get(note));
        mailTimers.set(note, setTimeout(() => { note.textContent = ''; }, 8000));
      }, 1200);
    });
  });

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
      result = await copyText(btn.dataset.copy);
      feedback();
      clearTimeout(timer);
      timer = setTimeout(() => {
        btn.textContent = label;
        label = null;
        if (status) status.textContent = '';
      }, 2200);
    });
  });

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
