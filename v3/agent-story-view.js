/* A local, clock-driven continuation using Oakbase's original agent card. */
(() => {
  'use strict';
  let instanceCount = 0;
  const clamp = value => Math.max(0, Math.min(1, Number.isFinite(Number(value)) ? Number(value) : 0));

  function create({ viewport, onInteract = () => {} } = {}) {
    if (!viewport || typeof viewport.append !== 'function') {
      throw new TypeError('OakbaseAgentStory requires a viewport element.');
    }
    const source = document.querySelector('.oa-scene .oa-agent-card:not(.oa-video-agent-card)')
      || document.querySelector('.oa-agent-card:not(.oa-video-agent-card)');
    if (!source) throw new Error('The original Oakbase agent card was not found.');

    const prefix = `oa-video-agent-${++instanceCount}`;
    const element = document.createElement('section');
    element.className = 'oa-video-agent-scene';
    element.hidden = true;
    element.inert = true;
    element.setAttribute('aria-hidden', 'true');
    Object.assign(element.style, {
      position: 'absolute', inset: '0', opacity: '0', pointerEvents: 'none',
      animation: 'none', transition: 'none', transformOrigin: '50% 50%',
    });
    const kicker = document.createElement('p');
    kicker.className = 'oa-video-agent-kicker';
    element.append(kicker);
    viewport.append(element);

    let card = null;
    let progress = 0;
    let motionReduced = false;
    let suppressed = true;
    let openIndex = -1;
    let buttons = [];
    let details = [];
    let firstRow = null;
    let firstFlash = null;

    function stripBindings(clone) {
      for (const node of [clone, ...clone.querySelectorAll('*')]) {
        for (const attribute of [...node.attributes]) {
          const name = attribute.name;
          if (name === 'id' || name === 'data-action' || name === 'data-flash'
            || name.startsWith('data-i18n') || name === 'data-brand'
            || name === 'data-oakbase' || name === 'data-lucide'
            || name === 'aria-controls' || name === 'aria-labelledby'
            || name === 'aria-describedby' || name.startsWith('on')) {
            node.removeAttribute(name);
          }
        }
        // The original may have been animated before it was cloned.
        node.style.removeProperty('animation');
        node.style.removeProperty('transition');
        node.style.animation = 'none';
        node.style.transition = 'none';
      }
    }

    function setText(selector, value) {
      if (typeof value !== 'string') return;
      const target = card.querySelector(selector);
      if (target) target.textContent = value;
    }

    function syncAccordion() {
      buttons.forEach((button, index) => {
        const expanded = index === openIndex;
        button.setAttribute('aria-expanded', String(expanded));
        if (details[index]) details[index].hidden = !expanded;
      });
    }

    function paint() {
      const visible = !suppressed && progress > 0;
      const eased = motionReduced ? (visible ? 1 : 0) : progress * progress * (3 - 2 * progress);
      element.hidden = !visible;
      element.inert = !visible;
      element.setAttribute('aria-hidden', String(!visible));
      element.style.pointerEvents = visible ? 'auto' : 'none';
      element.style.opacity = String(eased);
      element.style.transform = motionReduced
        ? 'none'
        : `translateY(${16 * (1 - eased)}px) scale(${.97 + .03 * eased})`;
      if (firstRow) {
        firstRow.dataset.videoPriority = 'true';
        firstRow.style.backgroundColor = `rgba(20, 20, 20, ${.035 * eased})`;
      }
      if (firstFlash) firstFlash.style.opacity = String(eased);
    }

    function render(copy = {}) {
      const focusedIndex = buttons.indexOf(document.activeElement);
      const next = source.cloneNode(true);
      stripBindings(next);
      next.classList.add('oa-video-agent-card');
      if (typeof copy.ariaLabel === 'string') next.setAttribute('aria-label', copy.ariaLabel);
      const old = card;
      card = next;
      kicker.textContent = typeof copy.kicker === 'string' ? copy.kicker : '';
      kicker.hidden = !kicker.textContent;

      setText('.oa-message-intro', copy.agentIntro);
      setText('.oa-message h2', copy.agentGreeting);
      setText('.oa-agent-name', copy.agentName);
      setText('.oa-agent-status', copy.agentStatus);
      setText('.oa-new', copy.newBriefing);
      setText('.oa-time span', copy.time);
      setText('.oa-message-footer span', copy.footer);

      const rows = [...card.querySelectorAll('.oa-action')];
      firstRow = rows[0] || null;
      if (firstRow) {
        const title = firstRow.querySelector('.oa-action-title');
        const note = firstRow.querySelector('.oa-action-note');
        if (title && typeof copy.taskTitle === 'string') title.textContent = copy.taskTitle;
        if (note && typeof copy.taskNote === 'string') note.textContent = copy.taskNote;
        const detail = firstRow.querySelector('.oa-detail');
        if (detail) {
          const titleParagraph = document.createElement('p');
          const strong = document.createElement('strong');
          strong.textContent = typeof copy.detailTitle === 'string' ? copy.detailTitle : '';
          titleParagraph.append(strong);
          const body = document.createElement('p');
          body.textContent = typeof copy.detailBody === 'string' ? copy.detailBody : '';
          const evidence = document.createElement('p');
          evidence.className = 'oa-video-agent-evidence';
          evidence.textContent = typeof copy.evidence === 'string' ? copy.evidence : '';
          const sources = document.createElement('div');
          sources.className = 'oa-sources';
          const originalOutlook = source.querySelector('.oa-action .oa-sources img[data-brand="outlook"]');
          if (originalOutlook && originalOutlook.getAttribute('src')) {
            const outlook = originalOutlook.cloneNode(true);
            stripBindings(outlook);
            sources.append(outlook);
          }
          const sourceLabel = document.createElement('span');
          sourceLabel.textContent = typeof copy.sourceLabel === 'string' ? copy.sourceLabel : '';
          sources.append(sourceLabel);
          detail.replaceChildren(titleParagraph, body, evidence, sources);
        }
      }

      buttons = rows.map(row => row.querySelector('.oa-action-btn'));
      details = rows.map(row => row.querySelector('.oa-detail'));
      buttons.forEach((button, index) => {
        if (!button || !details[index]) return;
        button.id = `${prefix}-action-${index}`;
        details[index].id = `${prefix}-detail-${index}`;
        button.setAttribute('aria-controls', details[index].id);
        details[index].setAttribute('aria-labelledby', button.id);
        button.addEventListener('click', () => {
          onInteract();
          openIndex = openIndex === index ? -1 : index;
          syncAccordion();
        });
      });
      firstFlash = firstRow?.querySelector('.oa-row-flash') || null;
      card.querySelectorAll('.oa-row-flash').forEach(flash => { flash.style.opacity = '0'; });
      syncAccordion();
      if (old) old.replaceWith(card);
      else element.append(card);
      paint();
      if (focusedIndex >= 0 && !element.hidden) buttons[focusedIndex]?.focus({ preventScroll: true });
      return element;
    }

    function setProgress(value, { reducedMotion = false } = {}) {
      progress = clamp(value);
      motionReduced = Boolean(reducedMotion);
      suppressed = progress === 0;
      paint();
    }

    function hide() {
      suppressed = true;
      openIndex = -1;
      syncAccordion();
      paint();
    }

    render();
    return { element, render, setProgress, hide };
  }

  window.OakbaseAgentStory = Object.freeze({ create });
})();
