#!/usr/bin/env node
'use strict';

// Validate the authored graph independently of rendering, animation and layout.
// Usage: node tools/check_firm_graph.cjs [directory-containing-firm-graph.js]
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const directory = path.resolve(process.argv[2] || path.join(__dirname, '..', 'v2'));
const errors = [];
const check = (condition, message) => { if (!condition) errors.push(message); };
const nonempty = value => typeof value === 'string' && value.trim().length > 0;
const evidenceKinds = ['Document', 'Source', 'Commitment'];
const brands = new Set([
  'Oakbase', 'Teams', 'Microsoft Teams', 'Outlook', 'Microsoft Outlook',
  'Calendar', 'Google Calendar', 'Microsoft Calendar', 'WhatsApp',
  'OneNote', 'Microsoft OneNote', 'Gmail', 'Slack', 'Salesforce',
  'HubSpot', 'Dynamics', 'Dynamics 365', 'Microsoft Dynamics 365', 'Clio',
  'Claude', 'ChatGPT', 'Copilot', 'Microsoft Copilot',
]);
const numericName = /^[\d\s.,+\-−–—/:%€$£()]+$/u;

function loadGraph() {
  const context = vm.createContext({ window: {} });
  for (const filename of ['i18n-static.js', 'i18n-dynamic.js', 'firm-graph.js']) {
    const source = fs.readFileSync(path.join(directory, filename), 'utf8');
    vm.runInContext(source, context, { filename, timeout: 2000 });
  }
  if (typeof context.window.OakbaseFirmGraph?.build !== 'function') {
    throw new Error('firm-graph.js must expose window.OakbaseFirmGraph.build().');
  }
  return {
    graph: vm.runInContext('window.OakbaseFirmGraph.build()', context, { timeout: 5000 }),
    spanish: {
      ...context.window.OakbaseStaticCopy?.es,
      ...context.window.OakbaseDynamicCopy?.es,
    },
  };
}

