#!/usr/bin/env node
'use strict';

// Exercise the actual browser module with an isolated DOM and fetch recorder.
// No network connection or commercial record is created by this check.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const filename = path.resolve(process.argv[2] || path.join(__dirname, '..', 'v2', 'contact.js'));
const source = fs.readFileSync(filename, 'utf8');
const endpoint = 'https://crm-pi-nine-82.vercel.app/api/public';
const example = {
  firstName: '  Ana  ', lastName: '  García ', company: ' Olivar SL ',
  email: '  ANA@EXAMPLE.ES  ', phone: ' +34 600 123 456 ',
  industry: ' legal ', operation: ' time capture ', websiteUrl: '',
  privateToken: 'must-not-be-sent', tracking: 'must-not-be-sent',
};
const confirmed = () => ({ ok: true, json: async () => ({ ok: true, leadId: 'lead-test-1' }) });

function eventTarget(extra = {}) {
  const listeners = new Map();
  return Object.assign({
    addEventListener(type, callback) {
      if (!listeners.has(type)) listeners.set(type, []);
      listeners.get(type).push(callback);
    },
    emit(type, event = {}) {
      return Promise.all((listeners.get(type) || []).map(callback => callback(event)));
    },
  }, extra);
}

function setup({ url = 'https://oakbase.ai/es/?private=value#client-note', valid = true,
                 fetchReply = async () => confirmed() } = {}) {
  const requests = [], timers = new Map(), attributes = {};
  let timerId = 0, language = 'es';
  const button = { disabled: false }, label = { textContent: '' };
  const status = {
    textContent: '', dataset: {}, focusCalls: [],
    focus(options) { this.focusCalls.push(options); },
  };
  const form = eventTarget({
    values: { ...example }, resetCount: 0, validityChecks: 0,
    querySelector(selector) {
      return { 'button[type="submit"]': button, '[data-contact-submit]': label,
        '[data-contact-status]': status }[selector] || null;
    },
    setAttribute(name, value) { attributes[name] = value; },
    reportValidity() { this.validityChecks++; return valid; },
    reset() { this.resetCount++; this.values = Object.fromEntries(Object.keys(this.values).map(key => [key, ''])); },
  });
  const document = eventTarget({ querySelector: selector => selector === '[data-contact-form]' ? form : null });
  const window = {
    location: new URL(url),
    OakbaseI18n: { get language() { return language; }, t: key => `${language}:${key}` },
  };
  const context = vm.createContext({
    window, document, AbortController,
    FormData: class {
      constructor(target) { this.values = { ...target.values }; }
      get(key) { return this.values[key] ?? null; }
    },
    fetch(requestUrl, options) {
      requests.push({ url: requestUrl, options });
      return fetchReply(requestUrl, options);
    },
    setTimeout(callback, delay) { const id = ++timerId; timers.set(id, { callback, delay }); return id; },
    clearTimeout(id) { timers.delete(id); },
  });
  vm.runInContext(source, context, { filename, timeout: 1000 });
  return {
    form, button, label, status, attributes, requests, timers,
    submit() {
      const event = { prevented: false, preventDefault() { this.prevented = true; } };
      const pending = form.emit('submit', event);
      assert.equal(event.prevented, true, 'submit must prevent native form navigation');
      return pending;
    },
    input() { return form.emit('input'); },
    changeLanguage(next) { language = next; return document.emit('oakbase:languagechange'); },
  };
}

function preservedFailure(harness, original, expectedState = 'error') {
  assert.equal(harness.status.dataset.state, expectedState);
  assert.equal(harness.form.resetCount, 0, 'failed delivery must not clear entered fields');
  assert.deepEqual(harness.form.values, original);
  assert.equal(harness.button.disabled, false, 'failed delivery must allow correction/retry');
  assert.equal(harness.attributes['aria-busy'], 'false');
  assert.equal(harness.timers.size, 0, 'completed requests must clear their timeout');
}

const tests = [];
const test = (name, run) => tests.push({ name, run });

test('one allowlisted payload with normalized email and private URL parts omitted', async () => {
  const app = setup();
  await app.submit();
  assert.equal(app.requests.length, 1);
  const request = app.requests[0], options = request.options;
  assert.equal(request.url, endpoint);
  assert.equal(options.method, 'POST');
  assert.equal(options.headers['Content-Type'], 'application/json');
  assert.equal(options.credentials, 'omit');
  assert.equal(options.referrerPolicy, 'origin');
  assert.equal(options.cache, 'no-store');
  assert.ok(options.signal instanceof AbortSignal);
  assert.deepEqual(JSON.parse(options.body), {
    firstName: 'Ana', lastName: 'García', company: 'Olivar SL', email: 'ana@example.es',
    phone: '+34 600 123 456', industry: 'legal', operation: 'time capture', websiteUrl: '',
    pageUrl: 'https://oakbase.ai/es/', language: 'es',
  });
  assert.equal(app.status.dataset.state, 'success');
  assert.equal(app.form.resetCount, 1);
  assert.equal(app.button.disabled, true);
  assert.equal(app.attributes['aria-busy'], 'false');
  assert.equal(app.timers.size, 0);
});

