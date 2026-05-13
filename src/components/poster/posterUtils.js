export function parseVs(title = '') {
  const m = title.match(/^(.+?)\s+vs\s+(.+)$/i);
  return m ? { home: m[1].trim(), away: m[2].trim() } : { home: title, away: null };
}

export function fmtDate(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return { short: '—', time: '—', weekday: '—', day: '—', month: '—' };
  return {
    short: d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase(),
    long: d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }),
    time: d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    weekday: d.toLocaleDateString('fr-FR', { weekday: 'long' }).toUpperCase(),
    day: String(d.getDate()),
    month: d.toLocaleDateString('fr-FR', { month: 'short' }).toUpperCase(),
  };
}

export function champLabel(eventType, level = '') {
  const t = { championship: 'CHAMPIONNAT', cup: 'COUPE', friendly: 'AMICAL' };
  const base = t[eventType] || 'MATCH';
  return level ? `${base} ${level}` : base;
}

export function initials(name = '') {
  return name.trim().split(/\s+/).slice(0, 2).map(w => w[0] || '').join('').toUpperCase() || '?';
}

export function truncate(str = '', maxLen = 20) {
  return str.length > maxLen ? str.slice(0, maxLen - 1) + '…' : str;
}

export function scaledFs(str = '', baseSize = 12, maxChars = 14, minSize = 8) {
  if (!str || str.length <= maxChars) return baseSize;
  return Math.max(minSize, Math.round(baseSize * maxChars / str.length));
}

export function venueFs(text = '', base = 11) {
  const len = text.length;
  if (len > 20) return Math.max(7.5, Math.round(base * 0.7));
  if (len > 15) return Math.round(base * 0.83);
  if (len > 11) return Math.round(base * 0.92);
  return base;
}

export function blockStyle(transforms, id) {
  const t = transforms?.[id];
  if (!t) return {};
  const parts = [];
  if (t.dx || t.dy) parts.push(`translate(${t.dx ?? 0}px,${t.dy ?? 0}px)`);
  if (t.scale && t.scale !== 1) parts.push(`scale(${t.scale})`);
  if (t.rotation) parts.push(`rotate(${t.rotation}deg)`);
  const s = {};
  if (parts.length) s.transform = parts.join(' ');
  if (t.opacity !== undefined) s.opacity = t.opacity;
  return s;
}