function validate({ graph, spanish }) {
  if (!graph || !Array.isArray(graph.nodes) || !Array.isArray(graph.connections)) {
    throw new Error('build() must return { nodes: [...], connections: [...] }.');
  }
  const { nodes, connections } = graph;
  const byId = new Map();
  for (const [index, node] of nodes.entries()) {
    if (!node || typeof node !== 'object') {
      errors.push(`Node ${index} must be an object.`);
      continue;
    }
    check(nonempty(node.id), `Node ${index} has no nonempty string id.`);
    check(!byId.has(node.id), `Duplicate node id: ${node.id}.`);
    if (nonempty(node.id) && !byId.has(node.id)) byId.set(node.id, node);
    check(nonempty(node.kind), `Node ${node.id} has no kind.`);
    check(nonempty(node.name), `Node ${node.id} has no nonempty name.`);
    if (nonempty(node.name)) {
      const translated = Object.prototype.hasOwnProperty.call(spanish, node.name) && nonempty(spanish[node.name]);
      check(translated || brands.has(node.name) || numericName.test(node.name),
        `Node ${node.id}: missing Spanish name translation for ${JSON.stringify(node.name)}.`);
    }
  }
  const clients = nodes.filter(node => node?.kind === 'Client');
  const matters = nodes.filter(node => node?.kind === 'Matter');
  check(clients.length === 40, `Expected 40 clients; found ${clients.length}.`);
  check(matters.length === 120, `Expected 120 matters; found ${matters.length}.`);

  const adjacent = new Map([...byId.keys()].map(id => [id, new Set()]));
  const ownedMatters = new Map(clients.map(node => [node.id, new Set()]));
  const matterOwners = new Map(matters.map(node => [node.id, new Set()]));
  const edgeIds = new Set();
  for (const [index, edge] of connections.entries()) {
    if (!edge || typeof edge !== 'object') {
      errors.push(`Connection ${index} must be an object.`);
      continue;
    }
    const from = byId.get(edge.from), to = byId.get(edge.to);
    check(Boolean(from), `Connection ${index}: unknown from endpoint ${edge.from}.`);
    check(Boolean(to), `Connection ${index}: unknown to endpoint ${edge.to}.`);
    check(nonempty(edge.label), `Connection ${index}: missing relationship label.`);
    check(edge.from !== edge.to, `Connection ${index}: self-loop on ${edge.from}.`);
    const edgeId = JSON.stringify([edge.from, edge.to, edge.label]);
    check(!edgeIds.has(edgeId), `Duplicate connection: ${edgeId}.`);
    edgeIds.add(edgeId);
    if (!from || !to || edge.from === edge.to) continue;
    adjacent.get(edge.from).add(edge.to);
    adjacent.get(edge.to).add(edge.from);
    if (edge.label === 'has matter') {
      check(from.kind === 'Client' && to.kind === 'Matter',
        `Invalid has matter connection: ${edge.from} → ${edge.to}.`);
      if (from.kind === 'Client' && to.kind === 'Matter') {
        ownedMatters.get(from.id).add(to.id);
        matterOwners.get(to.id).add(from.id);
        check(to.group === from.id, `Matter ${to.id}: group ${to.group} differs from owner ${from.id}.`);
      }
    }
  }

  for (const node of byId.values()) {
    check(adjacent.get(node.id).size > 0, `Isolated node: ${node.id}.`);
    check(byId.get(node.group)?.kind === 'Client', `Node ${node.id}: group ${node.group} is not a client.`);
    if (node.kind === 'Client') {
      check(node.group === node.id, `Client ${node.id}: group must equal its own id.`);
      check(ownedMatters.get(node.id).size === 3,
        `Client ${node.id}: expected three has matter relationships; found ${ownedMatters.get(node.id).size}.`);
    }
    if (evidenceKinds.includes(node.kind) || node.matter !== undefined) {
      const matter = byId.get(node.matter);
      check(matter?.kind === 'Matter', `Node ${node.id}: matter ${node.matter} is not a valid matter.`);
      if (matter?.kind === 'Matter') {
        check(node.group === matter.group,
          `Node ${node.id}: client group ${node.group} differs from matter ${matter.id} group ${matter.group}.`);
      }
    }
  }

  for (const matter of matters) {
    const owners = matterOwners.get(matter.id);
    check(owners.size === 1, `Matter ${matter.id}: expected one client owner; found ${owners.size}.`);
    // Sources may link through a document or commitment rather than directly
    // to the matter. Traverse only its own evidence, so a link through an
    // unrelated client or matter cannot make an incomplete cluster pass.
    const members = new Set(nodes.filter(node => node?.matter === matter.id).map(node => node.id));
    members.add(matter.id);
    const reached = new Set([matter.id]);
    const queue = [matter.id];
    for (let index = 0; index < queue.length; index++) {
      for (const neighbor of adjacent.get(queue[index]) || []) {
        if (members.has(neighbor) && !reached.has(neighbor)) {
          reached.add(neighbor);
          queue.push(neighbor);
        }
      }
    }
    for (const kind of evidenceKinds) {
      check([...reached].some(id => byId.get(id)?.kind === kind && byId.get(id)?.matter === matter.id),
        `Matter ${matter.id}: missing connected ${kind} with matter=${matter.id}.`);
    }
  }
  return { nodes: nodes.length, connections: connections.length, clients: clients.length, matters: matters.length };
}

try {
  const counts = validate(loadGraph());
  if (errors.length) {
    for (const error of errors.slice(0, 60)) console.error(`FAIL: ${error}`);
    if (errors.length > 60) console.error(`… ${errors.length - 60} further errors omitted.`);
    console.error(`Firm graph check failed: ${errors.length} error(s).`);
    process.exitCode = 1;
  } else {
    console.log(`PASS: ${counts.clients} clients, ${counts.matters} matters, three matters per client; ` +
      `${counts.nodes} unique connected nodes, ${counts.connections} valid connections, ` +
      'matter documents/sources/commitments and Spanish node names.');
  }
} catch (error) {
  console.error(`FAIL: ${error.message}`);
  process.exitCode = 1;
}
