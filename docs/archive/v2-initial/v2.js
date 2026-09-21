(() => {
  'use strict';

  const one = (selector, root = document) => root.querySelector(selector);
  const all = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const setText = (id, value) => {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
  };

  // This preview never submits, stores or transmits enquiry details.
  const form = one('#assessment-form');
  if (form) {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      setText('form-status', 'Preview complete. This request was simulated locally. Nothing was sent or saved, and no assessment or demo has been booked.');
    });
    form.addEventListener('input', () => setText('form-status', ''));
    form.addEventListener('change', () => setText('form-status', ''));
  }

  const navigation = one('#v2-nav');
  const menu = one('.v2-menu');
  if (navigation && menu) {
    const closeMenu = () => {
      navigation.classList.remove('is-open');
      menu.setAttribute('aria-expanded', 'false');
    };
    menu.addEventListener('click', () => {
      const expanded = menu.getAttribute('aria-expanded') !== 'true';
      navigation.classList.toggle('is-open', expanded);
      menu.setAttribute('aria-expanded', String(expanded));
    });
    navigation.addEventListener('click', (event) => {
      if (event.target.closest('a')) closeMenu();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') {
        closeMenu();
        menu.focus();
      }
    });
    const desktopNavigation = window.matchMedia('(min-width: 900px)');
    desktopNavigation.addEventListener('change', closeMenu);
  }

  const memoryTabs = all('[data-memory-tab]');
  const selectMemory = (selected, focus = false) => {
    memoryTabs.forEach((tab) => {
      const active = tab === selected;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      tab.classList.toggle('is-active', active);
      const panel = document.getElementById(tab.getAttribute('aria-controls'));
      if (panel) {
        panel.hidden = !active;
        panel.tabIndex = active ? 0 : -1;
      }
    });
    if (focus) selected.focus();
  };
  memoryTabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectMemory(tab));
    tab.addEventListener('keydown', (event) => {
      let nextIndex;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') nextIndex = (index + 1) % memoryTabs.length;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') nextIndex = (index - 1 + memoryTabs.length) % memoryTabs.length;
      if (event.key === 'Home') nextIndex = 0;
      if (event.key === 'End') nextIndex = memoryTabs.length - 1;
      if (nextIndex === undefined) return;
      event.preventDefault();
      selectMemory(memoryTabs[nextIndex], true);
    });
  });
  if (memoryTabs.length) selectMemory(memoryTabs.find((tab) => tab.getAttribute('aria-selected') === 'true') || memoryTabs[0]);

  const people = {
    juan: {
      kind: 'FORMAL OWNERSHIP',
      title: 'Juan owns the client relationship.',
      copy: 'The CRM names Juan as ACME’s relationship partner. That is a formal role, not evidence that he coordinates every matter.',
      evidence: 'ACME client record · Relationship partner field'
    },
    pedro: {
      kind: 'CURRENT COORDINATION',
      title: 'Pedro coordinates Project Atlas.',
      copy: 'Authorised matter correspondence and task assignments indicate that Pedro coordinates the current work. That participation does not replace Juan’s formal relationship ownership.',
      evidence: 'Project Atlas correspondence · Current task assignments'
    },
    ana: {
      kind: 'HISTORICAL COLLABORATION',
      title: 'Ana brings experience from earlier work.',
      copy: 'Previous ACME matter records connect Ana to earlier collaboration. They provide a route to relevant experience, without implying she is assigned to Project Atlas today.',
      evidence: 'Prior ACME matter records · Documented collaboration history'
    },
    lucia: {
      kind: 'EXTERNAL EXPERTISE',
      title: 'Lucia contributes external tax expertise.',
      copy: 'The matter’s engagement record identifies Lucia as an external tax adviser. Her role is distinct from firm membership, relationship ownership and permission to access other matters.',
      evidence: 'Project Atlas engagement record · Tax advice correspondence'
    }
  };
  const personButtons = all('[data-person]');
  personButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const person = people[button.dataset.person];
      if (!person) return;
      personButtons.forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
      setText('person-kind', person.kind);
      setText('person-title', person.title);
      setText('person-copy', person.copy);
      setText('person-evidence', person.evidence);
    });
  });

  const reviewToggle = one('#review-toggle');
  const reviewDetail = one('#review-detail');
  if (reviewToggle && reviewDetail) {
    reviewToggle.addEventListener('click', () => {
      const expanded = reviewToggle.getAttribute('aria-expanded') !== 'true';
      reviewToggle.setAttribute('aria-expanded', String(expanded));
      reviewDetail.hidden = !expanded;
    });
  }

  const operations = {
    law: [
      {
        title: 'Time Capture',
        copy: 'Turn authorised work activity into proposed time entries, ready for professional review.',
        memory: 'Matter, client and participant context',
        work: 'Draft entries, supporting evidence and exception review',
        control: 'Professional approval before time is recorded',
        context: 'Reviewed activity-to-matter relationships'
      },
      {
        title: 'Matter Coordination',
        copy: 'Keep matter commitments, deadlines and handoffs connected as the work changes.',
        memory: 'Matter instructions, participants, commitments and open questions',
        work: 'Proposed next steps, handoff tracking and surfaced exceptions',
        control: 'Matter team approval for changes to responsibilities or commitments',
        context: 'Confirmed owners, reviewed status changes and resolved handoffs'
      },
      {
        title: 'Partner Briefing',
        copy: 'Bring the relevant client and matter context together before a partner’s next conversation.',
        memory: 'Authorised client relationships, matter activity and previous decisions',
        work: 'An evidence-linked briefing with priorities and open questions',
        control: 'Partner review of the briefing and any proposed follow-up',
        context: 'Reviewed meeting outcomes, decisions and next commitments'
      },
      {
        title: 'CRM Follow-through',
        copy: 'Identify where recorded stages and next actions may lag behind the work, then prepare a review.',
        memory: 'Declared CRM state, client instructions and recent work signals',
        work: 'Evidence-backed update proposals and follow-up tasks',
        control: 'Relationship owner approval before CRM changes or external outreach',
        context: 'Confirmed stages, approved next steps and correction history'
      },
      {
        title: 'Client Intake',
        copy: 'Coordinate the information and checks needed to decide whether a new instruction can proceed.',
        memory: 'Authorised client identities, known relationships and intake requirements',
        work: 'An intake pack, missing-information requests and routed screening exceptions',
        control: 'The responsible professionals decide conflicts, acceptance and compliance outcomes',
        context: 'Reviewed intake facts, acceptance decisions and their supporting evidence'
      },
      {
        title: 'Client Onboarding',
        copy: 'Turn an accepted instruction into a coordinated handoff to the matter team and its systems.',
        memory: 'Approved intake facts, engagement terms and matter setup requirements',
        work: 'Document collection, setup proposals and tracked onboarding handoffs',
        control: 'Firm approval of engagement, access and record creation',
        context: 'Confirmed matter setup, authorised participants and outstanding obligations'
      }
    ],
    wealth: [
      {
        title: 'Client Onboarding',
        copy: 'Coordinate the documents, evidence and approvals needed to move a client towards account opening.',
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
        copy: 'Bring recurring operational facts together for review without losing their source context.',
        memory: 'Approved operational records, reporting definitions and prior exceptions',
        work: 'Reconciled reporting packs, exception summaries and draft commentary',
        control: 'Responsible managers validate figures and approve distribution',
        context: 'Reviewed reporting outcomes, resolved discrepancies and agreed actions'
      }
    ]
  };
  let industry = 'law';
  let operationIndex = 0;
  const operationList = one('#operation-list');
  const industryButtons = all('[data-industry]');
  const selectOperation = (index) => {
    const operation = operations[industry][index];
    if (!operation) return;
    operationIndex = index;
    all('[data-operation]', operationList).forEach((button) => {
      const active = Number(button.dataset.operation) === index;
      button.setAttribute('aria-pressed', String(active));
      button.classList.toggle('is-active', active);
    });
    ['title', 'copy', 'memory', 'work', 'control', 'context'].forEach((key) => setText(`operation-${key}`, operation[key]));
  };
  const renderOperations = () => {
    if (!operationList) return;
    const fragment = document.createDocumentFragment();
    operations[industry].forEach((operation, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.operation = String(index);
      const number = document.createElement('span');
      number.textContent = String(index + 1).padStart(2, '0');
      const arrow = document.createElement('b');
      arrow.setAttribute('aria-hidden', 'true');
      arrow.textContent = '↗';
      button.append(number, document.createTextNode(operation.title), arrow);
      fragment.append(button);
    });
    operationList.replaceChildren(fragment);
    operationList.setAttribute('aria-label', industry === 'law' ? 'Explore law firm operations' : 'Explore wealth management operations');
    selectOperation(0);
  };
  if (operationList) {
    operationList.addEventListener('click', (event) => {
      const button = event.target.closest('[data-operation]');
      if (button && operationList.contains(button)) selectOperation(Number(button.dataset.operation));
    });
    industryButtons.forEach((button) => {
      button.addEventListener('click', () => {
        if (!operations[button.dataset.industry]) return;
        industry = button.dataset.industry;
        industryButtons.forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
        renderOperations();
      });
    });
    selectOperation(0);
  }

  const operationCTA = one('#operation-cta');
  if (operationCTA && form) {
    operationCTA.addEventListener('click', () => {
      const operationField = one('#form-operation', form);
      const industryField = one('[name="industry"]', form);
      if (operationField) operationField.value = operations[industry][operationIndex].title;
      if (industryField) industryField.value = industry;
      setText('form-heading', 'Assess an operation');
      setText('form-status', '');
    });
  }

  const compoundStages = [
    {
      chips: ['People', 'Matters', 'Reviewed activity'],
      description: 'Time Capture connects reviewed work to people and matters. This context can support the next operation.'
    },
    {
      chips: ['People', 'Matters', 'Reviewed activity', 'Commitments', 'Deadlines', 'Confirmed handoffs'],
      description: 'Matter Coordination builds on reviewed activity and adds confirmed commitments, deadlines and handoffs. Both operations can reuse the authorised context.'
    },
    {
      chips: ['People', 'Matters', 'Reviewed activity', 'Commitments', 'Deadlines', 'Confirmed handoffs', 'Reviewed decisions', 'Follow-up priorities'],
      description: 'Partner Briefing draws on activity and coordination context, then contributes reviewed decisions and follow-up priorities. The same governed memory supports all three operations.'
    }
  ];
  const compoundButtons = all('[data-compound]');
  const compoundChips = one('#compound-chips');
  const selectCompound = (index) => {
    const stage = compoundStages[index];
    if (!stage || !compoundChips) return;
    compoundButtons.forEach((button) => {
      const buttonIndex = Number(button.dataset.compound);
      button.setAttribute('aria-pressed', String(buttonIndex === index));
      button.classList.toggle('is-included', buttonIndex <= index);
    });
    const chips = stage.chips.map((label) => {
      const chip = document.createElement('span');
      chip.textContent = label;
      return chip;
    });
    compoundChips.replaceChildren(...chips);
    setText('compound-description', stage.description);
  };
  compoundButtons.forEach((button) => button.addEventListener('click', () => selectCompound(Number(button.dataset.compound))));
  selectCompound(0);

  const bookDemo = one('#book-demo');
  if (bookDemo && form) {
    bookDemo.addEventListener('click', () => {
      setText('form-heading', 'Book a demo');
      setText('form-status', '');
      window.location.hash = 'assessment';
      const name = one('[name="name"]', form);
      if (name) name.focus({ preventScroll: true });
    });
  }

  const systemVisual = one('.v2-system-visual');
  const systemSteps = all('article[data-system-step]');
  const systemProgress = all('.v2-system-progress a');
  if (systemVisual && systemSteps.length) {
    const motionDesktop = window.matchMedia('(min-width: 900px) and (prefers-reduced-motion: no-preference)');
    let activeStage = -1;
    let framePending = false;
    const setStage = (stage) => {
      if (stage === activeStage) return;
      activeStage = stage;
      systemVisual.dataset.stage = String(stage);
      systemSteps.forEach((step) => step.classList.toggle('is-active', Number(step.dataset.systemStep) === stage));
      systemProgress.forEach((link, index) => {
        if (index === stage) link.setAttribute('aria-current', 'step');
        else link.removeAttribute('aria-current');
      });
    };
    const updateSystem = () => {
      framePending = false;
      if (!motionDesktop.matches) return;
      const midpoint = window.innerHeight * 0.5;
      let nearest = 0;
      let distance = Infinity;
      systemSteps.forEach((step, index) => {
        const rect = step.getBoundingClientRect();
        const candidate = Math.abs(rect.top + rect.height * 0.5 - midpoint);
        if (candidate < distance) {
          nearest = index;
          distance = candidate;
        }
      });
      setStage(Number(systemSteps[nearest].dataset.systemStep));
    };
    const scheduleSystem = () => {
      if (!motionDesktop.matches || framePending) return;
      framePending = true;
      window.requestAnimationFrame(updateSystem);
    };
    const syncMotion = () => {
      activeStage = -1;
      if (motionDesktop.matches) scheduleSystem();
      else {
        // Compact and reduced-motion layouts show the complete architecture.
        systemVisual.dataset.stage = '5';
        systemSteps.forEach((step) => step.classList.remove('is-active'));
        systemProgress.forEach((link) => link.removeAttribute('aria-current'));
      }
    };
    systemProgress.forEach((link, index) => {
      link.addEventListener('click', () => {
        if (motionDesktop.matches) setStage(index);
      });
    });
    window.addEventListener('scroll', scheduleSystem, { passive: true });
    window.addEventListener('resize', scheduleSystem, { passive: true });
    window.addEventListener('load', scheduleSystem, { once: true });
    motionDesktop.addEventListener('change', syncMotion);
    if (document.fonts) document.fonts.ready.then(scheduleSystem);
    syncMotion();
  }

  // Only enable enhanced layouts once every control has its behaviour attached.
  document.documentElement.classList.add('v2-js');
})();
