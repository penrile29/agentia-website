/* Reuse the projected brain as a quiet, independent input to Time Capture. */
(() => {
  'use strict';
  const source = document.querySelector('.lean-brain');
  const target = document.querySelector('.time-memory-brain');
  if (!source || !target) return;
  const ns = 'http://www.w3.org/2000/svg';
  const drawing = document.createElementNS(ns, 'g');
  const copy = (selector, className, attributes) => {
    source.querySelectorAll(selector).forEach((element) => {
      const item = document.createElementNS(ns, element.tagName);
      item.setAttribute('class', className);
      attributes.forEach((attribute) => item.setAttribute(attribute, element.getAttribute(attribute)));
      if (element.tagName === 'circle') item.setAttribute('opacity', element.style.getPropertyValue('--depth-alpha') || '.8');
      drawing.append(item);
    });
  };
  copy('.brain-cortex-outline, .brain-cortex-fold', 'time-memory-fold', ['d']);
  copy('.brain-link', 'time-memory-link', ['d']);
  copy('.brain-signal', 'time-memory-point', ['cx', 'cy', 'r']);
  target.replaceChildren(drawing);
})();
