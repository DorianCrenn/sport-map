export function timeAgo(isoStr: string): string {
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

export function formatDate(iso: string, showYear = false): string {
  const d = new Date(iso.includes('T') ? iso : `${iso}T00:00`);
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
  if (showYear) opts.year = 'numeric';
  return d.toLocaleDateString('fr-FR', opts);
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export function formatLongDate(iso: string): string {
  return new Date(iso.includes('T') ? iso : `${iso}T00:00`)
    .toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

interface DateGroups<T extends { date: string }> {
  today: T[];
  tomorrow: T[];
  thisWeek: T[];
  later: T[];
  past: T[];
}

export function groupByDate<T extends { date: string }>(events: T[]): DateGroups<T> {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(todayStart.getDate() + 1);
  const dayAfterTomorrow = new Date(todayStart);
  dayAfterTomorrow.setDate(todayStart.getDate() + 2);
  const nextWeekEnd = new Date(todayStart);
  nextWeekEnd.setDate(todayStart.getDate() + 7);

  const groups: DateGroups<T> = { today: [], tomorrow: [], thisWeek: [], later: [], past: [] };
  for (const ev of events) {
    const d = new Date(ev.date);
    if (d < todayStart)            groups.past.push(ev);
    else if (d < tomorrowStart)    groups.today.push(ev);
    else if (d < dayAfterTomorrow) groups.tomorrow.push(ev);
    else if (d < nextWeekEnd)      groups.thisWeek.push(ev);
    else                           groups.later.push(ev);
  }
  return groups;
}
