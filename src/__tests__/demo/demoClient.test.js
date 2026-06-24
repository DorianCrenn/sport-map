import { describe, it, expect, beforeEach } from 'vitest';
import { demoClient, resetDemoTables } from '../../demo/demoClient.js';
import { buildDemoTables, DEMO_CLUB_ID, DEMO_USER_ID } from '../../demo/data/index.js';

beforeEach(() => {
  resetDemoTables();
});

// ── buildDemoTables ───────────────────────────────────────────────────────────

describe('buildDemoTables — structure', () => {
  it('contient toutes les tables requises', () => {
    const t = buildDemoTables();
    const required = [
      'events', 'clubs', 'profiles', 'club_announcements',
      'rides', 'ride_requests', 'club_sponsors', 'club_players',
      'event_convocations', 'club_managers', 'club_follows',
    ];
    for (const table of required) {
      expect(t[table], `Table manquante : ${table}`).toBeDefined();
      expect(Array.isArray(t[table]), `${table} doit être un Array`).toBe(true);
    }
  });

  it('contient des joueurs (au moins 1)', () => {
    const { club_players } = buildDemoTables();
    expect(club_players.length).toBeGreaterThan(0);
  });

  it('tous les joueurs ont une photo_url', () => {
    const { club_players } = buildDemoTables();
    const withoutPhoto = club_players.filter(p => !p.photo_url);
    expect(withoutPhoto.length).toBe(0);
  });

  it('certains joueurs ont un email', () => {
    const { club_players } = buildDemoTables();
    const withEmail = club_players.filter(p => p.email);
    // En pratique, seuls certains joueurs ont un email renseigné
    expect(withEmail.length).toBeGreaterThan(0);
  });

  it('le club démo existe avec les bonnes catégories', () => {
    const { clubs } = buildDemoTables();
    const club = clubs[0];
    expect(club.id).toBe(DEMO_CLUB_ID);
    expect(club.categories).toBeInstanceOf(Array);
    expect(club.categories.length).toBeGreaterThan(0);
    // Les équipes doivent être des objets {name: string}
    const firstTeam = club.categories[0].teams[0];
    expect(typeof firstTeam).toBe('object');
    expect(typeof firstTeam.name).toBe('string');
  });

  it('le profil démo a role club_admin par défaut', () => {
    const { profiles } = buildDemoTables();
    const profile = profiles.find(p => p.id === DEMO_USER_ID);
    expect(profile).toBeDefined();
    expect(profile.role).toBe('club_admin');
  });
});

// ── DemoQueryBuilder — SELECT ─────────────────────────────────────────────────

describe('demoClient — select & filtres', () => {
  it('retourne tous les événements sans filtre', async () => {
    const { data, error } = await demoClient.from('events').select('*');
    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(10);
  });

  it('.eq() filtre correctement par valeur exacte', async () => {
    const { data } = await demoClient
      .from('clubs')
      .select('*')
      .eq('id', DEMO_CLUB_ID);
    expect(data.length).toBe(1);
    expect(data[0].id).toBe(DEMO_CLUB_ID);
  });

  it('.eq() ne retourne rien si la valeur ne correspond pas', async () => {
    const { data } = await demoClient
      .from('clubs')
      .select('*')
      .eq('id', 'club-inexistant');
    expect(data.length).toBe(0);
  });

  it('.neq() exclut les lignes correspondantes', async () => {
    const { data } = await demoClient
      .from('club_players')
      .select('*')
      .eq('club_id', DEMO_CLUB_ID)
      .neq('team_name', 'Équipe 1');
    expect(data.every(p => p.team_name !== 'Équipe 1')).toBe(true);
  });

  it('.in() filtre sur plusieurs valeurs', async () => {
    const { data } = await demoClient
      .from('club_players')
      .select('*')
      .in('team_name', ['U17', 'U15']);
    expect(data.length).toBeGreaterThan(0);
    expect(data.every(p => ['U17', 'U15'].includes(p.team_name))).toBe(true);
  });

  it('.limit() limite le nombre de résultats', async () => {
    const { data } = await demoClient
      .from('events')
      .select('*')
      .limit(5);
    expect(data.length).toBeLessThanOrEqual(5);
  });

  it('.order() trie les résultats', async () => {
    const { data } = await demoClient
      .from('club_players')
      .select('*')
      .order('number', { ascending: true });
    expect(data[0].number).toBeLessThanOrEqual(data[1].number);
  });

  it('.single() retourne un seul objet', async () => {
    const { data } = await demoClient
      .from('clubs')
      .select('*')
      .eq('id', DEMO_CLUB_ID)
      .single();
    expect(data).toBeTruthy();
    expect(data.id).toBe(DEMO_CLUB_ID);
    expect(Array.isArray(data)).toBe(false);
  });

  it('.maybeSingle() retourne null si aucun résultat', async () => {
    const { data, error } = await demoClient
      .from('clubs')
      .select('*')
      .eq('id', 'club-inexistant')
      .maybeSingle();
    expect(error).toBeNull();
    expect(data).toBeNull();
  });
});

