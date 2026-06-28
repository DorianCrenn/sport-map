export interface ICSEvent {
  uid?: string;
  title: string;
  date: string;
  endDate?: string;
  venue?: string;
  city?: string;
  description?: string;
  allDay?: boolean;
}

function unescapeICS(s: string): string {
  return s.replace(/\\n/g, '\n').replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\\\/g, '\\');
}

function foldedLines(text: string): string[] {
  return text.split(/\r?\n/).reduce<string[]>((acc, line) => {
    if (/^[ \t]/.test(line) && acc.length) { acc[acc.length - 1] += line.slice(1); }
    else { acc.push(line); }
    return acc;
  }, []);
}

function parseDTSTART(val: string): { date: string; allDay: boolean } {
  if (val.includes('T')) {
    const y = val.slice(0, 4), mo = val.slice(4, 6), d = val.slice(6, 8);
    const h = val.slice(9, 11), mi = val.slice(11, 13);
    return { date: `${y}-${mo}-${d}T${h}:${mi}:00`, allDay: false };
  }
  const y = val.slice(0, 4), mo = val.slice(4, 6), d = val.slice(6, 8);
  return { date: `${y}-${mo}-${d}T00:00:00`, allDay: true };
}

export function parseICS(text: string): ICSEvent[] {
  const lines = foldedLines(text);
  const events: ICSEvent[] = [];
  let current: Partial<ICSEvent> | null = null;

  for (const raw of lines) {
    const colon = raw.indexOf(':');
    if (colon < 0) continue;
    const key = raw.slice(0, colon).toUpperCase();
    const val = raw.slice(colon + 1).trim();

    if (key === 'BEGIN' && val === 'VEVENT') { current = {}; continue; }
    if (key === 'END' && val === 'VEVENT') {
      if (current?.date && current.title) events.push(current as ICSEvent);
      current = null; continue;
    }
    if (!current) continue;

    if (key === 'UID')         { current.uid         = val; }
    if (key === 'SUMMARY')     { current.title       = unescapeICS(val); }
    if (key === 'LOCATION')    { current.venue       = unescapeICS(val); }
    if (key === 'DESCRIPTION') { current.description = unescapeICS(val).slice(0, 500); }

    if (key.startsWith('DTSTART')) {
      const clean = val.replace(/Z$/, '');
      const parsed = parseDTSTART(clean);
      current.date   = parsed.date;
      current.allDay = parsed.allDay;
    }
    if (key.startsWith('DTEND')) {
      const clean = val.replace(/Z$/, '');
      current.endDate = parseDTSTART(clean).date;
    }
  }

  return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export async function fetchICSFromURL(url: string): Promise<ICSEvent[]> {
  const res = await fetch(url, { mode: 'cors' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();
  if (!text.includes('BEGIN:VCALENDAR')) throw new Error('Fichier ICS invalide');
  return parseICS(text);
}
