(() => {
  const supported = ["es", "en"];
  const storageKey = "oakbase-language";
  const legacyStorageKey = "oakbase-lang";
  const route = /^(.*\/)(es|en)(?:\/|$)/.exec(window.location.pathname);
  const routeLanguage = route?.[2];
  const params = new URLSearchParams(window.location.search);
  const requested = params.get("lang");
  let saved = "";

  try {
    saved = localStorage.getItem(storageKey) || localStorage.getItem(legacyStorageKey) || "";
  } catch (error) {
    saved = "";
  }

  const browserLanguage = (navigator.languages?.[0] || navigator.language || "es").toLowerCase();
  const fragmentLanguage = /^#(es|en)-/.exec(window.location.hash)?.[1];
  const initial = routeLanguage || (supported.includes(requested)
      ? requested
    : supported.includes(fragmentLanguage)
      ? fragmentLanguage
    : supported.includes(saved)
      ? saved
      : browserLanguage.startsWith("es") ? "es" : "en");

  function rememberLanguage(language) {
    try {
      localStorage.setItem(storageKey, language);
      localStorage.setItem(legacyStorageKey, language);
    } catch (error) {
      // Language URLs preserve the choice when browser storage is unavailable.
    }
  }

  function languageUrl(href, language) {
    const url = new URL(href, window.location.href);
    if (url.origin !== window.location.origin || !['http:', 'https:', 'file:'].includes(url.protocol)) return url;
    if (routeLanguage) {
      const targetRoute = /^(.*\/)(es|en)(?:\/|$)/.exec(url.pathname);
      if (targetRoute) {
        url.pathname = `${targetRoute[1]}${language}/${url.pathname.slice(targetRoute[0].length)}`;
      } else if (url.pathname.startsWith(route[1])) {
        url.pathname = `${route[1]}${language}/${url.pathname.slice(route[1].length)}`;
      }
      url.searchParams.delete('lang');
    } else {
      url.searchParams.set('lang', language);
    }
    return url;
  }

  function setLanguage(language, updateUrl = false) {
    if (!supported.includes(language)) return;
    if (routeLanguage && language !== routeLanguage) {
      rememberLanguage(language);
      const url = languageUrl(window.location.href, language);
      if (/^#(es|en)-/.test(url.hash)) url.hash = '';
      window.location.assign(url.href);
      return;
    }

    document.documentElement.lang = language;
    document.querySelectorAll("[data-lang]").forEach((panel) => {
      panel.hidden = panel.dataset.lang !== language;
    });
    document.querySelectorAll("[data-legal-lang]").forEach((control) => {
      const selected = String(control.dataset.legalLang === language);
      if (control.tagName === 'A') {
        control.removeAttribute('aria-pressed');
        control.setAttribute('aria-current', selected);
      } else {
        control.setAttribute('aria-pressed', selected);
      }
    });

    document.querySelectorAll('.legal-nav a, .legal-brand, .legal-back').forEach((link) => {
      link.href = languageUrl(link.getAttribute('href'), language).href;
    });

    const title = document.querySelector(`title[data-title-${language}]`);
    if (title) document.title = title.dataset[`title${language[0].toUpperCase()}${language.slice(1)}`] || document.title;

    rememberLanguage(language);

    if (updateUrl) {
      const url = languageUrl(window.location.href, language);
      // Switching language must not leave a fragment pointing into the hidden panel.
      if (/^#(es|en)-/.test(url.hash)) url.hash = '';
      try {
        window.history.replaceState({}, "", url);
      } catch (error) {
        // Some file:// previews restrict history changes; translation stays usable.
      }
    }
  }

  document.querySelectorAll("[data-legal-lang]").forEach((control) => {
    control.addEventListener("click", () => {
      const language = control.dataset.legalLang;
      if (!supported.includes(language)) return;
      if (control.tagName === 'A' && control.getAttribute('href')) {
        rememberLanguage(language);
        return;
      }
      setLanguage(language, true);
    });
  });

  setLanguage(initial);

  document.querySelectorAll('.legal-table-wrap').forEach((table) => {
    table.tabIndex = 0;
    table.setAttribute('role', 'region');
    const panel = table.closest('[data-lang]');
    table.setAttribute('aria-label', panel?.dataset.lang === 'es'
      ? 'Tabla: desplázate horizontalmente para ver todas las columnas'
      : 'Table: scroll horizontally to see all columns');
  });

  window.addEventListener('hashchange', () => {
    if (routeLanguage) return;
    const language = /^#(es|en)-/.exec(window.location.hash)?.[1];
    if (language && language !== document.documentElement.lang) setLanguage(language);
  });
})();