// ── DemoQueryBuilder — OR ─────────────────────────────────────────────────────

describe('demoClient — .or()', () => {
  it('filtre avec OR sur deux valeurs égales', async () => {
    const { data } = await demoClient
      .from('club_players')
      .select('*')
      .or(`team_name.eq.U17,team_name.eq.U15`);
    expect(data.length).toBeGreaterThan(0);
    expect(data.every(p => p.team_name === 'U17' || p.team_name === 'U15')).toBe(true);
  });

  it('filtre avec OR sur null', async () => {
    const { data } = await demoClient
      .from('events')
      .select('*')
      .or(`score.is.null,status.eq.upcoming`);
    expect(Array.isArray(data)).toBe(true);
  });

  it('retourne toutes les lignes si filtre OR est toujours vrai', async () => {
    const { data: all } = await demoClient.from('events').select('*');
    const { data: filtered } = await demoClient
      .from('events')
      .select('*')
      .or(`id.eq.${all[0].id},id.neq.${all[0].id}`);
    expect(filtered.length).toBe(all.length);
  });

  it('ne plante pas sur un filtre OR malformé', async () => {
    const { data, error } = await demoClient
      .from('events')
      .select('*')
      .or('invalid_filter_string');
    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
  });
});

// ── DemoQueryBuilder — mutations ─────────────────────────────────────────────

describe('demoClient — mutations', () => {
  it('.insert() ajoute un enregistrement', async () => {
    const before = (await demoClient.from('events').select('*')).data.length;
    await demoClient.from('events').insert({
      id: 'test-event-insert',
      club_id: DEMO_CLUB_ID,
      title: 'Test',
    });
    const after = (await demoClient.from('events').select('*')).data.length;
    expect(after).toBe(before + 1);
  });

  it('.update() modifie les lignes filtrées', async () => {
    await demoClient
      .from('clubs')
      .update({ name: 'Updated Club' })
      .eq('id', DEMO_CLUB_ID);
    const { data } = await demoClient.from('clubs').select('*').eq('id', DEMO_CLUB_ID);
    expect(data[0].name).toBe('Updated Club');
  });

  it('.delete() supprime les lignes filtrées', async () => {
    await demoClient.from('events').insert({ id: 'to-delete-123', club_id: DEMO_CLUB_ID });
    await demoClient.from('events').delete().eq('id', 'to-delete-123');
    const { data } = await demoClient.from('events').select('*').eq('id', 'to-delete-123');
    expect(data.length).toBe(0);
  });

  it('.upsert() insère si absent', async () => {
    await demoClient.from('events').upsert(
      { id: 'upsert-new-001', club_id: DEMO_CLUB_ID, title: 'Upsert' },
      { onConflict: 'id' }
    );
    const { data } = await demoClient.from('events').select('*').eq('id', 'upsert-new-001');
    expect(data.length).toBe(1);
    expect(data[0].title).toBe('Upsert');
  });

  it('.upsert() met à jour si présent', async () => {
    await demoClient.from('clubs').upsert(
      { id: DEMO_CLUB_ID, name: 'Upserted Name' },
      { onConflict: 'id' }
    );
    const { data } = await demoClient.from('clubs').select('*').eq('id', DEMO_CLUB_ID);
    expect(data[0].name).toBe('Upserted Name');
  });
});

// ── resetDemoTables ───────────────────────────────────────────────────────────

describe('resetDemoTables', () => {
  it('réinitialise les données après mutation', async () => {
    await demoClient.from('clubs').update({ name: 'Modified' }).eq('id', DEMO_CLUB_ID);
    resetDemoTables();
    const { data } = await demoClient.from('clubs').select('*').eq('id', DEMO_CLUB_ID);
    expect(data[0].name).not.toBe('Modified');
  });
});

// ── team_name filter (fix convocations) ──────────────────────────────────────

describe('demoClient — filtre team_name pour convocations', () => {
  it('eq team_name retourne les joueurs de l\'Équipe 1', async () => {
    const { data } = await demoClient
      .from('club_players')
      .select('*')
      .eq('club_id', DEMO_CLUB_ID)
      .eq('team_name', 'Équipe 1');
    expect(data.length).toBe(22);
    expect(data.every(p => p.team_name === 'Équipe 1')).toBe(true);
  });

  it('eq team_name retourne les joueuses de l\'Équipe F', async () => {
    const { data } = await demoClient
      .from('club_players')
      .select('*')
      .eq('club_id', DEMO_CLUB_ID)
      .eq('team_name', 'Équipe F');
    expect(data.length).toBe(11);
  });
});
