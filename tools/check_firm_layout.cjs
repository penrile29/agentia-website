#!/usr/bin/env node
'use strict';

// Exercise the constellation layout without a browser or animation loop.
// Usage: node tools/check_firm_layout.cjs [directory-containing-firm-layout.js]
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const directory = path.resolve(process.argv[2] || path.join(__dirname, '..', 'v2'));
const viewports = [[280, 1182], [342, 846], [600, 720], [800, 720], [1166, 720]];
const margin = 12;
// A 24px diameter is a minimum usable target, rather than a visual spacing rule.
const minimumClientSeparation = 24;
const errors = [];
const check = (condition, message) => { if (!condition) errors.push(message); };
const serialize = points => JSON.stringify([...points.entries()].sort(([a], [b]) => a.localeCompare(b)));

function alignedInRegularRows(points) {
  const rows = new Map();
  // Round only floating-point noise: organic layouts may legitimately have
  // nearby centres, and those should not count as a repeated exact row.
  for (const point of points) {
    const key = Math.round(point.y * 1000) / 1000;
    rows.set(key, (rows.get(key) || 0) + 1);
  }
  const ordered = [...rows.entries()].sort(([a], [b]) => a - b);
  if (ordered.length < 2) return true;
  if (!ordered.every(([, count]) => count >= 3)) return false;
  const spacing = ordered[1][0] - ordered[0][0];
  return ordered.slice(2).every(([y], index) => Math.abs(y - ordered[index + 1][0] - spacing) < 0.01);
}

try {
  const context = vm.createContext({ window: {} });
  for (const filename of ['i18n-static.js', 'i18n-dynamic.js', 'firm-graph.js', 'firm-layout.js']) {
    vm.runInContext(fs.readFileSync(path.join(directory, filename), 'utf8'), context, { filename, timeout: 3000 });
  }
  if (typeof context.window.OakbaseFirmGraph?.build !== 'function' ||
      typeof context.window.OakbaseFirmLayout?.build !== 'function') {
    throw new Error('Expected OakbaseFirmGraph.build() and OakbaseFirmLayout.build(nodes, connections, width, height).');
  }
  context.graph = vm.runInContext('window.OakbaseFirmGraph.build()', context, { timeout: 5000 });
  const { nodes, connections } = context.graph;
  const clients = nodes.filter(node => node.kind === 'Client');
  const nodeIds = new Set(nodes.map(node => node.id));
  const originalGraph = JSON.stringify(context.graph);
  check(nodes.length === 534, `Expected 534 graph nodes; found ${nodes.length}.`);
  check(clients.length === 40, `Expected 40 clients; found ${clients.length}.`);
  check(nodes.filter(node => node.kind === 'Matter').length === 120, 'Expected 120 matters.');
  const summaries = [];

  for (const [width, height] of viewports) {
    const label = `${width}×${height}`;
    context.layoutWidth = width;
    context.layoutHeight = height;
    const build = () => vm.runInContext(
      'window.OakbaseFirmLayout.build(graph.nodes, graph.connections, layoutWidth, layoutHeight)',
      context, { timeout: 5000 });
    const points = build();
    if (Object.prototype.toString.call(points) !== '[object Map]') {
      errors.push(`${label}: build() must return a Map.`);
      continue;
    }
    check(points.size === nodeIds.size, `${label}: expected ${nodeIds.size} positions; found ${points.size}.`);
    const radii = new Set();
    for (const id of nodeIds) {
      const point = points.get(id);
      check(Boolean(point), `${label}: missing position for ${id}.`);
      if (!point) continue;
      const finite = Number.isFinite(point.x) && Number.isFinite(point.y);
      check(finite, `${label}: non-finite coordinates for ${id}.`);
      if (finite) {
        check(point.x >= margin - 1e-6 && point.x <= width - margin + 1e-6 &&
          point.y >= margin - 1e-6 && point.y <= height - margin + 1e-6,
        `${label}: ${id} is outside the ${margin}px viewport inset (${point.x}, ${point.y}).`);
      }
      if (point.radius !== undefined) {
        check(Number.isFinite(point.radius) && point.radius > 0,
          `${label}: ${id} has an invalid radius.`);
        if (Number.isFinite(point.radius)) radii.add(Math.round(point.radius * 1000) / 1000);
      }
    }
    for (const id of points.keys()) check(nodeIds.has(id), `${label}: unexpected position for ${id}.`);
    // Radius is optional in the public API; where it is supplied, it must not
    // recreate a single repeated star size across the entire graph.
    if (radii.size) check(radii.size > 1, `${label}: all supplied node radii are identical.`);
    check(serialize(points) === serialize(build()), `${label}: repeated calls produce different positions.`);
    check(JSON.stringify(context.graph) === originalGraph, `${label}: layout mutated graph data.`);

    const clientPoints = clients.map(client => points.get(client.id)).filter(Boolean);
    let closest = Infinity;
    for (let i = 0; i < clientPoints.length; i++) {
      for (let j = i + 1; j < clientPoints.length; j++) {
        const a = clientPoints[i], b = clientPoints[j];
        closest = Math.min(closest, Math.hypot(a.x - b.x, a.y - b.y));
      }
    }
    check(closest >= minimumClientSeparation - 1e-6,
      `${label}: nearest client centres are only ${closest.toFixed(2)}px apart.`);
    check(!alignedInRegularRows(clientPoints), `${label}: clients form uniformly spaced repeated rows.`);
    summaries.push(`${label}: ${points.size} nodes, closest clients ${closest.toFixed(1)}px` +
      (radii.size ? `, ${radii.size} radius values` : ''));
  }
  if (errors.length) {
    for (const error of errors.slice(0, 50)) console.error(`FAIL: ${error}`);
    if (errors.length > 50) console.error(`… ${errors.length - 50} further errors omitted.`);
    console.error(`Firm layout check failed: ${errors.length} error(s).`);
    process.exitCode = 1;
  } else {
    console.log('PASS: deterministic constellation positions, finite bounds, complete graph, separated clients and non-grid rows.');
    for (const summary of summaries) console.log(`  ${summary}`);
  }
} catch (error) {
  console.error(`FAIL: ${error.message}`);
  process.exitCode = 1;
}
