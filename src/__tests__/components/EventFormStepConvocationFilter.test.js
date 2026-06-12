/**
 * Tests du filtre équipe dans EventFormStepConvocation.
 * Vérifie que le filtre Supabase utilise team_id (UUID) ou team_name (string)
 * selon la valeur fournie.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Logique du filtre (extraite du composant) ─────────────────────────────────

function applyTeamFilter(query, teamId) {
  if (!teamId) return query;
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(teamId));
  return isUUID ? query.eq('team_id', teamId) : query.eq('team_name', teamId);
}

// ── Mock query builder ────────────────────────────────────────────────────────

function makeQuery() {
  const calls = [];
  const q = {
    eq: vi.fn((col, val) => { calls.push({ col, val }); return q; }),
    _calls: calls,
  };
  return q;
}

describe('applyTeamFilter — logique UUID vs team_name', () => {
  it('UUID valide → filtre par team_id', () => {
    const q = makeQuery();
    applyTeamFilter(q, '550e8400-e29b-41d4-a716-446655440000');
    expect(q.eq).toHaveBeenCalledWith('team_id', '550e8400-e29b-41d4-a716-446655440000');
  });

  it('nom d\'équipe (string) → filtre par team_name', () => {
    const q = makeQuery();
    applyTeamFilter(q, 'Équipe 1');
    expect(q.eq).toHaveBeenCalledWith('team_name', 'Équipe 1');
  });

  it('U17 → filtre par team_name', () => {
    const q = makeQuery();
    applyTeamFilter(q, 'U17');
    expect(q.eq).toHaveBeenCalledWith('team_name', 'U17');
  });

  it('Équipe F → filtre par team_name', () => {
    const q = makeQuery();
    applyTeamFilter(q, 'Équipe F');
    expect(q.eq).toHaveBeenCalledWith('team_name', 'Équipe F');
  });

  it('null → pas de filtre ajouté', () => {
    const q = makeQuery();
    applyTeamFilter(q, null);
    expect(q.eq).not.toHaveBeenCalled();
  });

  it('undefined → pas de filtre ajouté', () => {
    const q = makeQuery();
    applyTeamFilter(q, undefined);
    expect(q.eq).not.toHaveBeenCalled();
  });

  it('chaîne qui ressemble à UUID mais incomplète → team_name', () => {
    const q = makeQuery();
    applyTeamFilter(q, '550e8400-e29b');
    expect(q.eq).toHaveBeenCalledWith('team_name', '550e8400-e29b');
  });

  it('UUID en majuscules → filtre par team_id', () => {
    const q = makeQuery();
    applyTeamFilter(q, '550E8400-E29B-41D4-A716-446655440000');
    expect(q.eq).toHaveBeenCalledWith('team_id', '550E8400-E29B-41D4-A716-446655440000');
  });
});

// ── Intégration avec demoClient ───────────────────────────────────────────────

import { demoClient, resetDemoTables } from '../../demo/demoClient.js';
import { DEMO_CLUB_ID } from '../../demo/data/index.js';

beforeEach(() => resetDemoTables());

describe('filtre équipe avec demoClient réel', () => {
  it('team_name "Équipe 1" retourne 22 joueurs', async () => {
    const q = demoClient
      .from('club_players')
      .select('id, name, team_name')
      .eq('club_id', DEMO_CLUB_ID)
      .eq('team_name', 'Équipe 1');
    const { data, error } = await q;
    expect(error).toBeNull();
    expect(data.length).toBe(22);
    expect(data.every(p => p.team_name === 'Équipe 1')).toBe(true);
  });

  it('team_name "U17" retourne 16 joueurs', async () => {
    const { data } = await demoClient
      .from('club_players')
      .select('*')
      .eq('club_id', DEMO_CLUB_ID)
      .eq('team_name', 'U17');
    expect(data.length).toBe(16);
  });

  it('team_name "U15" retourne 12 joueurs', async () => {
    const { data } = await demoClient
      .from('club_players')
      .select('*')
      .eq('club_id', DEMO_CLUB_ID)
      .eq('team_name', 'U15');
    expect(data.length).toBe(12);
  });

  it('team_name "Équipe F" retourne 11 joueuses', async () => {
    const { data } = await demoClient
      .from('club_players')
      .select('*')
      .eq('club_id', DEMO_CLUB_ID)
      .eq('team_name', 'Équipe F');
    expect(data.length).toBe(11);
  });

  it('sans filtre équipe → tous les joueurs du club (75)', async () => {
    const { data } = await demoClient
      .from('club_players')
      .select('*')
      .eq('club_id', DEMO_CLUB_ID);
    expect(data.length).toBe(75);
  });

  it('team_name invalide → 0 joueurs (pas d\'erreur)', async () => {
    const { data, error } = await demoClient
      .from('club_players')
      .select('*')
      .eq('club_id', DEMO_CLUB_ID)
      .eq('team_name', 'Équipe Inexistante');
    expect(error).toBeNull();
    expect(data.length).toBe(0);
  });
});
