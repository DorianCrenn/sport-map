import { describe, it, expect } from 'vitest';
import {
  buildVarContext,
  resolveVars,
  deriveInitialFields,
} from '../../lib/posterVariables.js';

// ── buildVarContext ────────────────────────────────────────────────────────────

describe('buildVarContext', () => {
  const fullEvent = {
    title: 'US Brest vs FC Landivisiau',
    sport: 'Football',
    date: '2026-06-21T15:00:00',
    city: 'Brest',
    venue: 'Stade Francis-Le Blé',
    eventType: 'championship',
    level: 'D1',
    score: '2-1',
  };

  const club = { name: 'US Brest', logo_url: 'https://cdn.example.com/logo.png' };

  it('extrait team_home et team_away depuis le titre "X vs Y"', () => {
    const ctx = buildVarContext(fullEvent, null);
    expect(ctx.team_home).toBe('US Brest');
    expect(ctx.team_away).toBe('FC Landivisiau');
  });

  it('utilise le titre entier comme team_home si pas de "vs"', () => {
    const ctx = buildVarContext({ ...fullEvent, title: 'Match de gala' }, club);
    expect(ctx.team_home).toBe('Match de gala');
  });

  it('utilise club.name comme team_home si le titre est vide', () => {
    const ctx = buildVarContext({ ...fullEvent, title: '' }, club);
    expect(ctx.team_home).toBe('US Brest');
  });

  it('formate la date complète en français', () => {
    const ctx = buildVarContext(fullEvent, null);
    expect(ctx.date_full).toMatch(/juin/i);   // l'année n'est pas incluse dans la locale jsdom
    expect(ctx.date_num).toBe('21');
    expect(ctx.date_month).toMatch(/JUIN/i);
  });

  it('formate l\'heure correctement', () => {
    const ctx = buildVarContext(fullEvent, null);
    expect(ctx.time).toBe('15:00');
  });

  it('construit le label compétition depuis eventType + level', () => {
    const ctx = buildVarContext(fullEvent, null);
    expect(ctx.competition).toMatch(/CHAMPIONNAT/i);
    expect(ctx.competition).toContain('D1');
  });

  it('résout venue et city', () => {
    const ctx = buildVarContext(fullEvent, null);
    expect(ctx.venue).toBe('Stade Francis-Le Blé');
    expect(ctx.city).toBe('Brest');
  });

  it('résout le score home/away', () => {
    const ctx = buildVarContext(fullEvent, null);
    expect(ctx.score_home).toBe('2');
    expect(ctx.score_away).toBe('1');
  });

  it('score_home et score_away vides si pas de score', () => {
    const ctx = buildVarContext({ ...fullEvent, score: null }, null);
    expect(ctx.score_home).toBe('');
    expect(ctx.score_away).toBe('');
  });

  it('club_logo depuis club.logo_url', () => {
    const ctx = buildVarContext(fullEvent, club);
    expect(ctx.club_logo).toBe('https://cdn.example.com/logo.png');
  });

  it('club_logo depuis club.logoUrl si logo_url absent', () => {
    const ctx = buildVarContext(fullEvent, { name: 'FC Test', logoUrl: 'https://cdn.example.com/alt.png' });
    expect(ctx.club_logo).toBe('https://cdn.example.com/alt.png');
  });

  it('retourne des chaînes vides pour les champs manquants sur event null', () => {
    const ctx = buildVarContext(null, null);
    expect(ctx.team_home).toBe('');
    expect(ctx.team_away).toBe('');
    expect(ctx.city).toBe('');
    expect(ctx.venue).toBe('');
    expect(ctx.club_logo).toBe('');
  });

  it('sport est transmis tel quel', () => {
    const ctx = buildVarContext(fullEvent, null);
    expect(ctx.sport).toBe('Football');
  });

  it('level est transmis tel quel', () => {
    const ctx = buildVarContext(fullEvent, null);
    expect(ctx.level).toBe('D1');
  });

  it('venue fallback sur city si venue absent', () => {
    const ctx = buildVarContext({ ...fullEvent, venue: undefined }, null);
    expect(ctx.venue).toBe('Brest');
  });
});

