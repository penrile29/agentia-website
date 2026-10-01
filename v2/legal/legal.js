(() => {
  const supported = ["es", "en"];
  const storageKey = "oakbase-language";
  const legacyStorageKey = "oakbase-lang";
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
  const initial = supported.includes(fragmentLanguage)
    ? fragmentLanguage
    : supported.includes(requested)
      ? requested
    : supported.includes(saved)
      ? saved
      : browserLanguage.startsWith("es") ? "es" : "en";

  function setLanguage(language, updateUrl = false) {
    if (!supported.includes(language)) return;

    document.documentElement.lang = language;
    document.querySelectorAll("[data-lang]").forEach((panel) => {
      panel.hidden = panel.dataset.lang !== language;
    });
    document.querySelectorAll("[data-legal-lang]").forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.legalLang === language));
    });

    document.querySelectorAll('.legal-nav a').forEach((link) => {
      const url = new URL(link.getAttribute('href'), window.location.href);
      url.searchParams.set('lang', language);
      link.href = url.pathname + url.search + url.hash;
    });

    const title = document.querySelector(`title[data-title-${language}]`);
    if (title) document.title = title.dataset[`title${language[0].toUpperCase()}${language.slice(1)}`] || document.title;

    try {
      localStorage.setItem(storageKey, language);
      localStorage.setItem(legacyStorageKey, language);
    } catch (error) {
      // The page remains usable when storage is unavailable.
    }

    if (updateUrl) {
      const url = new URL(window.location.href);
      url.searchParams.set("lang", language);
      // Switching language must not leave a fragment pointing into the hidden panel.
      if (/^#(es|en)-/.test(url.hash)) url.hash = '';
      window.history.replaceState({}, "", url);
    }
  }

  document.querySelectorAll("[data-legal-lang]").forEach((button) => {
    button.addEventListener("click", () => setLanguage(button.dataset.legalLang, true));
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
    const language = /^#(es|en)-/.exec(window.location.hash)?.[1];
    if (language && language !== document.documentElement.lang) setLanguage(language);
  });
})();
