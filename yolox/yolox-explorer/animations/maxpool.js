// Per-channel max pooling, using each block's actual kernel, stride and padding.
function maxPoolWindow(values, row, col, k, stride, padding) {
  let maximum = -Infinity;
  const winners = [];
  for (let kr = 0; kr < k; kr++) {
    for (let kc = 0; kc < k; kc++) {
      const r = row * stride + kr - padding;
      const c = col * stride + kc - padding;
      const value = values[r]?.[c] ?? -Infinity;
      if (value > maximum) {
        maximum = value;
        winners.length = 0;
      }
      if (value === maximum && value !== -Infinity) winners.push({ r, c });
    }
  }
  return { maximum, winners };
}

function buildMaxPoolAnimation({ k, s, padding }) {
  cancelAnimationFrame(maxpoolAnimationFrame);
  const svg = document.getElementById('maxpool-animation');
  svg.replaceChildren();
  document.getElementById('maxpool-title').textContent = `MaxPool(${k}×${k}, s=${s})`;
  document.getElementById('maxpool-caption').textContent =
    `Kernel ${k} × ${k} · stride ${s} · −∞ padding ${padding}`;

  const size = 8;
  const extent = size + 2 * padding;
  const cell = Math.min(26, 320 / extent);
  const outCell = 25;
  const left = 18, top = 47, right = 480, outTop = 95;
  const out = Math.floor((size + 2 * padding - k) / s) + 1;
  const values = Array.from({ length: size }, (_, r) =>
    Array.from({ length: size }, (_, c) => ((r * 7 + c * 5) % 19) - 9));

  function text(value, x, y) {
    const element = svgElement('text', { x, y, 'text-anchor': 'middle' });
    element.textContent = value;
    svg.append(element);
    return element;
  }
  text('Input + padding', left + extent * cell / 2, 25);
  text('Output', right + out * outCell / 2, 75);
  for (let r = 0; r < extent; r++) {
    for (let c = 0; c < extent; c++) {
      const value = values[r - padding]?.[c - padding];
      svg.append(svgElement('rect', {
        x: left + c * cell, y: top + r * cell,
        width: cell, height: cell,
        class: value === undefined ? 'pool-padding' : 'pool-pixel'
      }));
      text(value ?? '−∞', left + (c + .5) * cell, top + (r + .5) * cell + 4);
    }
  }

  const results = [];
  for (let r = 0; r < out; r++) {
    for (let c = 0; c < out; c++) {
      const rect = svgElement('rect', {
        x: right + c * outCell, y: outTop + r * outCell,
        width: outCell, height: outCell, class: 'pool-pixel'
      });
      svg.append(rect);
      const label = text('', right + (c + .5) * outCell, outTop + (r + .5) * outCell + 4);
      results.push({ r, c, rect, label, ...maxPoolWindow(values, r, c, k, s, padding) });
    }
  }
  const window = svgElement('rect', { width: k * cell, height: k * cell, class: 'pool-window' });
  const highlights = svgElement('g', {});
  svg.append(window, highlights);
  const currentMaximum = text('', 360, 405);
  const started = performance.now();
  let previous = -1;
  function frame(now) {
    const elapsed = Math.max(0, now - started) / 1000 % (results.length * .65 + 1.8);
    const current = Math.min(results.length - 1, Math.floor(elapsed / .65));
    if (current !== previous) {
      previous = current;
      results.forEach((result, i) => {
        result.label.textContent = i <= current ? result.maximum : '';
        result.rect.setAttribute('class', 'pool-pixel' + (i <= current ? ' pool-written' : ''));
      });
      const result = results[current];
      window.setAttribute('x', left + result.c * s * cell);
      window.setAttribute('y', top + result.r * s * cell);
      highlights.replaceChildren();
      for (const winner of result.winners) {
        highlights.append(svgElement('rect', {
          x: left + (winner.c + padding) * cell,
          y: top + (winner.r + padding) * cell,
          width: cell, height: cell, class: 'pool-max'
        }));
      }
      result.rect.setAttribute('stroke', 'var(--accent)');
      results.forEach((other, i) => { if (i !== current) other.rect.removeAttribute('stroke'); });
      currentMaximum.textContent = `Current window’s max = ${result.maximum}`;
    }
    maxpoolAnimationFrame = requestAnimationFrame(frame);
  }
  frame(started);
}
