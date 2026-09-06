// =========================================================================
// Gráficos — anel de progresso (SVG donut) e evolução (linha/área).
// Sem biblioteca externa: SVG puro, leve e fácil de dar manutenção pelo
// editor web do GitHub.
// =========================================================================

window.AvanerCharts = (function () {
  const NS = 'http://www.w3.org/2000/svg';

  function ring(container, pct, colorVar) {
    const clamped = Math.max(0, Math.min(100, pct || 0));
    const size = 74;
    const stroke = 8;
    const r = (size - stroke) / 2;
    const c = 2 * Math.PI * r;
    const offset = c * (1 - clamped / 100);

    container.innerHTML = `
      <div class="ring-wrap">
        <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
          <circle class="ring-track" cx="${size / 2}" cy="${size / 2}" r="${r}" stroke-width="${stroke}"></circle>
          <circle class="ring-fill" cx="${size / 2}" cy="${size / 2}" r="${r}" stroke-width="${stroke}"
            stroke="${colorVar}" stroke-dasharray="${c}" stroke-dashoffset="${offset}"></circle>
        </svg>
        <div class="ring-label">${Math.round(clamped)}%</div>
      </div>`;
  }

  // points: [{day: 'YYYY-MM-DD', value: number}] já ordenados por dia.
  function trend(svgEl, points, colorHex) {
    while (svgEl.firstChild) svgEl.removeChild(svgEl.firstChild);

    if (!points || points.length < 2) {
      svgEl.setAttribute('viewBox', '0 0 300 64');
      return false;
    }

    const w = 300, h = 64, pad = 4;
    const values = points.map((p) => p.value);
    const min = Math.min(...values, 0);
    const max = Math.max(...values, 1);
    const span = max - min || 1;

    const stepX = (w - pad * 2) / (points.length - 1);
    const coords = points.map((p, i) => {
      const x = pad + i * stepX;
      const y = h - pad - ((p.value - min) / span) * (h - pad * 2);
      return [x, y];
    });

    const linePath = coords.map((c2, i) => (i === 0 ? 'M' : 'L') + c2[0].toFixed(1) + ' ' + c2[1].toFixed(1)).join(' ');
    const areaPath =
      linePath +
      ` L${coords[coords.length - 1][0].toFixed(1)} ${h - pad} L${coords[0][0].toFixed(1)} ${h - pad} Z`;

    const gradId = 'grad-' + Math.random().toString(36).slice(2, 9);

    svgEl.setAttribute('viewBox', `0 0 ${w} ${h}`);
    svgEl.setAttribute('preserveAspectRatio', 'none');

    const defs = document.createElementNS(NS, 'defs');
    defs.innerHTML = `
      <linearGradient id="${gradId}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${colorHex}" stop-opacity="0.35"></stop>
        <stop offset="100%" stop-color="${colorHex}" stop-opacity="0"></stop>
      </linearGradient>`;
    svgEl.appendChild(defs);

    const area = document.createElementNS(NS, 'path');
    area.setAttribute('d', areaPath);
    area.setAttribute('fill', `url(#${gradId})`);
    area.setAttribute('stroke', 'none');
    svgEl.appendChild(area);

    const line = document.createElementNS(NS, 'path');
    line.setAttribute('d', linePath);
    line.setAttribute('fill', 'none');
    line.setAttribute('stroke', colorHex);
    line.setAttribute('stroke-width', '2');
    line.setAttribute('stroke-linecap', 'round');
    line.setAttribute('stroke-linejoin', 'round');
    svgEl.appendChild(line);

    const last = coords[coords.length - 1];
    const dot = document.createElementNS(NS, 'circle');
    dot.setAttribute('cx', last[0]);
    dot.setAttribute('cy', last[1]);
    dot.setAttribute('r', '3');
    dot.setAttribute('fill', colorHex);
    svgEl.appendChild(dot);

    return true;
  }

  return { ring, trend };
})();
