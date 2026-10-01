(() => {
  'use strict';

  const supported = ['en', 'es'];
  const storageKey = 'oakbase-language';
  const legacyStorageKey = 'oakbase-lang';
  const catalogs = {
    en: { ...window.OakbaseStaticCopy?.en, ...window.OakbaseDynamicCopy?.en },
    es: { ...window.OakbaseStaticCopy?.es, ...window.OakbaseDynamicCopy?.es },
  };
  const route = /^(.*\/)(es|en)(?:\/|$)/.exec(window.location.pathname);
  const routeLanguage = route?.[2];
  const requested = new URLSearchParams(window.location.search).get('lang');
  let saved = '';
  try {
    saved = localStorage.getItem(storageKey) || localStorage.getItem(legacyStorageKey) || '';
  } catch (_) {
    // Language controls still work when browser storage is unavailable.
  }
  const browserLanguage = (navigator.languages?.[0] || navigator.language || 'en').toLowerCase();
  let language = routeLanguage || (supported.includes(requested) ? requested
    : supported.includes(saved) ? saved
      : browserLanguage.startsWith('es') ? 'es' : 'en');

  function rememberLanguage(next) {
    try {
      localStorage.setItem(storageKey, next);
      localStorage.setItem(legacyStorageKey, next);
    } catch (_) {
      // Language URLs preserve the choice when browser storage is unavailable.
    }
  }

  function languageUrl(href, next) {
    const url = new URL(href, window.location.href);
    if (url.origin !== window.location.origin || !['http:', 'https:', 'file:'].includes(url.protocol)) return url;
    if (routeLanguage) {
      const targetRoute = /^(.*\/)(es|en)(?:\/|$)/.exec(url.pathname);
      if (targetRoute) {
        url.pathname = `${targetRoute[1]}${next}/${url.pathname.slice(targetRoute[0].length)}`;
      } else if (url.pathname.startsWith(route[1])) {
        url.pathname = `${route[1]}${next}/${url.pathname.slice(route[1].length)}`;
      }
      url.searchParams.delete('lang');
    } else {
      url.searchParams.set('lang', next);
    }
    return url;
  }

  function t(key, values = {}) {
    const copy = catalogs[language][key] ?? catalogs.en[key] ?? key;
    return String(copy).replace(/\{(\w+)\}/g, (match, name) =>
      Object.prototype.hasOwnProperty.call(values, name) ? String(values[name]) : match);
  }

  function setLanguage(next, updateUrl = false) {
    if (!supported.includes(next)) return;
    if (routeLanguage && next !== routeLanguage) {
      // A static language URL must always retain its matching rendered language.
      rememberLanguage(next);
      window.location.assign(languageUrl(window.location.href, next).href);
      return;
    }
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
    document.querySelectorAll('[data-home-lang]').forEach(control => {
      const selected = String(control.dataset.homeLang === language);
      if (control.tagName === 'A') {
        control.removeAttribute('aria-pressed');
        control.setAttribute('aria-current', selected);
      } else {
        control.setAttribute('aria-pressed', selected);
      }
    });
    document.querySelectorAll('.oa-site-footer nav a, [data-contact-privacy]').forEach(link => {
      link.href = languageUrl(link.getAttribute('href'), language).href;
    });
    rememberLanguage(language);
    if (updateUrl) {
      const url = languageUrl(window.location.href, language);
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
  document.querySelectorAll('[data-home-lang]').forEach(control => {
    control.addEventListener('click', () => {
      const next = control.dataset.homeLang;
      if (!supported.includes(next)) return;
      if (control.tagName === 'A' && control.getAttribute('href')) {
        rememberLanguage(next);
        return;
      }
      setLanguage(next, true);
    });
  });
  setLanguage(language);
})();