test('invalid required fields never submit', async () => {
  const app = setup({ valid: false }), original = { ...app.form.values };
  app.form.values.email = '';
  original.email = '';
  await app.submit();
  assert.equal(app.form.validityChecks, 1);
  assert.equal(app.requests.length, 0);
  preservedFailure(app, original, 'invalid');
});

test('localhost, file previews and unrelated hosts never submit', async () => {
  for (const url of ['http://localhost:4176/v2/', 'http://127.0.0.1:4176/v2/',
    'file:///private/tmp/oakbase/index.html', 'https://oakbase.ai.example.test/es/']) {
    const app = setup({ url }), original = { ...app.form.values };
    await app.submit();
    assert.equal(app.requests.length, 0, url);
    preservedFailure(app, original, 'unavailable');
  }
});

const invalidResponses = [
  ['HTTP error despite a success body', () => ({ ok: false, json: async () => ({ ok: true, leadId: 'id' }) })],
  ['ok false', () => ({ ok: true, json: async () => ({ ok: false, leadId: 'id' }) })],
  ['ok string', () => ({ ok: true, json: async () => ({ ok: 'true', leadId: 'id' }) })],
  ['missing leadId', () => ({ ok: true, json: async () => ({ ok: true }) })],
  ['numeric leadId', () => ({ ok: true, json: async () => ({ ok: true, leadId: 42 }) })],
  ['empty leadId', () => ({ ok: true, json: async () => ({ ok: true, leadId: '' }) })],
  ['blank leadId', () => ({ ok: true, json: async () => ({ ok: true, leadId: '   ' }) })],
  ['null JSON', () => ({ ok: true, json: async () => null })],
  ['malformed JSON', () => ({ ok: true, json: async () => { throw new SyntaxError('Malformed JSON'); } })],
  ['network rejection', () => { throw new TypeError('Network unavailable'); }],
];
for (const [name, response] of invalidResponses) {
  test(`${name} retains the entered fields`, async () => {
    const app = setup({ fetchReply: async () => response() }), original = { ...app.form.values };
    await app.submit();
    assert.equal(app.requests.length, 1);
    preservedFailure(app, original);
  });
}

test('concurrent submissions and language changes preserve the pending request', async () => {
  let resolveRequest;
  const delivery = new Promise(resolve => { resolveRequest = resolve; });
  const app = setup({ fetchReply: () => delivery });
  const first = app.submit();
  await app.submit();
  assert.equal(app.requests.length, 1);
  assert.equal(app.status.dataset.state, 'sending');
  assert.equal(app.button.disabled, true);
  assert.equal(app.attributes['aria-busy'], 'true');
  assert.equal(app.form.resetCount, 0);
  await app.changeLanguage('en');
  await app.input();
  await app.submit();
  assert.equal(app.requests.length, 1);
  assert.equal(app.status.textContent, 'en:formSending');
  assert.equal(app.label.textContent, 'en:formSending');
  assert.equal(app.button.disabled, true);
  assert.equal(app.attributes['aria-busy'], 'true');
  resolveRequest(confirmed());
  await first;
  assert.equal(app.status.textContent, 'en:formSuccess');
  assert.equal(app.form.resetCount, 1);
  assert.equal(app.button.disabled, true);
  assert.ok(Object.values(app.form.values).every(value => value === ''));
  assert.equal(app.status.focusCalls.length, 1);
  assert.equal(app.status.focusCalls[0].preventScroll, true);
  await app.submit();
  await app.changeLanguage('es');
  assert.equal(app.requests.length, 1, 'success must suppress another submit until new input');
  assert.equal(app.button.disabled, true);
  app.form.values.firstName = 'Laura';
  await app.input();
  assert.equal(app.status.dataset.state, 'idle');
  assert.equal(app.button.disabled, false);
  assert.equal(app.status.textContent, '');
  assert.equal(app.label.textContent, 'es:formSubmit');
});

test('the timeout aborts delivery and preserves fields for retry', async () => {
  const app = setup({ fetchReply: (_url, options) => new Promise((_resolve, reject) => {
    options.signal.addEventListener('abort', () => reject(new Error('Aborted')), { once: true });
  }) });
  const original = { ...app.form.values }, submission = app.submit();
  assert.equal(app.timers.size, 1);
  const timer = [...app.timers.values()][0];
  assert.equal(timer.delay, 20000);
  timer.callback();
  await submission;
  assert.equal(app.requests[0].options.signal.aborted, true);
  preservedFailure(app, original);
});

(async () => {
  let failed = 0;
  for (const item of tests) {
    let watchdog;
    try {
      await Promise.race([
        item.run(),
        new Promise((_resolve, reject) => {
          watchdog = setTimeout(() => reject(new Error('Scenario did not settle; a mocked request may be stuck.')), 1500);
        }),
      ]);
    }
    catch (error) { failed++; console.error(`FAIL: ${item.name}\n${error.stack || error.message}`); }
    finally { clearTimeout(watchdog); }
  }
  if (failed) {
    console.error(`Contact form check failed: ${failed}/${tests.length} scenarios.`);
    process.exitCode = 1;
  } else {
    console.log(`PASS: ${tests.length} contact form scenarios; all fetches mocked, no network or CRM records.`);
  }
})();
