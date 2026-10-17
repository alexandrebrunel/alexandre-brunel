(() => {
  const root = document.documentElement;
  const CODES = { en: 'en-GB', fr: 'fr' };
  const ATTRS = [['frAlt', 'alt'], ['frAriaLabel', 'aria-label'], ['frCaption', 'data-caption']];
  const buttons = Array.from(document.querySelectorAll('[data-lang]'));

  const texts = Array.from(document.querySelectorAll('[data-fr]')).map((el) => ({ el, en: el.textContent }));
  const attrs = [];
  document.querySelectorAll('[data-fr-alt], [data-fr-aria-label], [data-fr-caption]').forEach((el) => {
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
      try { localStorage.setItem('lang', lang); } catch (e) {}
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
