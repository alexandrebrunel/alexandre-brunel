/*
  Measurement: Google Tag Manager + GA4, gated by Consent Mode v2.

  How it works
  - Set the container ID on the script tag: <script src="js/analytics.js" data-gtm-id="GTM-XXXXXXX" defer>.
    While it is empty, nothing loads, no banner shows and no cookie is set.
  - Consent defaults to "denied". Google Tag Manager is only loaded after the visitor
    accepts, so no request goes to Google before consent (basic Consent Mode).
  - The choice is kept in localStorage and can be changed from "Cookie settings" in the footer.
  - Every interaction below is pushed to the dataLayer as a custom event. In GTM, create one
    "Custom Event" trigger per name and a GA4 Event tag that forwards it.

  Events: cv_download, email_click, email_copy, linkedin_click, lightbox_open, video_play, language_switch
*/
(() => {
  const script = document.currentScript;
  const GTM_ID = ((script && script.dataset.gtmId) || '').trim();
  const KEY = 'consent';
  const root = document.documentElement;

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }

  gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied'
  });

  /* ---------- Events (they only leave the browser once GTM is loaded) ---------- */
  const lang = () => (root.lang.startsWith('fr') ? 'fr' : 'en');
  const track = (event, params) => window.dataLayer.push(Object.assign({ event, page_language: lang() }, params || {}));
  const area = (el) => {
    if (el.closest('.hero')) return 'hero';
    if (el.closest('.contact')) return 'contact';
    if (el.closest('.footer')) return 'footer';
    return 'page';
  };

  document.addEventListener('click', (e) => {
    const el = e.target.closest('a, button');
    if (!el) return;
    const href = el.getAttribute('href') || '';
    if (/\.pdf$/i.test(href)) track('cv_download', { file_name: href.split('/').pop(), link_location: area(el) });
    else if (href.startsWith('mailto:')) track('email_click', { link_location: area(el) });
    else if (href.includes('linkedin.com')) track('linkedin_click', { link_location: area(el) });
    else if (el.hasAttribute('data-copy')) track('email_copy', { link_location: area(el) });
    else if (el.hasAttribute('data-zoom')) {
      const img = el.querySelector('img');
      track('lightbox_open', { image: img ? img.getAttribute('src').split('/').pop() : '' });
    } else if (el.hasAttribute('data-lang')) track('language_switch', { language: el.dataset.lang });
  });

  document.querySelectorAll('video').forEach((video) => {
    video.addEventListener('play', () => track('video_play', { video: (video.currentSrc || '').split('/').pop() }), { once: true });
  });

  /* ---------- Consent ---------- */
  if (!GTM_ID) return;

  const read = () => { try { return localStorage.getItem(KEY); } catch (e) { return null; } };
  const write = (value) => { try { localStorage.setItem(KEY, value); } catch (e) {} };

  let loaded = false;
  const loadGtm = () => {
    if (loaded) return;
    loaded = true;
    window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtm.js?id=' + encodeURIComponent(GTM_ID);
    document.head.appendChild(s);
  };

  const dropCookies = () => {
    document.cookie.split(';').forEach((c) => {
      const name = c.split('=')[0].trim();
      if (!/^_ga/.test(name)) return;
      const host = location.hostname;
      [host, '.' + host, '.' + host.split('.').slice(-2).join('.')].forEach((domain) => {
        document.cookie = name + '=; Max-Age=0; path=/; domain=' + domain;
      });
      document.cookie = name + '=; Max-Age=0; path=/';
    });
  };

  const grant = () => {
    gtag('consent', 'update', { analytics_storage: 'granted' });
    loadGtm();
  };
  const deny = () => {
    gtag('consent', 'update', { analytics_storage: 'denied' });
    dropCookies();
  };

  const TEXT = {
    en: {
      body: 'This site uses Google Analytics to see which pages and links are used. Nothing is measured unless you accept.',
      more: 'Privacy details',
      yes: 'Accept',
      no: 'Refuse',
      label: 'Cookie consent'
    },
    fr: {
      body: 'Ce site utilise Google Analytics pour savoir quelles pages et quels liens sont consultés. Rien n’est mesuré sans votre accord.',
      more: 'En savoir plus',
      yes: 'Accepter',
      no: 'Refuser',
      label: 'Consentement aux cookies'
    }
  };

  let banner = null;
  const legalHref = () => (document.querySelector('a[href$="legal.html"]') || { getAttribute: () => '/legal.html' }).getAttribute('href');
  const paint = () => {
    if (!banner) return;
    const t = TEXT[lang()];
    banner.setAttribute('aria-label', t.label);
    banner.querySelector('[data-consent-text]').textContent = t.body + ' ';
    const more = banner.querySelector('[data-consent-more]');
    more.textContent = t.more;
    more.setAttribute('href', legalHref());
    banner.querySelector('[data-consent-yes]').textContent = t.yes;
    banner.querySelector('[data-consent-no]').textContent = t.no;
  };
  const close = () => { if (banner) { banner.remove(); banner = null; } };
  const show = () => {
    if (banner) return;
    banner = document.createElement('section');
    banner.className = 'consent';
    banner.setAttribute('role', 'region');
    banner.innerHTML = '<p><span data-consent-text></span><a data-consent-more></a></p>' +
      '<div class="consent__actions">' +
      '<button class="btn btn--outline" type="button" data-consent-no></button>' +
      '<button class="btn btn--outline" type="button" data-consent-yes></button>' +
      '</div>';
    banner.querySelector('[data-consent-yes]').addEventListener('click', () => { write('granted'); grant(); close(); });
    banner.querySelector('[data-consent-no]').addEventListener('click', () => { write('denied'); deny(); close(); });
    document.body.appendChild(banner);
    paint();
  };
  document.addEventListener('langchange', paint);

  document.querySelectorAll('[data-consent-item]').forEach((el) => { el.hidden = false; });
  document.querySelectorAll('[data-consent-open]').forEach((btn) => btn.addEventListener('click', show));

  const choice = read();
  if (choice === 'granted') grant();
  else if (choice !== 'denied') show();
})();
