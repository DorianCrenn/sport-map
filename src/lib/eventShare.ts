import type { SportLinkEvent, SportLinkClub } from '../types/sportlink.js';

const EVENT_TYPE_LABELS: Record<string, string> = {
  championship: '🏆 Championnat',
  cup:          '🥇 Coupe',
  friendly:     '⚽ Match amical',
};

interface EventDescriptionOptions {
  includeUrl?: boolean;
  url?: string;
}

export function generateEventDescription(
  event: SportLinkEvent | null | undefined,
  options: EventDescriptionOptions = {},
): string {
  if (!event) return '';
  const { includeUrl = false, url = '' } = options;
  const lines: string[] = [];

  const typeLabel = EVENT_TYPE_LABELS[event.eventType] || '📅 Événement';
  const competition = event.level ? `${typeLabel} ${event.level}` : typeLabel;
  lines.push(competition);

  if (event.sport && event.eventType === 'friendly') lines.push(`🏅 ${event.sport}`);
  if (event.title) lines.push(event.title);

  if (event.date) {
    const d = new Date(event.date);
    const dateStr = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
    const timeStr = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    lines.push(`📅 ${capitalize(dateStr)} à ${timeStr}`);
  }

  const lieu = event.venue || event.city;
  if (lieu) lines.push(`📍 ${lieu}`);
  if (event.score) lines.push(`🎯 Score : ${JSON.stringify(event.score)}`);

  lines.push('');
  lines.push('Créé avec SportLink 🟢');
  if (includeUrl && url) lines.push(url);

  return lines.join('\n');
}

export function openWhatsAppShare(text: string): void {
  const encoded = encodeURIComponent(text);
  window.open(`https://wa.me/?text=${encoded}`, '_blank', 'noopener,noreferrer');
}

export function openFacebookShare(url: string): void {
  const encoded = encodeURIComponent(url);
  window.open(
    `https://www.facebook.com/sharer/sharer.php?u=${encoded}`,
    '_blank',
    'noopener,noreferrer,width=600,height=400',
  );
}

export function openInstagramShare(text: string, url = ''): void {
  const full = url ? `${text}\n${url}` : text;
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    navigator.share({ text: full }).catch(() => {});
  } else {
    navigator.clipboard?.writeText(full);
  }
}

export function generateEventUrl(eventId: string): string {
  return `${window.location.origin}${window.location.pathname}#event/${eventId}`;
}

export function generateClubUrl(clubId: string): string {
  return `${window.location.origin}${window.location.pathname}#club/${clubId}`;
}

interface ClubShareOptions {
  includeUrl?: boolean;
}

export function generateClubShareText(
  club: Pick<SportLinkClub, 'id' | 'name' | 'sport' | 'city' | 'description'> | null | undefined,
  options: ClubShareOptions = {},
): string {
  if (!club) return '';
  const { includeUrl = false } = options;
  const url = generateClubUrl(club.id);
  const lines: string[] = [`🏟️ ${club.name}`];

  if (club.sport) lines.push(`🏅 ${club.sport}${club.city ? ` · ${club.city}` : ''}`);

  if (club.description) {
    const desc = club.description.length > 120
      ? `${club.description.slice(0, 117)}…`
      : club.description;
    lines.push(desc);
  }

  lines.push('');
  lines.push('Rejoins-nous sur SportLink 🟢');
  if (includeUrl) lines.push(url);

  return lines.join('\n');
}

function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}
