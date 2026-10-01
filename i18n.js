(() => {
  'use strict';

  const supported = ['en', 'es'];
  const storageKey = 'oakbase-language';
  const legacyStorageKey = 'oakbase-lang';
  const catalogs = {
    en: { ...window.OakbaseStaticCopy?.en, ...window.OakbaseDynamicCopy?.en },
    es: { ...window.OakbaseStaticCopy?.es, ...window.OakbaseDynamicCopy?.es },
  };
  const requested = new URLSearchParams(window.location.search).get('lang');
  let saved = '';
  try {
    saved = localStorage.getItem(storageKey) || localStorage.getItem(legacyStorageKey) || '';
  } catch (_) {
    // Language controls still work when browser storage is unavailable.
  }
  const browserLanguage = (navigator.languages?.[0] || navigator.language || 'en').toLowerCase();
  let language = supported.includes(requested) ? requested
    : supported.includes(saved) ? saved
      : browserLanguage.startsWith('es') ? 'es' : 'en';

  function t(key, values = {}) {
    const copy = catalogs[language][key] ?? catalogs.en[key] ?? key;
    return String(copy).replace(/\{(\w+)\}/g, (match, name) =>
      Object.prototype.hasOwnProperty.call(values, name) ? String(values[name]) : match);
  }

  function setLanguage(next, updateUrl = false) {
    if (!supported.includes(next)) return;
    language = next;
    document.documentElement.lang = language;
    document.querySelectorAll('[data-i18n]').forEach(element => {
      element.textContent = t(element.dataset.i18n);
    });
    document.querySelectorAll('[data-i18n-html]').forEach(element => {
      // Only trusted, locally authored copy with its original markup is used here.
      element.innerHTML = t(element.dataset.i18nHtml);
    });
    for (const attribute of ['aria-label', 'aria-description', 'title', 'alt', 'content', 'placeholder']) {
      document.querySelectorAll(`[data-i18n-${attribute}]`).forEach(element => {
        element.setAttribute(attribute, t(element.getAttribute(`data-i18n-${attribute}`)));
      });
    }
    document.querySelectorAll('[data-home-lang]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.homeLang === language));
    });
    document.querySelectorAll('.oa-site-footer nav a').forEach(link => {
      const url = new URL(link.getAttribute('href'), window.location.href);
      url.searchParams.set('lang', language);
      link.href = url.href;
    });
    try {
      localStorage.setItem(storageKey, language);
      localStorage.setItem(legacyStorageKey, language);
    } catch (_) {
      // The lang query parameter also preserves the choice when following links.
    }
    if (updateUrl) {
      const url = new URL(window.location.href);
      url.searchParams.set('lang', language);
      try {
        window.history.replaceState({}, '', url);
      } catch (_) {
        // Some file:// previews restrict history changes; translation stays usable.
      }
    }
    window.lucide?.createIcons({ attrs: { 'aria-hidden': 'true' } });
    document.dispatchEvent(new CustomEvent('oakbase:languagechange', { detail: { language } }));
  }

  window.OakbaseI18n = Object.freeze({ t, setLanguage, get language() { return language; } });
  document.querySelectorAll('[data-home-lang]').forEach(button => {
    button.addEventListener('click', () => setLanguage(button.dataset.homeLang, true));
  });
  setLanguage(language);
})();
