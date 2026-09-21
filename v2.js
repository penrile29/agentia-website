(() => {
  'use strict';

  const one = (selector, root = document) => root.querySelector(selector);
  const all = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const text = (id, value) => { document.getElementById(id).textContent = value; };
  const detailDialog = one('#detail-dialog');
  const enquiry = one('#enquiry');
  const form = one('#assessment-form');

  const layers = {
    signals: {
      description: 'Knowledge in everyday work.',
      link: 'Explore work signals'
    },
    memory: {
      description: 'Knowledge that stays with your firm.',
      link: 'Explore Firm Memory'
    },
    agents: {
      description: 'Prebuilt agents, grounded in your firm.',
      link: 'Explore agents'
    },
    operations: {
      description: 'Less admin. More reliable records.',
      link: 'Explore Managed Operations'
    }
  };
  const layerTabs = all('button[data-layer]');
  const platformStage = one('.lean-platform-stage');
  const signalDots = all('.lean-brain .brain-signal');
  const brainPhases = [
    { elements: all('.lean-brain .brain-link'), start: 0 },
    { elements: all('.lean-brain .brain-agent'), start: 1 },
    { elements: all('.lean-brain .brain-operation'), start: 2 }
  ];
  const scrollTrack = one('.lean-scroll-track');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let scrollDriven = false;
  let scrollFrame = 0;
  let renderedProgress = 0;
  let targetProgress = 0;
  let lastFrameTime = 0;
  let layerNavigation = 0;
  const diagramGeometry = () => ({
    top: scrollTrack.getBoundingClientRect().top,
    stickyTop: parseFloat(window.getComputedStyle(platformStage).top) || 0,
    range: Math.max(0, scrollTrack.offsetHeight - platformStage.offsetHeight)
  });
  const compactLayers = window.matchMedia('(max-width: 900px)');
  const setTabOrientation = () => one('.lean-layer-tabs').setAttribute('aria-orientation', compactLayers.matches ? 'horizontal' : 'vertical');
  setTabOrientation();
  compactLayers.addEventListener('change', setTabOrientation);
  const selectLayer = (button, focus = false, scrollToLayer = true) => {
    const layer = button.dataset.layer;
    layerTabs.forEach((tab) => {
      const active = tab === button;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
    });
    platformStage.dataset.layer = layer;
    platformStage.dispatchEvent(new CustomEvent('brain:phasechange'));
    one('#layer-panel').setAttribute('aria-labelledby', button.id);
    const count = one('#layer-count');
    if (count) count.textContent = `${String(layerTabs.indexOf(button) + 1).padStart(2, '0')} / ${String(layerTabs.length).padStart(2, '0')}`;
    text('layer-description', layers[layer].description);
    one('#layer-more').dataset.detail = layer;
    one('#layer-more').innerHTML = `${layers[layer].link} <span aria-hidden="true">↗</span>`;
    if (focus) button.focus();
    if (scrollToLayer) {
      const navigation = ++layerNavigation;
      const scrollToSelectedLayer = () => {
        if (!scrollDriven || navigation !== layerNavigation) return;
        const geometry = diagramGeometry();
        const index = layerTabs.indexOf(button);
        window.scrollTo({
          top: window.scrollY + geometry.top - geometry.stickyTop + geometry.range * index / (layerTabs.length - 1),
          behavior: 'smooth'
        });
      };
      if (document.fonts && document.fonts.status === 'loading') document.fonts.ready.then(scrollToSelectedLayer);
      else scrollToSelectedLayer();
    }
  };
  layerTabs.forEach((button, index) => {
    button.addEventListener('click', () => selectLayer(button));
    button.addEventListener('keydown', (event) => {
      let next;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % layerTabs.length;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index - 1 + layerTabs.length) % layerTabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = layerTabs.length - 1;
      if (next === undefined) return;
      event.preventDefault();
      selectLayer(layerTabs[next], true);
    });
  });
  selectLayer(layerTabs.find((button) => button.getAttribute('aria-selected') === 'true') || layerTabs[0], false, false);
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) platformStage.classList.add('is-ready');
    });
    observer.observe(platformStage);
  } else {
    platformStage.classList.add('is-ready');
  }

  const readDiagramProgress = () => {
    const geometry = diagramGeometry();
    return geometry.range > 0
      ? Math.max(0, Math.min(3, (geometry.stickyTop - geometry.top) / geometry.range * 3))
      : 0;
  };
  const renderDiagram = (progress, selectActive = true) => {
    platformStage.style.setProperty('--brain-progress', String(progress / 3));
    signalDots.forEach((item) => item.style.setProperty('--reveal', '1'));
    brainPhases.forEach(({ elements, start }) => {
      elements.forEach((item) => {
        const arrival = Math.max(0, Math.min(1, Number(item.dataset.arrival) || 0));
        const phase = Math.max(0, Math.min(1, (progress - start) * 1.3 - arrival * 0.3));
        const reveal = phase * phase * (3 - 2 * phase);
        item.style.setProperty('--reveal', String(reveal));
        item.style.pointerEvents = reveal < 0.1 ? 'none' : '';
      });
    });
    const active = layerTabs[Math.max(0, Math.min(layerTabs.length - 1, Math.ceil(progress - 0.12)))];
    if (selectActive && active.dataset.layer !== platformStage.dataset.layer) selectLayer(active, false, false);
    platformStage.dispatchEvent(new CustomEvent('brain:render'));
  };
  const updateDiagram = (timestamp) => {
    scrollFrame = 0;
    if (!scrollDriven) return;
    const elapsed = Math.max(0, timestamp - lastFrameTime);
    lastFrameTime = timestamp;
    renderedProgress += (targetProgress - renderedProgress) * (1 - Math.exp(-elapsed / 90));
    const settled = Math.abs(targetProgress - renderedProgress) < 0.001;
    if (settled) renderedProgress = targetProgress;
    renderDiagram(renderedProgress);
    if (!settled) scrollFrame = window.requestAnimationFrame(updateDiagram);
  };
  const requestDiagramUpdate = () => {
    if (!scrollDriven) return;
    targetProgress = readDiagramProgress();
    if (!scrollFrame) {
      lastFrameTime = window.performance.now();
      scrollFrame = window.requestAnimationFrame(updateDiagram);
    }
  };
  const configureDiagram = () => {
    window.cancelAnimationFrame(scrollFrame);
    scrollFrame = 0;
    scrollDriven = Boolean(scrollTrack) && !reducedMotion.matches;
    if (scrollTrack) scrollTrack.classList.toggle('is-scroll-driven', scrollDriven);
    platformStage.classList.toggle('is-scroll-driven', scrollDriven);
    targetProgress = scrollDriven ? readDiagramProgress() : 3;
    renderedProgress = targetProgress;
    renderDiagram(renderedProgress, scrollDriven);
  };
  window.addEventListener('scroll', requestDiagramUpdate, { passive: true });
  window.addEventListener('resize', configureDiagram, { passive: true });
  reducedMotion.addEventListener('change', configureDiagram);
  configureDiagram();

  const details = {
    signals: {
      eyebrow: '01 / Work Signals',
      title: 'Expertise leaves a trail.',
      body: `<p>Your professionals build knowledge with every client conversation, decision and piece of work. Much of it stays scattered across inboxes, meeting notes and documents.</p>
        <p>Oakbase captures that recorded know-how from authorised sources and connects it to the people, clients and matters it belongs to.</p>
        <p class="lean-dialog-note">Your CRM, matter and finance systems remain the systems of record.</p>`
    },
    memory: {
      eyebrow: '02 / Firm Memory',
      title: 'Knowledge becomes a firm asset.',
      body: `<p>Firm Memory preserves the expertise, relationships and decisions captured in your people’s work. It gives the firm a connected memory that people can query and agents can act on.</p>
        <details open><summary>Keep what your firm learns</summary><p>Client history, working relationships, instructions and decisions remain available beyond the conversation that created them. Each new piece of work adds to the firm’s knowledge.</p></details>
        <details><summary>Find answers and connections</summary><p>Ask who knows a client, how a matter reached its current position or why a decision was made. Explore how people, clients and work relate, with the supporting sources in view.</p></details>
        <details><summary>Put knowledge to work</summary><p>Prebuilt agents use the same memory to prepare time entries, maintain client records and move operations forward. Reviewed outcomes become context for the next piece of work.</p></details>
        <p class="lean-dialog-note">Access stays scoped to the person or agent using the information.</p>`
    },
    agents: {
      eyebrow: '03 / Agents',
      title: 'Prebuilt. Grounded in your firm.',
      body: `<p>Oakbase’s prebuilt agents work from Firm Memory, connected to the systems your professionals already use. We configure them around your processes, permissions and approval rules.</p>
        <dl class="lean-detail-facts"><div><dt>CRM Health</dt><dd>Keep client records aligned with the latest relationship activity.</dd></div><div><dt>Time Capture</dt><dd>Prepare time entries from work already done, ready for professional review.</dd></div><div><dt>Invoice</dt><dd>Prepare invoice records from reviewed time and billing instructions.</dd></div></dl>
        <p>Less time reconstructing context and updating systems. More time for clients and professional judgement.</p>`
    },
    operations: {
      eyebrow: '04 / Managed Operations',
      title: 'More productive people. Better records.',
      body: `<p>Oakbase brings prebuilt agents together around a complete operation, using the firm’s memory to carry work from one step to the next.</p>
        <dl class="lean-detail-facts"><div><dt>For people</dt><dd>Reduce the administration around client work, with evidence and exceptions ready for review.</dd></div><div><dt>For systems</dt><dd>Keep client, matter, time and billing records aligned with the work actually happening.</dd></div><div><dt>For the firm</dt><dd>Retain reviewed decisions and outcomes as knowledge the next operation can use.</dd></div></dl>
        <p>We configure, run and improve the operation. Your firm sets the rules and retains professional judgement.</p>
        <button class="lean-button" type="button" data-enquiry>Assess an operation <span aria-hidden="true">↗</span></button>`
    },
    governance: {
      eyebrow: 'Visibility & control',
      title: 'See the connections. Set the boundaries.',
      body: `<p>Your firm’s knowledge becomes more useful when you can understand how it connects and control how it is used.</p>
        <dl class="lean-detail-facts"><div><dt>Connections</dt><dd>Explore the relationships between people, clients, matters and sources in the firm’s brain.</dd></div><div><dt>Visibility</dt><dd>See who accessed which information, what agents used and which actions they took.</dd></div><div><dt>Access</dt><dd>Set which information each person and agent may access, and which sources are available to them.</dd></div><div><dt>Actions</dt><dd>Define what agents may do, where approval is required and who handles exceptions.</dd></div></dl>
        <p class="lean-dialog-note">See our <a href="https://oakbase.ai/security/">security</a> and <a href="https://oakbase.ai/privacy/">privacy</a> policies.</p>`
    },
    preview: {
      eyebrow: 'About this preview',
      title: 'A messaging preview.',
      body: `<p>This page presents Oakbase’s positioning around lasting firm memory, prebuilt agents and Managed Operations, with visibility and access controls.</p>
        <p>The examples are illustrative. This website concept is not connected to a firm’s systems and does not demonstrate live access enforcement or agent execution.</p>
        <p>The existing <a href="https://oakbase.ai/privacy/">privacy</a> and <a href="https://oakbase.ai/security/">security</a> pages are unchanged. Product and policy alignment remains part of preparation for a production release.</p>
        <p class="lean-dialog-note">Enquiries are simulated locally. Nothing is sent or saved, and no meeting is booked.</p>`
    }
  };

  const operations = {
    law: [
      {
        title: 'Work to Invoice',
        copy: 'Turn completed work into reviewed time and invoice-ready records, with less manual administration.',
        memory: 'Authorised matter activity, approved time and engagement terms',
        work: 'Matter Activity → Time Capture → Billing Review → Invoice',
        control: 'Professional time review and billing approval before an invoice is issued',
        context: 'Reviewed activity, approved time and verified invoice status'
      },
      {
        title: 'Lead to Matter',
        copy: 'Keep relationship and intake records current as enquiries become approved matters.',
        memory: 'CRM records, client submissions, screening evidence and engagement decisions',
        work: 'CRM Health → Client Intake → Conflict Review → Matter Opening',
        control: 'Professionals decide conflicts and acceptance; authorised staff approve matter creation',
        context: 'Reviewed client facts, acceptance decisions and confirmed matter setup'
      },
      {
        title: 'Matter Coordination',
        copy: 'Keep teams aligned and matter records current as commitments, deadlines and handoffs change.',
        memory: 'Matter instructions, participants, commitments and open questions',
        work: 'Proposed next steps, handoff tracking and surfaced exceptions',
        control: 'Matter team approval for changes to responsibilities or commitments',
        context: 'Confirmed owners, reviewed status changes and resolved handoffs'
      },
      {
        title: 'Partner Briefing',
        copy: 'Prepare for client meetings with the firm’s relationship knowledge, decisions and priorities in one place.',
        memory: 'Authorised client relationships, matter activity and previous decisions',
        work: 'An evidence-linked briefing with priorities and open questions',
        control: 'Partner review of the briefing and any proposed follow-up',
        context: 'Reviewed meeting outcomes, decisions and next commitments'
      },
      {
        title: 'CRM Follow-through',
        copy: 'Keep client records aligned with the latest conversations, decisions and next steps.',
        memory: 'Declared CRM state, client instructions and recent work signals',
        work: 'Evidence-backed update proposals and follow-up tasks',
        control: 'Relationship owner approval before CRM changes or external outreach',
        context: 'Confirmed stages, approved next steps and correction history'
      }
    ],
    wealth: [
      {
        title: 'Client Onboarding',
        copy: 'Reduce onboarding administration and keep client records complete through to account opening.',
        memory: 'Authorised client facts, onboarding requirements and previous submissions',
        work: 'Prepared application packs, missing-evidence tracking and approval routing',
        control: 'Qualified staff approve compliance decisions and account-opening actions',
        context: 'Reviewed client facts, approved submissions and outstanding requirements'
      },
      {
        title: 'Client Review Preparation',
        copy: 'Assemble a coherent review pack so advisers can focus on the client conversation.',
        memory: 'Approved client records, past review decisions and current commitments',
        work: 'An evidence-linked review pack with gaps and questions for the adviser',
        control: 'Advisers validate facts and retain responsibility for advice and recommendations',
        context: 'Reviewed meeting outcomes, client instructions and follow-up commitments'
      },
      {
        title: 'Signing & Records',
        copy: 'Coordinate signature packs and keep completion evidence linked to the right client records.',
        memory: 'Approved documents, signatory roles and filing requirements',
        work: 'Prepared signature packs, completion tracking and filing proposals',
        control: 'Authorised staff approve sending; signatories make their own signing decisions',
        context: 'Verified signature status, filed evidence and unresolved exceptions'
      },
      {
        title: 'Client Data Readiness',
        copy: 'Surface missing or conflicting client information before it blocks the next operation.',
        memory: 'Authorised client facts, provenance and required data fields',
        work: 'Evidence-backed correction proposals and routed data exceptions',
        control: 'Data owners approve changes to client systems of record',
        context: 'Confirmed corrections, reconciled facts and their supporting sources'
      },
      {
        title: 'Operational Reporting',
        copy: 'Spend less time assembling reports, with reconciled figures and their supporting sources ready for review.',
        memory: 'Approved operational records, reporting definitions and prior exceptions',
        work: 'Reconciled reporting packs, exception summaries and draft commentary',
        control: 'Responsible managers validate figures and approve distribution',
        context: 'Reviewed reporting outcomes, resolved discrepancies and agreed actions'
      }
    ]
  };

  let industry = 'law';
  let expanded = false;
  const operationList = one('#operation-list');
  const moreOperations = one('#more-operations');
  const industryButtons = all('[data-industry]');

  const renderOperations = () => {
    const fragment = document.createDocumentFragment();
    operations[industry].forEach((operation, index) => {
      const item = document.createElement('details');
      item.id = `operation-${industry}-${index}`;
      item.name = 'managed-operations';
      item.hidden = index >= 3 && !expanded;
      item.open = index === 0;
      item.innerHTML = `<summary>${operation.title} <span aria-hidden="true">+</span></summary><p>${operation.copy}</p><button class="lean-link" type="button" data-operation="${operation.title}">Explore this operation <span aria-hidden="true">↗</span></button>`;
      fragment.append(item);
    });
    operationList.replaceChildren(fragment);
    operationList.setAttribute('aria-label', industry === 'law' ? 'Law firm operations' : 'Wealth management operations');
    moreOperations.setAttribute('aria-controls', operations[industry].slice(3).map((_, index) => `operation-${industry}-${index + 3}`).join(' '));
    moreOperations.setAttribute('aria-expanded', String(expanded));
    moreOperations.innerHTML = `${expanded ? 'Fewer' : 'More'} operations <span aria-hidden="true">${expanded ? '−' : '+'}</span>`;
  };
  industryButtons.forEach((button) => button.addEventListener('click', () => {
    industry = button.dataset.industry;
    expanded = false;
    industryButtons.forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
    renderOperations();
  }));
  moreOperations.addEventListener('click', () => {
    expanded = !expanded;
    all('details', operationList).forEach((item, index) => {
      if (index < 3) return;
      if (!expanded) item.open = false;
      item.hidden = !expanded;
    });
    moreOperations.setAttribute('aria-expanded', String(expanded));
    moreOperations.innerHTML = `${expanded ? 'Fewer' : 'More'} operations <span aria-hidden="true">${expanded ? '−' : '+'}</span>`;
  });
  // Keep this an accordion in browsers without native named-details support.
  operationList.addEventListener('toggle', (event) => {
    if (!event.target.open) return;
    all('details', operationList).forEach((item) => {
      if (item !== event.target) item.open = false;
    });
  }, true);
  renderOperations();

  const openDialog = (dialog) => {
    [detailDialog, enquiry].forEach((other) => {
      if (other !== dialog && other.open) other.close();
    });
    if (!dialog.open) dialog.showModal();
  };
  const showDetail = (detail) => {
    text('detail-eyebrow', detail.eyebrow);
    text('detail-title', detail.title);
    one('#detail-body').innerHTML = detail.body;
    openDialog(detailDialog);
  };
  document.addEventListener('click', (event) => {
    const button = event.target.closest('[data-detail], [data-operation], [data-enquiry], [data-close]');
    if (!button) return;
    if (button.hasAttribute('data-close')) {
      button.closest('dialog').close();
      return;
    }
    if (button.hasAttribute('data-enquiry')) {
      event.preventDefault();
      const operation = button.dataset.enquiry;
      if (operation) one('#form-operation').value = operation;
      text('form-status', '');
      openDialog(enquiry);
      return;
    }
    if (button.dataset.detail && details[button.dataset.detail]) {
      showDetail(details[button.dataset.detail]);
      return;
    }
    const operation = operations[industry].find((item) => item.title === button.dataset.operation);
    if (!operation) return;
    showDetail({
      eyebrow: 'Illustrative Managed Operation',
      title: operation.title,
      body: `<p>${operation.copy}</p><dl class="lean-detail-facts"><div><dt>Context</dt><dd>${operation.memory}</dd></div><div><dt>Work</dt><dd>${operation.work}</dd></div><div><dt>Control</dt><dd>${operation.control}</dd></div></dl><button class="lean-button" type="button" data-enquiry="${operation.title}">Assess this operation <span aria-hidden="true">↗</span></button>`
    });
  });
  [detailDialog, enquiry].forEach((dialog) => {
    dialog.addEventListener('click', (event) => {
      if (event.target !== dialog) return;
      const bounds = dialog.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
    });
  });

  // Local simulation only: no requests, storage or bookings.
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    text('form-status', 'Preview complete. Nothing was sent or saved, and no assessment or demo has been booked.');
  });
  form.addEventListener('input', () => text('form-status', ''));
  form.addEventListener('change', () => text('form-status', ''));
  enquiry.addEventListener('close', () => {
    form.reset();
    text('form-status', '');
  });
})();
