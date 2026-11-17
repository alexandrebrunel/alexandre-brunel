(() => {
  const root = document.documentElement;
  const buttons = Array.from(document.querySelectorAll('[data-lang]'));
  const remember = (lang) => { try { localStorage.setItem('lang', lang); return true; } catch (e) { return false; } };

  if (root.hasAttribute('data-other')) {
    buttons.forEach((link) => {
      link.addEventListener('click', (e) => {
        if (link.getAttribute('aria-current') === 'true') { e.preventDefault(); return; }
        const saved = remember(link.dataset.lang);
        if (!saved || location.hash) {
          e.preventDefault();
          location.href = link.href.split('#')[0] + (saved ? '' : '?lang=' + link.dataset.lang) + location.hash;
        }
      });
    });
    root.classList.remove('is-translating');
    return;
  }

  const CODES = { en: 'en-GB', fr: 'fr' };
  const ATTRS = [['frAlt', 'alt'], ['frAriaLabel', 'aria-label'], ['frCaption', 'data-caption'], ['frHref', 'href'], ['frContent', 'content']];

  const texts = Array.from(document.querySelectorAll('[data-fr]')).map((el) => ({ el, en: el.textContent }));
  const attrs = [];
  document.querySelectorAll('[data-fr-alt], [data-fr-aria-label], [data-fr-caption], [data-fr-href], [data-fr-content]').forEach((el) => {
    ATTRS.forEach(([key, name]) => {
      if (el.dataset[key] !== undefined) attrs.push({ el, key, name, en: el.getAttribute(name) });
    });
  });

  let current = 'en';

  const apply = (lang) => {
    const fr = lang === 'fr';
    texts.forEach(({ el, en }) => { el.textContent = fr ? el.dataset.fr : en; });
    attrs.forEach(({ el, key, name, en }) => { el.setAttribute(name, fr ? el.dataset[key] : en); });
    root.lang = CODES[lang];
    buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
    current = lang;
    document.dispatchEvent(new CustomEvent('langchange', { detail: lang }));
  };

  buttons.forEach((b) => {
    b.addEventListener('click', () => {
      const lang = b.dataset.lang;
      if (lang === current) return;
      apply(lang);
      remember(lang);
      try {
        const url = new URL(window.location.href);
        if (lang === 'fr') url.searchParams.set('lang', 'fr');
        else url.searchParams.delete('lang');
        history.replaceState(history.state, '', url);
      } catch (e) {}
    });
  });

  if (root.lang === 'fr') apply('fr');
  root.classList.remove('is-translating');
})();
