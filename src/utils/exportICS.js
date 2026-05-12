function pad(n) { return String(n).padStart(2, '0'); }

function toICS(d) {
  return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
}

function escape(s) {
  return String(s ?? '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

export function downloadICS(event) {
  const start = new Date(event.date);
  const end = new Date(start.getTime() + 90 * 60 * 1000);
  const now = new Date();
  const location = [event.venue, event.city].filter(Boolean).join(', ');
  const desc = event.description ?? '';

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SportLink//Finistère//FR',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${event.id}@sportlink.fr`,
    `DTSTAMP:${toICS(now)}`,
    `DTSTART:${toICS(start)}`,
    `DTEND:${toICS(end)}`,
    `SUMMARY:${escape(event.title)}`,
    location ? `LOCATION:${escape(location)}` : null,
    desc ? `DESCRIPTION:${escape(desc)}` : null,
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean).join('\r\n');

  const blob = new Blob([lines], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${event.title.replace(/[^a-z0-9]/gi, '_')}.ics`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
