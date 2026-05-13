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
