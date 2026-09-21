/* A small SVG renderer for the brain's 3D point model. No animation runs at rest. */
(() => {
  'use strict';
  const stage = document.querySelector('.lean-platform-stage');
  const svg = stage.querySelector('.lean-brain');
  const scene = stage.querySelector('.lean-architecture');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const ns = 'http://www.w3.org/2000/svg';
  const make = (tag, attributes) => {
    const element = document.createElementNS(ns, tag);
    Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
    return element;
  };
  const key = (x, y) => `${Number(x).toFixed(1)} ${Number(y).toFixed(1)}`;
  // A rounded outer cortex and a flatter medial wall make one divided brain.
  // Both the network and its folds use this surface, so they turn together.
  const cortex = (hemisphere, across, height, side = 1) => {
    const row = Math.sqrt(Math.max(0, 1 - height * height));
    const cleft = 8 + (height < 0 ? 64 : 12) * (1 - Math.pow(row, .4)) + 3 * Math.sin(height * 12);
    const scallop = (4 * Math.sin(height * 23 + hemisphere) + 2 * Math.sin(height * 47)) * row;
    const width = 198 * Math.pow(row, .7) * (1 - height * .1) + scallop;
    const ridge = .94 + .06 * Math.sin(across * 22 + height * 18);
    return {
      x: 360 + hemisphere * (cleft + across * width),
      y: 255 + height * 145 + 2 * Math.sin(across * 7 + height * 9) * row,
      z: side * 104 * row * Math.pow(Math.max(0, Math.sin(across * Math.PI)), .7) * ridge
    };
  };
  const hitNodes = [...svg.querySelectorAll('.brain-point-hit')];
  const points = [...svg.querySelectorAll('.brain-signal')].map((element, index) => {
    const sourceX = Number(element.getAttribute('cx'));
    const sourceY = Number(element.getAttribute('cy'));
    const hemisphere = sourceX < 360 ? -1 : 1;
    const centre = hemisphere < 0 ? 245 : 475;
    const height = Math.max(-.99, Math.min(.99, (sourceY - 259) / 164));
    const row = Math.sqrt(1 - height * height);
    const across = Math.max(0, Math.min(1, (hemisphere * (sourceX - centre) / (106 * row) + 1) / 2));
    const side = index % 3 === 0 ? -1 : 1;
    return { element, hit: hitNodes[index], sourceX, sourceY, ...cortex(hemisphere, across, height, side), radius: Number(element.getAttribute('r')) };
  });
  const pointMap = new Map(points.map((point) => [key(point.sourceX, point.sourceY), point]));
  const links = [...svg.querySelectorAll('.brain-link')].map((element) => {
    const ends = element.getAttribute('d').slice(1).split('L').map((xy) => pointMap.get(xy));
    return { element, ends };
  });
  const contacts = [...svg.querySelectorAll('.brain-agent')].map((agent) => {
    const contact = agent.querySelector('.brain-agent-contact');
    return {
      contact, line: agent.querySelector('.brain-agent-connection'),
      x: Number(agent.dataset.x), y: Number(agent.dataset.y),
      point: pointMap.get(key(contact.getAttribute('cx'), contact.getAttribute('cy')))
    };
  });

  const defs = svg.querySelector('defs');
  [['brain-pearl', '#e3ebd7', '#718969', '#39583f'], ['brain-pearl-soft', '#eef2e6', '#abbc9b', '#73886a'], ['brain-pearl-copper', '#f8e4cb', '#bc855f', '#80553c']].forEach(([id, light, mid, dark]) => {
    const gradient = make('radialGradient', { id, cx: '30%', cy: '24%', r: '75%' });
    [[0, light], [.4, mid], [1, dark]].forEach(([offset, color]) => gradient.append(make('stop', { offset, 'stop-color': color })));
    defs.append(gradient);
  });
  const shadowGradient = make('radialGradient', { id: 'brain-ground-light' });
  shadowGradient.append(make('stop', { 'stop-color': '#3d5833', 'stop-opacity': '.12' }), make('stop', { offset: '1', 'stop-color': '#3d5833', 'stop-opacity': '0' }));
  defs.append(shadowGradient);
  const shadow = make('ellipse', { class: 'brain-ground-shadow', cx: 360, cy: 442, rx: 205, ry: 23, fill: 'url(#brain-ground-light)', 'aria-hidden': 'true' });
  svg.insertBefore(shadow, svg.querySelector('.brain-operations'));
  const contours = make('g', { class: 'brain-volume-contours', 'aria-hidden': 'true' });
  const contourModels = [];
  // Open, branching sulci replace the mechanical latitude rings.
  const folds = [
    [[.12, -.86], [.24, -.72], [.15, -.53], [.25, -.36], [.14, -.17], [.22, .02], [.13, .2], [.24, .39], [.15, .57], [.26, .77]],
    [[.39, -.9], [.54, -.73], [.43, -.56], [.59, -.4], [.5, -.23], [.62, -.08], [.54, .07]],
    [[.83, -.68], [.71, -.53], [.82, -.36], [.71, -.18], [.82, -.03], [.74, .13], [.88, .3]],
    [[.22, .02], [.38, -.04], [.54, .07], [.44, .22], [.58, .37], [.48, .52], [.6, .69], [.45, .87]],
    [[.24, .39], [.37, .49], [.3, .67], [.39, .82]],
    [[.88, .3], [.71, .35], [.75, .53], [.62, .69]],
    [[.25, -.36], [.38, -.44], [.43, -.56]],
    [[.59, -.4], [.71, -.36], [.82, -.36]],
    [[.58, .37], [.71, .35]]
  ];
  // Catmull–Rom samples keep the folds smooth under perspective projection.
  const smoothFold = (controls) => controls.flatMap((b, index) => {
    if (index === controls.length - 1) return [b];
    const a = controls[Math.max(0, index - 1)];
    const c = controls[index + 1];
    const d = controls[Math.min(controls.length - 1, index + 2)];
    return Array.from({ length: 8 }, (_, step) => {
      const t = step / 8;
      return b.map((value, axis) => .5 * ((2 * value) + (-a[axis] + c[axis]) * t + (2 * a[axis] - 5 * value + 4 * c[axis] - d[axis]) * t * t + (-a[axis] + 3 * value - 3 * c[axis] + d[axis]) * t * t * t));
    });
  });
  [-1, 1].forEach((hemisphere) => {
    const outline = make('path', { class: 'brain-cortex-outline' });
    const wall = Array.from({ length: 65 }, (_, index) => cortex(hemisphere, 0, -1 + index / 32));
    const edge = Array.from({ length: 65 }, (_, index) => cortex(hemisphere, 1, 1 - index / 32));
    contourModels.push({ path: outline, vertices: [...wall, ...edge], closed: true });
    contours.append(outline);
    folds.forEach((controls, index) => {
      const path = make('path', { class: 'brain-cortex-fold' });
      const vertices = smoothFold(controls).map(([across, height]) => {
        const offset = hemisphere > 0 ? .025 * Math.sin(height * 8 + index) : 0;
        return cortex(hemisphere, across + offset, height);
      });
      contourModels.push({ path, vertices, closed: false });
      contours.append(path);
    });
  });
  svg.insertBefore(contours, svg.querySelector('.brain-memory'));
  stage.classList.add('has-brain-volume');

  let pointerX = 0;
  let pointerY = 0;
  let yaw = -.38;
  let pitch = .23;
  let frame = 0;
  let lastTime = 0;
  let sorted = false;
  const progress = () => Number(stage.style.getPropertyValue('--brain-progress')) || 0;
  const project = (point) => {
    const x = point.x - 360;
    const y = point.y - 259;
    const turnedX = x * Math.cos(yaw) + point.z * Math.sin(yaw);
    const turnedZ = -x * Math.sin(yaw) + point.z * Math.cos(yaw);
    const turnedY = y * Math.cos(pitch) - turnedZ * Math.sin(pitch);
    const depth = y * Math.sin(pitch) + turnedZ * Math.cos(pitch);
    const perspective = 850 / (850 - depth);
    const roll = -.055;
    return {
      x: 360 + (turnedX * Math.cos(roll) - turnedY * Math.sin(roll)) * perspective,
      y: 258 + (turnedX * Math.sin(roll) + turnedY * Math.cos(roll)) * perspective,
      depth, scale: perspective
    };
  };
  const render = () => {
    points.forEach((point) => {
      const projected = project(point);
      point.projected = projected;
      const prominence = Math.max(0, Math.min(1, (projected.depth + 150) / 290));
      point.element.setAttribute('cx', projected.x.toFixed(2));
      point.element.setAttribute('cy', projected.y.toFixed(2));
      point.element.setAttribute('r', (point.radius * projected.scale * (.7 + prominence * .7)).toFixed(2));
      point.element.style.setProperty('--depth-alpha', (.28 + prominence * .72).toFixed(3));
      point.hit.setAttribute('cx', projected.x.toFixed(2));
      point.hit.setAttribute('cy', projected.y.toFixed(2));
      point.hit.setAttribute('r', (9 * projected.scale).toFixed(2));
    });
    links.forEach(({ element, ends }) => {
      const [a, b] = ends.map((point) => point.projected);
      element.setAttribute('d', `M${a.x.toFixed(2)} ${a.y.toFixed(2)}L${b.x.toFixed(2)} ${b.y.toFixed(2)}`);
      const depth = Math.max(0, Math.min(1, ((a.depth + b.depth) / 2 + 150) / 290));
      element.style.setProperty('--depth-alpha', (.19 + depth * .65).toFixed(3));
      element.style.setProperty('--depth-width', (.55 + depth * .65).toFixed(2));
    });
    contacts.forEach(({ contact, line, x, y, point }) => {
      const target = point.projected;
      contact.setAttribute('cx', target.x.toFixed(2));
      contact.setAttribute('cy', target.y.toFixed(2));
      line.setAttribute('d', `M${x} ${y}Q${((x + target.x) / 2).toFixed(2)} ${(y - 14).toFixed(2)} ${target.x.toFixed(2)} ${target.y.toFixed(2)}`);
    });
    contourModels.forEach(({ path, vertices, closed }) => {
      path.setAttribute('d', vertices.map((vertex, index) => {
        const point = project(vertex);
        return `${index ? 'L' : 'M'}${point.x.toFixed(2)} ${point.y.toFixed(2)}`;
      }).join('') + (closed ? 'Z' : ''));
    });
    contours.style.opacity = String(Math.max(0, Math.min(1, progress() * 3)) * .48);
    if (!sorted) {
      const firstAgent = svg.querySelector('.brain-agent-hit');
      points.slice().sort((a, b) => a.projected.depth - b.projected.depth).forEach((point) => {
        point.element.parentNode.append(point.element);
        point.hit.parentNode.insertBefore(point.hit, firstAgent);
      });
      sorted = true;
    }
    stage.dispatchEvent(new CustomEvent('brain:geometry'));
  };
  const update = (time) => {
    frame = 0;
    const inspecting = stage.classList.contains('is-exploring');
    const targetYaw = reducedMotion.matches ? -.38 : -.38 + progress() * .16 + pointerX * .09;
    const targetPitch = reducedMotion.matches ? .23 : .23 + pointerY * .045;
    const blend = 1 - Math.exp(-Math.min(64, time - lastTime) / 110);
    lastTime = time;
    if (!inspecting) {
      yaw += (targetYaw - yaw) * blend;
      pitch += (targetPitch - pitch) * blend;
    }
    const settled = inspecting || Math.abs(targetYaw - yaw) + Math.abs(targetPitch - pitch) < .0005;
    if (settled && !inspecting) { yaw = targetYaw; pitch = targetPitch; }
    render();
    if (!settled) frame = window.requestAnimationFrame(update);
  };
  const requestRender = () => {
    if (frame) return;
    lastTime = window.performance.now();
    frame = window.requestAnimationFrame(update);
  };
  scene.addEventListener('pointermove', (event) => {
    if (reducedMotion.matches || !finePointer.matches || stage.classList.contains('is-exploring')) return;
    const bounds = scene.getBoundingClientRect();
    pointerX = (event.clientX - bounds.left) / bounds.width * 2 - 1;
    pointerY = (event.clientY - bounds.top) / bounds.height * 2 - 1;
    requestRender();
  }, { passive: true });
  scene.addEventListener('pointerleave', () => { pointerX = 0; pointerY = 0; requestRender(); });
  stage.addEventListener('brain:render', requestRender);
  reducedMotion.addEventListener('change', () => { pointerX = 0; pointerY = 0; requestRender(); });
  render();
})();
