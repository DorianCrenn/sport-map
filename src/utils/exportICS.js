function pad(n) { return String(n).padStart(2, '0'); }

function toICS(d) {
  return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
}

function escape(s) {
  return String(s ?? '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

function buildVEvent(event, now) {
  const start = new Date(event.date);
  const end   = new Date(start.getTime() + 90 * 60 * 1000);
  const loc   = [event.venue, event.city].filter(Boolean).join(', ');
  return [
    'BEGIN:VEVENT',
    `UID:${event.id}@sportlink.fr`,
    `DTSTAMP:${toICS(now)}`,
    `DTSTART:${toICS(start)}`,
    `DTEND:${toICS(end)}`,
    `SUMMARY:${escape(event.title)}`,
    ...(loc ? [`LOCATION:${escape(loc)}`] : []),
    ...(event.description ? [`DESCRIPTION:${escape(event.description)}`] : []),
    'END:VEVENT',
  ];
}

function triggerDownload(lines, filename) {
  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadICS(event) {
  const now = new Date();
  triggerDownload([
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//SportLink//Finistère//FR', 'CALSCALE:GREGORIAN',
    ...buildVEvent(event, now),
    'END:VCALENDAR',
  ], `${event.title.replace(/[^a-z0-9]/gi, '_')}.ics`);
}

export function downloadClubICS(events, clubName) {
  const now = new Date();
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0',
    `PRODID:-//SportLink//${escape(clubName)}//FR`,
    'CALSCALE:GREGORIAN',
  ];
  for (const ev of events) lines.push(...buildVEvent(ev, now));
  lines.push('END:VCALENDAR');
  triggerDownload(lines, `${clubName.replace(/[^a-z0-9]/gi, '_')}_calendrier.ics`);
}
