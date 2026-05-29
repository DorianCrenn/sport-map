// ─────────────────────────────────────────────────────────────────────────────
// dateUtils.js — Utilitaires de formatage de dates en français
//
// Source unique de vérité pour tout le projet.
// Remplace les copies locales dans EventComments, AnnouncementsCenter,
// MyRidesPage, DateFilterBar, FavorisPage.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Retourne un temps relatif en français.
 * Ex: "À l'instant", "il y a 5 min", "il y a 3 h", "il y a 2 j", "12 juin"
 * @param {string} isoStr - Date ISO 8601
 * @returns {string}
 */
export function timeAgo(isoStr) {
  const diff = Date.now() - new Date(isoStr).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1)  return "À l'instant";
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 7)  return `il y a ${d} j`;
  return new Date(isoStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

/**
 * Formate une date ISO en "12 juin" ou "12 juin 2025".
 * Ajoute T00:00 pour éviter les décalages de fuseau horaire sur les dates seules.
 * @param {string} iso - Date YYYY-MM-DD ou ISO 8601
 * @param {boolean} [showYear=false]
 * @returns {string}
 */
export function formatDate(iso, showYear = false) {
  const d = new Date(iso.includes('T') ? iso : `${iso}T00:00`);
  const opts = { day: 'numeric', month: 'short' };
  if (showYear) opts.year = 'numeric';
  return d.toLocaleDateString('fr-FR', opts);
}

/**
 * Formate une date ISO en heure locale, ex: "14:30".
 * @param {string} iso
 * @returns {string}
 */
export function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

/**
 * Formate une date ISO en date longue, ex: "samedi 12 juin".
 * @param {string} iso
 * @returns {string}
 */
export function formatLongDate(iso) {
  return new Date(iso.includes('T') ? iso : `${iso}T00:00`)
    .toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

/**
 * Groupe une liste d'événements par plage temporelle.
 * Retourne { today, tomorrow, thisWeek, later, past }.
 * @param {Array<{date: string}>} events
 * @returns {{ today: Array, tomorrow: Array, thisWeek: Array, later: Array, past: Array }}
 */
export function groupByDate(events) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(todayStart.getDate() + 1);
  const dayAfterTomorrow = new Date(todayStart);
  dayAfterTomorrow.setDate(todayStart.getDate() + 2);
  const nextWeekEnd = new Date(todayStart);
  nextWeekEnd.setDate(todayStart.getDate() + 7);

  const groups = { today: [], tomorrow: [], thisWeek: [], later: [], past: [] };
  for (const ev of events) {
    const d = new Date(ev.date);
    if (d < todayStart)         groups.past.push(ev);
    else if (d < tomorrowStart) groups.today.push(ev);
    else if (d < dayAfterTomorrow) groups.tomorrow.push(ev);
    else if (d < nextWeekEnd)   groups.thisWeek.push(ev);
    else                        groups.later.push(ev);
  }
  return groups;
}