// ── resolveVars ───────────────────────────────────────────────────────────────

describe('resolveVars', () => {
  const ctx = {
    team_home: 'US Brest',
    team_away: 'FC Landivisiau',
    date_full: 'Samedi 21 juin 2026',
    time:      '15:00',
  };

  it('remplace une variable simple', () => {
    expect(resolveVars('{{team_home}}', ctx)).toBe('US Brest');
  });

  it('remplace plusieurs variables dans la même chaîne', () => {
    const result = resolveVars('{{team_home}} vs {{team_away}}', ctx);
    expect(result).toBe('US Brest vs FC Landivisiau');
  });

  it('conserve les variables inconnues telles quelles', () => {
    expect(resolveVars('{{unknown_var}}', ctx)).toBe('{{unknown_var}}');
  });

  it('ne modifie pas le texte sans variables', () => {
    expect(resolveVars('Match du dimanche', ctx)).toBe('Match du dimanche');
  });

  it('retourne null inchangé', () => {
    expect(resolveVars(null, ctx)).toBeNull();
  });

  it('retourne undefined inchangé', () => {
    expect(resolveVars(undefined, ctx)).toBeUndefined();
  });

  it('gère un contexte vide (toutes les vars restent)', () => {
    expect(resolveVars('{{team_home}}', {})).toBe('{{team_home}}');
  });

  it('remplace une variable dans une phrase complète', () => {
    const result = resolveVars('Bienvenue au stade pour {{team_home}} — {{time}}', ctx);
    expect(result).toBe('Bienvenue au stade pour US Brest — 15:00');
  });
});

// ── deriveInitialFields ────────────────────────────────────────────────────────

describe('deriveInitialFields', () => {
  const event = {
    title: 'US Brest vs FC Landivisiau',
    eventType: 'championship',
    level: 'D1',
  };
  const club = {
    name: 'US Brest',
    logo_url: 'https://cdn.example.com/logo.png',
  };

  it('club à domicile : homeName = club.name, awayName = équipe adverse', () => {
    const fields = deriveInitialFields({ ...event, homeOrAway: 'home' }, club);
    expect(fields.homeName).toBe('US Brest');
    expect(fields.awayName).toBe('FC Landivisiau');
  });

  it('club à l\'extérieur : awayName = club.name, homeName = "" (adversaire inconnu)', () => {
    const fields = deriveInitialFields({ ...event, homeOrAway: 'away' }, club);
    expect(fields.awayName).toBe('US Brest');
    // homeName laissé vide — l'utilisateur renseigne l'adversaire manuellement
    expect(fields.homeName).toBe('');
  });

  it('homeLogo renseigné si club à domicile', () => {
    const fields = deriveInitialFields({ ...event, homeOrAway: 'home' }, club);
    expect(fields.homeLogo).toBe('https://cdn.example.com/logo.png');
    expect(fields.awayLogo).toBe('');
  });

  it('awayLogo renseigné si club à l\'extérieur', () => {
    const fields = deriveInitialFields({ ...event, homeOrAway: 'away' }, club);
    expect(fields.awayLogo).toBe('https://cdn.example.com/logo.png');
    expect(fields.homeLogo).toBe('');
  });

  it('championship renseigné depuis eventType + level', () => {
    const fields = deriveInitialFields(event, club);
    expect(fields.championship).toMatch(/CHAMPIONNAT/i);
    expect(fields.championship).toContain('D1');
  });

  it('tagline vaut "Venez nombreux !" par défaut', () => {
    const fields = deriveInitialFields(event, club);
    expect(fields.tagline).toBe('Venez nombreux !');
  });

  it('sans club : les noms sont parsés depuis le titre', () => {
    const fields = deriveInitialFields(event, null);
    expect(fields.homeName).toBe('US Brest');
    expect(fields.awayName).toBe('FC Landivisiau');
    expect(fields.homeLogo).toBe('');
    expect(fields.awayLogo).toBe('');
  });

  it('sans event : retourne des valeurs par défaut non nulles', () => {
    const fields = deriveInitialFields(null, null);
    expect(fields.homeName).toBeDefined();
    expect(fields.tagline).toBe('Venez nombreux !');
  });
});
