/* Public web-to-lead: uses the existing CRM intake, never CRM credentials. */
(() => {
  'use strict';
  const form = document.querySelector('[data-contact-form]');
  if (!form) return;
  const button = form.querySelector('button[type="submit"]');
  const label = form.querySelector('[data-contact-submit]');
  const status = form.querySelector('[data-contact-status]');
  const fields = ['firstName', 'lastName', 'company', 'email', 'phone', 'industry', 'operation', 'websiteUrl'];
  const endpoint = 'https://crm-pi-nine-82.vercel.app/api/public';
  let state = 'idle';

  function render() {
    const key = {sending:'formSending',success:'formSuccess',error:'formError',invalid:'formInvalid',unavailable:'formUnavailable'}[state];
    status.textContent = key ? window.OakbaseI18n.t(key) : '';
    status.dataset.state = state;
    button.disabled = state === 'sending' || state === 'success';
    form.setAttribute('aria-busy', String(state === 'sending'));
    label.textContent = window.OakbaseI18n.t(state === 'sending' ? 'formSending' : 'formSubmit');
  }

  form.addEventListener('input', () => {
    if (state !== 'sending' && state !== 'idle') { state = 'idle'; render(); }
  });
  document.addEventListener('oakbase:languagechange', render);
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (state === 'sending' || state === 'success') return;
    if (!form.reportValidity()) { state = 'invalid'; render(); return; }
    // Local visual previews must never accidentally create commercial records.
    if (!['oakbase.ai', 'www.oakbase.ai', 'penrile29.github.io'].includes(window.location.hostname)) {
      state = 'unavailable'; render(); return;
    }
    const values = new FormData(form);
    const payload = Object.fromEntries(fields.map(name => [name, String(values.get(name) || '').trim()]));
    payload.email = payload.email.toLowerCase();
    // Deliberately omit query strings and fragments, which can contain private data.
    payload.pageUrl = window.location.origin + window.location.pathname;
    payload.language = window.OakbaseI18n.language;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    state = 'sending'; render();
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        credentials: 'omit',
        referrerPolicy: 'origin',
        cache: 'no-store',
        signal: controller.signal,
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      // Show success only after the CRM explicitly confirms creation of a lead.
      if (!response.ok || result?.ok !== true || typeof result.leadId !== 'string' || !result.leadId.trim()) {
        throw new Error('Lead creation was not confirmed');
      }
      form.reset(); state = 'success';
    } catch (_) {
      // Preserve input on network, validation or unconfirmed delivery errors.
      state = 'error';
    } finally {
      clearTimeout(timeout); render(); status.focus({preventScroll:true});
    }
  });
  render();
})();
