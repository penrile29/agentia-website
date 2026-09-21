/* Illustrative, locally authored relationships; no client data is fetched. */
(() => {
  'use strict';
  const content = {
  "schemaVersion": 1,
  "illustrative": true,
  "context": "Fictional examples: ACME / Project Atlas for Lead to Matter; Northbridge / Project Cedar for Work to Invoice.",
  "operations": [
    {
      "id": "lead-to-matter",
      "title": "Lead to Matter",
      "description": "Keep relationship and intake records current as enquiries become approved matters.",
      "source": "CRM · Intake records · Engagement approvals",
      "meta": "Illustrative · Acceptance stays with the firm",
      "agentIds": [
        "crm-health",
        "client-intake",
        "conflict-review",
        "matter-opening"
      ]
    },
    {
      "id": "work-to-invoice",
      "title": "Work to Invoice",
      "description": "Turn completed work into reviewed time and invoice-ready records, with less manual administration.",
      "source": "Matter activity · Time records · Billing instructions",
      "meta": "Illustrative · Billing approval required",
      "agentIds": [
        "matter-activity",
        "time-capture",
        "billing-review",
        "invoice"
      ]
    }
  ],
  "agents": [
    {
      "id": "crm-health",
      "operationId": "lead-to-matter",
      "title": "CRM Health",
      "description": "Proposes record updates when authorised client activity suggests the CRM needs review.",
      "source": "CRM · Client correspondence · Meeting notes",
      "meta": "Illustrative · Owner approval before changes",
      "signalIds": [
        "client-meeting"
      ]
    },
    {
      "id": "client-intake",
      "operationId": "lead-to-matter",
      "title": "Client Intake",
      "description": "Organises required client information and surfaces missing intake evidence.",
      "source": "Intake checklist · Client submissions",
      "meta": "Illustrative · Acceptance is a separate decision",
      "signalIds": [
        "information-requested"
      ]
    },
    {
      "id": "conflict-review",
      "operationId": "lead-to-matter",
      "title": "Conflict Review",
      "description": "Assembles relationship evidence and routes possible conflicts to the responsible professional.",
      "source": "Ownership records · Screening exceptions",
      "meta": "Illustrative · No automatic conflict clearance",
      "signalIds": [
        "ownership-supplied",
        "possible-name-match"
      ]
    },
    {
      "id": "matter-opening",
      "operationId": "lead-to-matter",
      "title": "Matter Opening",
      "description": "Prepares matter setup and team handoffs from the firm’s approved engagement decisions.",
      "source": "Approval records · Onboarding checklist",
      "meta": "Illustrative · Approval before record creation",
      "signalIds": [
        "engagement-approved",
        "matter-handoff"
      ]
    },
    {
      "id": "matter-activity",
      "operationId": "work-to-invoice",
      "title": "Matter Activity",
      "description": "Connects authorised work signals to the relevant matter and people.",
      "source": "Email · Documents · Matter records",
      "meta": "Illustrative · Source access applies",
      "signalIds": [
        "draft-reviewed"
      ]
    },
    {
      "id": "time-capture",
      "operationId": "work-to-invoice",
      "title": "Time Capture",
      "description": "Prepares evidence-linked time entries for the professional to review.",
      "source": "Matter activity · Call notes",
      "meta": "Illustrative · Approval before recording time",
      "signalIds": [
        "client-call"
      ]
    },
    {
      "id": "billing-review",
      "operationId": "work-to-invoice",
      "title": "Billing Review",
      "description": "Surfaces gaps and inconsistencies between approved time and agreed billing instructions.",
      "source": "Approved time · Engagement terms",
      "meta": "Illustrative · Exceptions go to the billing team",
      "signalIds": [
        "time-approved"
      ]
    },
    {
      "id": "invoice",
      "operationId": "work-to-invoice",
      "title": "Invoice",
      "description": "Prepares the invoice and supporting detail for billing approval before issue.",
      "source": "Reviewed billing pack · Invoice records",
      "meta": "Illustrative · Approval before issue",
      "signalIds": [
        "invoice-sent"
      ]
    }
  ],
  "signals": [
    {
      "id": "client-meeting",
      "agentId": "crm-health",
      "operationId": "lead-to-matter",
      "title": "Client meeting",
      "description": "The meeting note records ACME’s request for advice on Project Atlas.",
      "source": "Meeting note · Relationship team",
      "meta": "Illustrative · Project Atlas",
      "memory": {
        "title": "An instruction taking shape",
        "description": "ACME’s recorded request is connected to Project Atlas and the relationship team.",
        "source": "Meeting note ↔ Client record",
        "meta": "An enquiry, not an accepted engagement"
      }
    },
    {
      "id": "information-requested",
      "agentId": "client-intake",
      "operationId": "lead-to-matter",
      "title": "Information requested",
      "description": "The intake team asked ACME to provide its entity details.",
      "source": "Email · Intake team",
      "meta": "Illustrative · Project Atlas",
      "memory": {
        "title": "An intake requirement",
        "description": "ACME’s entity-information request is connected to Atlas intake and its required-information checklist.",
        "source": "Intake email ↔ Required information",
        "meta": "Request evidence does not confirm receipt"
      }
    },
    {
      "id": "ownership-supplied",
      "agentId": "conflict-review",
      "operationId": "lead-to-matter",
      "title": "Ownership chart received",
      "description": "ACME supplied an ownership chart for the intake review.",
      "source": "Client submission · Ownership chart",
      "meta": "Illustrative · Project Atlas",
      "memory": {
        "title": "Relationships for review",
        "description": "The supplied ownership chart is connected to ACME’s intake and its screening evidence.",
        "source": "Ownership chart ↔ Client intake",
        "meta": "Evidence supplied, not clearance"
      }
    },
    {
      "id": "possible-name-match",
      "agentId": "conflict-review",
      "operationId": "lead-to-matter",
      "title": "Possible name match",
      "description": "A screening exception flags a possible match requiring professional review.",
      "source": "Screening exception · Intake review",
      "meta": "Illustrative · Project Atlas",
      "memory": {
        "title": "A routed review",
        "description": "The possible match is connected to its screening evidence and the assigned reviewer.",
        "source": "Screening result ↔ Review assignment",
        "meta": "Final decision recorded separately"
      }
    },
    {
      "id": "engagement-approved",
      "agentId": "matter-opening",
      "operationId": "lead-to-matter",
      "title": "Engagement approved",
      "description": "The approval record confirms an authorised partner accepted the Atlas engagement.",
      "source": "Engagement approval · Responsible partner",
      "meta": "Illustrative · Project Atlas",
      "memory": {
        "title": "An accepted engagement",
        "description": "The firm’s acceptance decision is connected to Atlas and its approved engagement terms.",
        "source": "Acceptance decision ↔ Engagement terms",
        "meta": "System actions require their own authority"
      }
    },
    {
      "id": "matter-handoff",
      "agentId": "matter-opening",
      "operationId": "lead-to-matter",
      "title": "Matter handoff assigned",
      "description": "The onboarding checklist assigns Atlas coordination to Pedro.",
      "source": "Onboarding checklist · Matter team",
      "meta": "Illustrative · Project Atlas",
      "memory": {
        "title": "Who coordinates the work",
        "description": "Pedro’s coordination role is connected to Atlas while Juan remains the recorded relationship partner.",
        "source": "Matter assignment ↔ CRM ownership",
        "meta": "Coordination and ownership are distinct"
      }
    },
    {
      "id": "draft-reviewed",
      "agentId": "matter-activity",
      "operationId": "work-to-invoice",
      "title": "Draft reviewed",
      "description": "The document review record connects Ana to the review of Service agreement v4.",
      "source": "Document review record · Service agreement v4",
      "meta": "Illustrative · Project Cedar",
      "memory": {
        "title": "Work connected to its matter",
        "description": "Ana’s documented review is linked to Cedar and the relevant agreement version.",
        "source": "Review record ↔ Matter ↔ Document version",
        "meta": "Activity alone does not establish billable time"
      }
    },
    {
      "id": "client-call",
      "agentId": "time-capture",
      "operationId": "work-to-invoice",
      "title": "Client call recorded",
      "description": "A call note records a 30-minute Cedar update with Northbridge.",
      "source": "Call note · Matter team",
      "meta": "Illustrative · Project Cedar",
      "memory": {
        "title": "Context for a time entry",
        "description": "The recorded call is linked to Northbridge and Cedar as evidence for a proposed time entry.",
        "source": "Call note ↔ Client ↔ Matter",
        "meta": "Professional review before time is recorded"
      }
    },
    {
      "id": "time-approved",
      "agentId": "billing-review",
      "operationId": "work-to-invoice",
      "title": "Time entry approved",
      "description": "Ana approved a 0.5-hour time entry against Cedar.",
      "source": "Time approval record · Ana",
      "meta": "Illustrative · Project Cedar",
      "memory": {
        "title": "Reviewed time for billing",
        "description": "The approved entry is linked to Cedar and the engagement’s billing instructions.",
        "source": "Approved entry ↔ Billing instructions",
        "meta": "Approved time does not mean invoiced"
      }
    },
    {
      "id": "invoice-sent",
      "agentId": "invoice",
      "operationId": "work-to-invoice",
      "title": "Invoice sent",
      "description": "The billing record marks invoice 1042 as sent after approval.",
      "source": "Billing record · Invoice 1042",
      "meta": "Illustrative · Project Cedar",
      "memory": {
        "title": "A billing milestone",
        "description": "Invoice 1042 and its recorded send status are connected to Cedar and the approved billing pack.",
        "source": "Invoice status ↔ Matter ↔ Billing pack",
        "meta": "Sent does not mean paid"
      }
    }
  ]
};
  const stage = document.querySelector('.lean-platform-stage');
  const svg = stage.querySelector('.lean-brain');
  const tooltip = document.getElementById('brain-tooltip');
  const hint = document.getElementById('brain-explore-hint');
  const byId = (items) => new Map(items.map((item) => [item.id, item]));
  const agents = byId(content.agents);
  const operations = byId(content.operations);
  const circles = [...svg.querySelectorAll('.brain-signal')];
  const agentArt = [...svg.querySelectorAll('.brain-agent')];
  const operationArt = [...svg.querySelectorAll('.brain-operation')];
  const links = [...svg.querySelectorAll('.brain-link')];
  // Retain semantic topology independently of the projected screen coordinates.
  const pointAt = new Map(circles.map((circle) => [`${Number(circle.getAttribute('cx')).toFixed(1)} ${Number(circle.getAttribute('cy')).toFixed(1)}`, circle]));
  const linkPoints = new Map(links.map((link) => [link, link.getAttribute('d').slice(1).split('L').map((xy) => pointAt.get(xy))]));
  const ns = 'http://www.w3.org/2000/svg';
  const makeSvg = (tag, attributes) => {
    const element = document.createElementNS(ns, tag);
    Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
    return element;
  };
  const targets = makeSvg('g', { class: 'brain-hit-targets' });
  const ring = makeSvg('circle', { class: 'brain-focus-ring', r: 8, 'aria-hidden': 'true', visibility: 'hidden' });
  const hits = [];
  const highlighted = new Set();
  let activeHit = null;
  let pinned = false;
  let hideTimer;
  let dismissedHit = null;
  const currentLayer = () => stage.dataset.layer;
  const signalMap = new Map();
  const artworkByAgent = new Map();
  const artworkByOperation = new Map();

  const addHit = (element, info) => {
    element.dataset.brainHit = info.kind;
    element.setAttribute('role', 'button');
    element.setAttribute('tabindex', '-1');
    targets.append(element);
    const hit = { element, ...info, available: true };
    hits.push(hit);
    return hit;
  };
  const counts = { 'lead-to-matter': 0, 'work-to-invoice': 0 };
  circles.forEach((circle) => {
    const x = Number(circle.getAttribute('cx'));
    const y = Number(circle.getAttribute('cy'));
    const operationId = x < 360 ? 'lead-to-matter' : 'work-to-invoice';
    const examples = content.signals.filter((signal) => signal.operationId === operationId);
    const signal = examples[counts[operationId]++ % examples.length];
    signalMap.set(circle, signal);
    addHit(makeSvg('circle', { class: 'brain-point-hit', cx: x, cy: y, r: 11 }), { kind: 'signal', x, y, signal, art: circle });
  });
  agentArt.forEach((art, index) => {
    const agent = content.agents[index];
    art.dataset.agentId = agent.id;
    art.dataset.operationId = agent.operationId;
    artworkByAgent.set(agent.id, art);
    const x = Number(art.dataset.x);
    const y = Number(art.dataset.y);
    addHit(makeSvg('circle', { class: 'brain-agent-hit', cx: x, cy: y, r: 26 }), { kind: 'agent', x, y, agent, art });
    const contact = art.querySelector('.brain-agent-contact');
    const connectedPoint = circles.find((circle) => circle.getAttribute('cx') === contact.getAttribute('cx') && circle.getAttribute('cy') === contact.getAttribute('cy'));
    const connectedSignal = content.signals.find((signal) => signal.agentId === agent.id);
    if (connectedPoint && connectedSignal) {
      signalMap.set(connectedPoint, connectedSignal);
      hits.find((hit) => hit.art === connectedPoint).signal = connectedSignal;
    }
  });
  operationArt.forEach((art, index) => {
    const operation = operations.get(art.dataset.operationId);
    artworkByOperation.set(operation.id, art);
    const path = makeSvg('path', { class: 'brain-operation-hit', d: art.querySelector('path').getAttribute('d') });
    // Operation hit regions sit behind individual nodes, so all node targets remain reachable.
    const hit = addHit(path, { kind: 'operation', x: index ? 650 : 70, y: 255, operation, art });
    targets.prepend(hit.element);
  });
  svg.append(targets, ring);
  hits.forEach((hit) => {
    if (hit.signal) hit.element.dataset.signalId = hit.signal.id;
    if (hit.agent) hit.element.dataset.agentId = hit.agent.id;
    hit.element.dataset.operationId = (hit.operation || hit.agent || hit.signal).operationId || hit.operation.id;
  });
  hint.hidden = false;
  const pointerHint = window.matchMedia('(hover: hover)');
  const setHint = () => { hint.firstChild.textContent = pointerHint.matches ? 'Hover to explore ' : 'Tap to explore '; };
  setHint();
  pointerHint.addEventListener('change', setHint);

  // Two continuous examples explain each stage without requiring a hover.
  const exampleCopy = {
    signals: [
      ['Client meeting', 'ACME · Project Atlas'],
      ['30-minute client call', 'Northbridge · Project Cedar']
    ],
    memory: [
      ['ACME ↔ Project Atlas', 'Enquiry linked to the relationship team'],
      ['Northbridge ↔ Project Cedar', 'Call linked to client and matter']
    ],
    agents: [
      ['CRM Health agent', 'Proposes client-record updates'],
      ['Time Capture agent', 'Prepares time entries for review']
    ],
    operations: [
      ['Lead to Matter', '4 agents · Enquiry → Approved matter'],
      ['Work to Invoice', '4 agents · Work → Invoice preparation']
    ]
  };
  const examples = document.createElement('div');
  examples.className = 'brain-examples';
  examples.setAttribute('role', 'group');
  const exampleLeader = makeSvg('svg', { class: 'brain-callout-leader', 'aria-hidden': 'true' });
  examples.append(exampleLeader);
  const exampleCards = ['client-meeting', 'client-call'].map((signalId, index) => {
    const ideal = index ? { x: 480, y: 340 } : { x: 235, y: 155 };
    const hit = hits.filter((item) => item.signal?.id === signalId).sort((a, b) => Math.hypot(a.x - ideal.x, a.y - ideal.y) - Math.hypot(b.x - ideal.x, b.y - ideal.y))[0];
    const card = document.createElement('div');
    card.className = 'brain-callout';
    card.innerHTML = '<strong></strong><span></span>';
    const line = makeSvg('path', {});
    const dot = makeSvg('circle', { r: 7 });
    exampleLeader.append(line, dot);
    examples.append(card);
    return { card, line, dot, signalHit: hit, hit };
  });
  stage.append(examples);
  const exampleMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const signalArt = svg.querySelector('.brain-signals');
  const architecture = stage.querySelector('.lean-architecture');
  const syncExampleLeaders = () => {
    exampleCards.forEach(({ hit, line, dot }) => {
      const reveal = hit.kind === 'signal' ? 1 : Number(hit.art.style.getPropertyValue('--reveal') || 1);
      line.style.opacity = dot.style.opacity = String(reveal);
    });
  };
  const positionExamples = () => {
    const frame = stage.getBoundingClientRect();
    const scene = architecture.getBoundingClientRect();
    const brain = signalArt.getBoundingClientRect();
    const stacked = window.matchMedia('(max-width: 900px)').matches;
    const compact = window.matchMedia('(max-height: 550px) and (max-width: 900px)').matches;
    const topLimit = stacked ? document.getElementById('layer-panel').getBoundingClientRect().bottom - frame.top + 16 : scene.top - frame.top + 14;
    const rowHeight = compact ? Math.max(...exampleCards.map(({ card }) => card.offsetHeight)) : 0;
    exampleLeader.setAttribute('viewBox', `0 0 ${frame.width} ${frame.height}`);
    exampleCards.forEach(({ card, line, dot, hit }, index) => {
      const point = hit.element.getBoundingClientRect();
      const x = point.left + point.width / 2 - frame.left;
      const y = point.top + point.height / 2 - frame.top;
      const width = card.offsetWidth;
      const height = card.offsetHeight;
      const desiredLeft = index ? brain.right - frame.left - width * .3 : brain.left - frame.left - width * .7;
      const left = compact ? (index ? frame.width - width - 18 : 18)
        : Math.max(scene.left - frame.left + 14, Math.min(desiredLeft, frame.width - width - 18));
      const top = compact ? frame.height - rowHeight - 52 : index
        ? Math.min(frame.height - height - 58, brain.bottom - frame.top + 20)
        : Math.max(topLimit, brain.top - frame.top - height - 20);
      card.style.left = `${left}px`;
      card.style.top = `${top}px`;
      const startX = left + width * (index ? .3 : .7);
      const startY = top + (index || compact ? 0 : height);
      const radius = hit.kind === 'agent' ? 17 : 7;
      const endY = y + (index || compact ? radius : -radius);
      const bend = (startY + endY) / 2;
      line.setAttribute('d', `M${startX} ${startY}C${startX} ${bend} ${x} ${bend} ${x} ${endY}`);
      dot.setAttribute('cx', x);
      dot.setAttribute('cy', y);
      dot.setAttribute('r', radius);
    });
  };
  const updateExamples = (animate = true) => {
    const layer = currentLayer();
    const layerName = document.querySelector(`#layer-${layer}`).textContent.replace(/^\d+/, '').trim();
    examples.setAttribute('aria-label', `${layerName} · Two illustrative examples`);
    exampleCards.forEach((example, index) => {
      const signal = example.signalHit.signal;
      example.hit = layer === 'agents' ? hits.find((hit) => hit.agent?.id === signal.agentId)
        : layer === 'operations' ? hits.find((hit) => hit.operation?.id === signal.operationId)
          : example.signalHit;
      example.card.querySelector('strong').textContent = exampleCopy[layer][index][0];
      example.card.querySelector('span').textContent = exampleCopy[layer][index][1];
      example.card.dataset.exampleLayer = layer;
      if (animate && !exampleMotion.matches) {
        example.card.getAnimations().forEach((animation) => animation.cancel());
        example.card.animate([{ opacity: 0, transform: 'translateY(5px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 320, delay: index * 65, fill: 'backwards', easing: 'ease-out' });
      }
    });
    syncExampleLeaders();
    positionExamples();
  };
  window.addEventListener('resize', positionExamples, { passive: true });
  if (document.fonts) document.fonts.ready.then(positionExamples);
  updateExamples(false);

  const getDetail = (hit) => {
    const layer = currentLayer();
    const agent = hit.agent || (hit.signal && agents.get(hit.signal.agentId));
    const operation = hit.operation || operations.get(agent.operationId);
    if (layer === 'operations') return { ...operation, kind: 'Managed Operation', operation, agentIds: operation.agentIds };
    if (layer === 'agents') return { ...agent, title: `${agent.title} agent`, kind: 'Agent', source: operation.title, agent };
    if (layer === 'memory') return { ...hit.signal.memory, kind: 'Firm Memory', signal: hit.signal };
    return { ...hit.signal, kind: 'Work Signal', signal: hit.signal };
  };
  const clearHighlight = () => {
    highlighted.forEach((element) => element.classList.remove('is-inspected'));
    highlighted.clear();
    ring.setAttribute('visibility', 'hidden');
  };
  const highlight = (element) => {
    if (!element) return;
    element.classList.add('is-inspected');
    highlighted.add(element);
  };
  const inspect = (hit, detail) => {
    clearHighlight();
    if (hit.kind !== 'operation') {
      ring.setAttribute('cx', hit.x);
      ring.setAttribute('cy', hit.y);
      ring.setAttribute('r', hit.kind === 'agent' ? 22 : 8);
      ring.setAttribute('visibility', 'visible');
    }
    if (detail.operation) {
      highlight(artworkByOperation.get(detail.operation.id));
      detail.operation.agentIds.forEach((id) => highlight(artworkByAgent.get(id)));
      signalMap.forEach((signal, circle) => { if (signal.operationId === detail.operation.id) highlight(circle); });
    } else if (detail.agent) {
      highlight(artworkByAgent.get(detail.agent.id));
      signalMap.forEach((signal, circle) => { if (signal.agentId === detail.agent.id) highlight(circle); });
    } else {
      highlight(hit.art);
      if (currentLayer() === 'memory') {
        links.forEach((link) => {
          const ends = linkPoints.get(link);
          if (ends.includes(hit.art)) {
            highlight(link);
            ends.forEach(highlight);
          }
        });
      }
    }
  };
  const positionTooltip = (hit) => {
    const frame = stage.getBoundingClientRect();
    const box = hit.element.getBoundingClientRect();
    const width = tooltip.offsetWidth;
    const height = tooltip.offsetHeight;
    const inset = 14;
    const centerX = box.left + box.width / 2 - frame.left;
    const centerY = box.top + box.height / 2 - frame.top;
    let left = centerX + 18;
    if (left + width > frame.width - inset) left = centerX - width - 18;
    left = Math.max(inset, Math.min(left, frame.width - width - inset));
    let top = centerY - height / 2;
    // On touch-sized screens, place the detail above the point when space allows.
    if (!pointerHint.matches || frame.width < 550) top = centerY - height - 20;
    top = Math.max(inset, Math.min(top, frame.height - height - inset));
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
  };
  const closeTooltip = () => {
    window.clearTimeout(hideTimer);
    if (activeHit) activeHit.element.removeAttribute('aria-describedby');
    activeHit = null;
    pinned = false;
    tooltip.hidden = true;
    stage.classList.remove('is-exploring');
    clearHighlight();
  };
  const makeTabStop = (hit) => {
    hits.forEach((other) => { other.element.tabIndex = other === hit ? 0 : -1; });
  };
  const showTooltip = (hit, keepOpen = false) => {
    if (!hit.available) return;
    window.clearTimeout(hideTimer);
    if (activeHit && activeHit !== hit) activeHit.element.removeAttribute('aria-describedby');
    activeHit = hit;
    pinned = keepOpen;
    const detail = getDetail(hit);
    document.getElementById('brain-tooltip-kind').textContent = detail.kind;
    document.getElementById('brain-tooltip-title').textContent = detail.title;
    document.getElementById('brain-tooltip-description').textContent = detail.description;
    document.getElementById('brain-tooltip-source').textContent = detail.source;
    const list = document.getElementById('brain-tooltip-agents');
    list.replaceChildren();
    list.hidden = !detail.agentIds;
    (detail.agentIds || []).forEach((id) => {
      const item = document.createElement('li');
      item.textContent = agents.get(id).title;
      list.append(item);
    });
    tooltip.hidden = false;
    stage.classList.add('is-exploring');
    hit.element.setAttribute('aria-describedby', tooltip.id);
    makeTabStop(hit);
    inspect(hit, detail);
    positionTooltip(hit);
  };
  const deferClose = () => {
    if (pinned) return;
    window.clearTimeout(hideTimer);
    hideTimer = window.setTimeout(closeTooltip, 150);
  };
  const syncAvailability = () => {
    const layer = currentLayer();
    hits.forEach((hit) => {
      const revealed = Number(hit.art.style.getPropertyValue('--reveal') || 1) > .8;
      const available = hit.kind === 'signal' || (revealed && (hit.kind === 'agent' ? ['agents', 'operations'].includes(layer) : layer === 'operations'));
      if (hit.available !== available) {
        hit.available = available;
        hit.element.style.pointerEvents = available ? '' : 'none';
        hit.element.setAttribute('aria-hidden', String(!available));
        if (!available) hit.element.tabIndex = -1;
        else {
          const detail = getDetail(hit);
          hit.element.setAttribute('aria-label', `${detail.kind}: ${detail.title}`);
        }
      }
    });
    if (!hits.some((hit) => hit.available && hit.element.tabIndex === 0)) hits[0].element.tabIndex = 0;
    if (activeHit && !activeHit.available) closeTooltip();
  };
  const updateLabels = () => {
    syncAvailability();
    hits.forEach((hit) => {
      if (hit.available) {
        const detail = getDetail(hit);
        hit.element.setAttribute('aria-label', `${detail.kind}: ${detail.title}`);
      }
    });
  };
  hits.forEach((hit) => {
    const element = hit.element;
    element.addEventListener('pointerenter', (event) => {
      if (event.pointerType === 'touch' || dismissedHit === hit || (pinned && activeHit !== hit)) return;
      showTooltip(hit, pinned && activeHit === hit);
    });
    element.addEventListener('pointerleave', () => { if (dismissedHit === hit) dismissedHit = null; deferClose(); });
    element.addEventListener('focus', () => showTooltip(hit));
    element.addEventListener('blur', (event) => {
      if (event.relatedTarget && !targets.contains(event.relatedTarget) && !tooltip.contains(event.relatedTarget)) closeTooltip();
      else deferClose();
    });
    element.addEventListener('click', () => {
      if (pinned && activeHit === hit) { dismissedHit = hit; closeTooltip(); }
      else { dismissedHit = null; showTooltip(hit, true); }
    });
    element.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        showTooltip(hit, true);
        return;
      }
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const available = hits.filter((other) => other.available);
      let next;
      if (event.key === 'Home') next = available[0];
      else if (event.key === 'End') next = available[available.length - 1];
      else {
        const horizontal = ['ArrowLeft', 'ArrowRight'].includes(event.key);
        const direction = ['ArrowLeft', 'ArrowUp'].includes(event.key) ? -1 : 1;
        next = available.filter((other) => other !== hit && (horizontal ? other.x - hit.x : other.y - hit.y) * direction > 1).sort((a, b) => {
          const score = (other) => Math.hypot(other.x - hit.x, other.y - hit.y) + Math.abs(horizontal ? other.y - hit.y : other.x - hit.x) * 2;
          return score(a) - score(b);
        })[0];
      }
      if (next) { pinned = false; dismissedHit = null; makeTabStop(next); next.element.focus({ preventScroll: true }); }
    });
  });
  tooltip.addEventListener('pointerenter', () => window.clearTimeout(hideTimer));
  tooltip.addEventListener('pointerleave', deferClose);
  svg.addEventListener('click', (event) => {
    if ((pointerHint.matches && event.pointerType !== 'touch') || targets.contains(event.target)) return;
    const nearest = hits.filter((hit) => hit.available && hit.kind !== 'operation').map((hit) => {
      const box = hit.element.getBoundingClientRect();
      return { hit, distance: Math.hypot(event.clientX - box.left - box.width / 2, event.clientY - box.top - box.height / 2) };
    }).sort((a, b) => a.distance - b.distance)[0];
    if (nearest && nearest.distance <= 24) showTooltip(nearest.hit, true);
  });
  document.addEventListener('pointerdown', (event) => {
    if (!tooltip.contains(event.target) && !targets.contains(event.target)) closeTooltip();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && activeHit) { dismissedHit = activeHit; closeTooltip(); }
  });
  window.addEventListener('scroll', closeTooltip, { passive: true });
  window.addEventListener('resize', closeTooltip, { passive: true });
  stage.addEventListener('brain:phasechange', () => { closeTooltip(); dismissedHit = null; updateLabels(); updateExamples(); });
  stage.addEventListener('brain:render', () => { syncAvailability(); syncExampleLeaders(); });
  stage.addEventListener('brain:geometry', () => {
    hits.forEach((hit) => {
      if (hit.kind !== 'signal') return;
      hit.x = Number(hit.art.getAttribute('cx'));
      hit.y = Number(hit.art.getAttribute('cy'));
    });
    if (activeHit) {
      if (activeHit.kind !== 'operation') {
        ring.setAttribute('cx', activeHit.x);
        ring.setAttribute('cy', activeHit.y);
      }
      positionTooltip(activeHit);
    } else positionExamples();
  });
  updateLabels();
})();
