import { parseVs, fmtDate, champLabel } from '../components/poster/posterUtils.js';

// ── 17 predefined variables available in poster templates ──────────────────────
//
// Usage in tagline or future text blocks: {{team_home}}, {{date_full}}, etc.
// resolveVars() replaces all {{key}} occurrences in a string.

export function buildVarContext(event, club) {
  const { home, away } = parseVs(event?.title || '');
  const dt = fmtDate(event?.date);
  const champ = champLabel(event?.eventType, event?.level);

  // Parse score if present: "2-1" → home=2, away=1
  const scoreStr = event?.score != null ? String(event.score) : '';
  const scoreParts = scoreStr.split('-');
  const scoreHome = scoreParts[0]?.trim() ?? '';
  const scoreAway = scoreParts[1]?.trim() ?? '';

  return {
    team_home:    home || club?.name || '',
    team_away:    away || '',
    date_full:    dt.long || '',
    date_short:   dt.short || '',
    date_day:     dt.weekday || '',
    date_num:     dt.day || '',
    date_month:   dt.month || '',
    time:         dt.time || '',
    competition:  champ || '',
    level:        event?.level || '',
    venue:        event?.venue || event?.city || '',
    city:         event?.city || '',
    club_name:    club?.name || '',
    club_logo:    club?.logo_url ?? club?.logoUrl ?? '',
    sport:        event?.sport || '',
    score_home:   scoreHome,
    score_away:   scoreAway,
  };
}

// Replace all {{key}} tokens in a string using the given context.
// Unknown keys are left as-is so the user can see what's unresolved.
export function resolveVars(text, context) {
  if (!text || typeof text !== 'string') return text;
  return text.replace(/\{\{(\w+)\}\}/g, (match, key) =>
    Object.prototype.hasOwnProperty.call(context, key) ? context[key] : match
  );
}

// Derive the initial PosterStudio field values from an event + club.
// These populate the text inputs on first open (before the user edits anything).
export function deriveInitialFields(event, club) {
  const ctx = buildVarContext(event, club);
  const homeOrAway = event?.homeOrAway;

  return {
    homeName: homeOrAway === 'away' ? '' : (club?.name || ctx.team_home),
    awayName: homeOrAway === 'away' ? (club?.name || ctx.team_away) : ctx.team_away,
    homeLogo: homeOrAway !== 'away' ? (club?.logo_url ?? club?.logoUrl ?? '') : '',
    awayLogo: homeOrAway === 'away' ? (club?.logo_url ?? club?.logoUrl ?? '') : '',
    championship: ctx.competition,
    tagline: 'Venez nombreux !',
  };
}
