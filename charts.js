// charts.js - Gráficas de progreso histórico, en SVG puro (sin librerías externas).
// Se hace a propósito sin dependencias de terceros: es una app personal, offline,
// y así no depende de que cargue un CDN para ver tu propio progreso.

// Construye un gráfico de línea a partir de una serie de puntos.
// points: [{ x: índice, y: número, label: texto para el tooltip, color: css opcional }]
function buildLineChartSVG(points, opts = {}) {
  const {
    width = 640,
    height = 220,
    padding = 38,
    lineColor = 'var(--accent-green)',
    yFormatter = (v) => String(v),
    ariaLabel = 'Gráfico de progreso'
  } = opts;

  if (!points || points.length === 0) return '';

  const ys = points.map(p => p.y);
  let yMin = Math.min(...ys);
  let yMax = Math.max(...ys);
  if (yMin === yMax) { yMin -= 1; yMax += 1; } // evita división por cero si todos los valores son iguales
  const yRange = yMax - yMin;

  const innerW = width - padding * 2;
  const innerH = height - padding * 2;

  const scaleX = (i) => padding + (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
  const scaleY = (v) => padding + innerH - ((v - yMin) / yRange) * innerH;

  const linePoints = points.map((p, i) => `${scaleX(i).toFixed(1)},${scaleY(p.y).toFixed(1)}`).join(' ');

  // Líneas de cuadrícula horizontales (4 niveles) con su valor en el eje Y
  const gridLines = [0, 1, 2, 3, 4].map(step => {
    const v = yMin + (yRange * step) / 4;
    const y = scaleY(v);
    return `
      <line x1="${padding}" y1="${y.toFixed(1)}" x2="${width - padding}" y2="${y.toFixed(1)}" stroke="var(--border-subtle)" stroke-width="1" />
      <text x="${padding - 8}" y="${(y + 3).toFixed(1)}" text-anchor="end" font-size="10" fill="var(--text-muted)" font-family="var(--font-mono)">${escapeHTML(yFormatter(Math.round(v)))}</text>
    `;
  }).join('');

  // Solo se etiquetan en el eje X algunos puntos (el primero, el último y unos intermedios)
  // para que no se amontonen cuando hay muchas sesiones.
  const labelStep = Math.max(1, Math.ceil(points.length / 6));
  const xLabels = points.map((p, i) => {
    if (i !== 0 && i !== points.length - 1 && i % labelStep !== 0) return '';
    return `<text x="${scaleX(i).toFixed(1)}" y="${height - padding + 16}" text-anchor="middle" font-size="9.5" fill="var(--text-muted)">${escapeHTML(p.xLabel || '')}</text>`;
  }).join('');

  const dots = points.map((p, i) => `
    <circle cx="${scaleX(i).toFixed(1)}" cy="${scaleY(p.y).toFixed(1)}" r="4.5" fill="${p.color || lineColor}" stroke="var(--bg-canvas)" stroke-width="1.5">
      <title>${escapeHTML(p.label || String(p.y))}</title>
    </circle>
  `).join('');

  return `
    <svg viewBox="0 0 ${width} ${height}" width="100%" height="${height}" role="img" aria-label="${escapeHTML(ariaLabel)}" style="max-width:100%; height:auto;">
      ${gridLines}
      ${xLabels}
      <polyline points="${linePoints}" fill="none" stroke="${lineColor}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" />
      ${dots}
    </svg>
  `;
}

// Pequeña franja de estadísticas (primer valor / último valor / variación) para
// poner encima de un gráfico, en texto plano: la gráfica es un extra visual,
// no la única forma de leer el dato.
function buildTrendStat(points, unit = '') {
  if (!points || points.length < 2) return '';
  const first = points[0].y;
  const last = points[points.length - 1].y;
  const delta = last - first;
  const sign = delta > 0 ? '+' : '';
  const color = delta > 0 ? 'var(--accent-green)' : delta < 0 ? 'var(--accent-red)' : 'var(--text-secondary)';
  return `<span style="font-family:var(--font-mono); font-weight:700; color:${color};">${sign}${delta}${unit}</span> en ${points.length} sesiones`;
}
