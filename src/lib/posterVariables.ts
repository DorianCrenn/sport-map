import type { SportLinkEvent, SportLinkClub } from '../types/sportlink.js';

// posterUtils imports are kept as JS since posterUtils.js is in components/
// and will be migrated in the components phase
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { parseVs, fmtDate, champLabel } from '../components/poster/posterUtils.js';

interface VarContext {
  team_home: string;
  team_away: string;
  date_full: string;
  date_short: string;
  date_day: string;
  date_num: string;
  date_month: string;
  time: string;
  competition: string;
  level: string;
  venue: string;
  city: string;
  club_name: string;
  club_logo: string;
  sport: string;
  score_home: string;
  score_away: string;
}

export function buildVarContext(
  event: Partial<SportLinkEvent> | null | undefined,
  club: Partial<SportLinkClub> | null | undefined,
): VarContext {
  const { home, away } = parseVs(event?.title || '');
  const dt = fmtDate(event?.date);
  const champ = champLabel(event?.eventType, event?.level);

  const scoreStr = event?.score != null ? String(event.score) : '';
  const scoreParts = scoreStr.split('-');
  const scoreHome = scoreParts[0]?.trim() ?? '';
  const scoreAway = scoreParts[1]?.trim() ?? '';

  return {
    team_home:   home || club?.name || '',
    team_away:   away || '',
    date_full:   dt?.long    || '',
    date_short:  dt?.short   || '',
    date_day:    dt?.weekday || '',
    date_num:    dt?.day     || '',
    date_month:  dt?.month   || '',
    time:        dt?.time    || '',
    competition: champ || '',
    level:       event?.level  || '',
    venue:       event?.venue  || event?.city || '',
    city:        event?.city   || '',
    club_name:   club?.name    || '',
    club_logo:   club?.logoUrl ?? (club as { logo_url?: string })?.logo_url ?? '',
    sport:       event?.sport  || '',
    score_home:  scoreHome,
    score_away:  scoreAway,
  };
}

export function resolveVars(text: string | null | undefined, context: VarContext): string | null | undefined {
  if (!text || typeof text !== 'string') return text;
  return text.replace(/\{\{(\w+)\}\}/g, (match, key) =>
    Object.prototype.hasOwnProperty.call(context, key)
      ? (context as unknown as Record<string, string>)[key]
      : match,
  );
}

export function deriveInitialFields(
  event: Partial<SportLinkEvent> | null | undefined,
  club: Partial<SportLinkClub> | null | undefined,
): {
  homeName: string;
  awayName: string;
  homeLogo: string;
  awayLogo: string;
  championship: string;
  tagline: string;
} {
  const ctx = buildVarContext(event, club);
  const homeOrAway = event?.homeOrAway;

  return {
    homeName:     homeOrAway === 'away' ? '' : (club?.name || ctx.team_home),
    awayName:     homeOrAway === 'away' ? (club?.name || ctx.team_away) : ctx.team_away,
    homeLogo:     homeOrAway !== 'away' ? (club?.logoUrl ?? (club as { logo_url?: string })?.logo_url ?? '') : '',
    awayLogo:     homeOrAway === 'away' ? (club?.logoUrl ?? (club as { logo_url?: string })?.logo_url ?? '') : '',
    championship: ctx.competition,
    tagline:      'Venez nombreux !',
  };
}
