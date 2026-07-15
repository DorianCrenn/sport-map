import { useState, useMemo } from 'react';
import { usePlayerSeasonStats, type PlayerSeasonStat } from '../../../hooks/usePlayerStats.js';
import { useClubStats } from '../../../hooks/useClubStats.js';
import { rankBy, type Metric } from './seasonRanking.js';

const METRICS: { id: Metric; label: string; icon: string }[] = [
  { id: 'goals',    label: 'Buteurs',  icon: '⚽' },
  { id: 'assists',  label: 'Passeurs', icon: '🎯' },
  { id: 'presence', label: 'Présence', icon: '📊' },
  { id: 'cards',    label: 'Cartons',  icon: '🟨' },
];

const MEDALS = ['🥇', '🥈', '🥉'];

interface Team { id: string; name: string }

interface ClubSeasonTabProps {
  club: Record<string, any>;
  accentColor?: string;
  canEdit?: boolean;
  allTeams?: Team[];
}

export default function ClubSeasonTab({ club, accentColor = 'var(--sl-green)', canEdit, allTeams = [] }: ClubSeasonTabProps) {
  const { stats, loading } = usePlayerSeasonStats(String(club.id));
  const [metric, setMetric] = useState<Metric>('goals');
  // undefined = pas encore choisi → défaut = 1re équipe ayant des données ; null = « Toutes »
  const [teamFilter, setTeamFilter] = useState<string | null | undefined>(undefined);

  // Seules les équipes ayant réellement des stats apparaissent dans la barre.
  const teamsWithData = useMemo(
    () => allTeams.filter(t => stats.some(p => p.teamId === t.id)),
    [allTeams, stats],
  );
  const showTeamBar = teamsWithData.length > 1;
  const effectiveFilter = teamFilter === undefined
    ? (showTeamBar ? (teamsWithData[0]?.id ?? null) : null)
    : teamFilter;

  const teamStats = useMemo(
    () => (effectiveFilter ? stats.filter(p => p.teamId === effectiveFilter) : stats),
    [stats, effectiveFilter],
  );

  // Bilan V/N/D (vue club_stats) — agrégé pour l'équipe sélectionnée (ou tout le club).
  const { stats: clubStats, form5 } = useClubStats(String(club.id));
  const teamName = teamsWithData.find(t => t.id === effectiveFilter)?.name ?? null;
  const bilan = useMemo(() => {
    const rows = (clubStats as any[]).filter(r => !teamName || r.team_name === teamName);
    return rows.reduce((a, r) => ({
      played: a.played + Number(r.played ?? 0),
      wins:   a.wins   + Number(r.wins ?? 0),
      draws:  a.draws  + Number(r.draws ?? 0),
      losses: a.losses + Number(r.losses ?? 0),
      gf:     a.gf     + Number(r.goals_for ?? 0),
      ga:     a.ga     + Number(r.goals_against ?? 0),
    }), { played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0 });
  }, [clubStats, teamName]);
  const form = teamName ? (form5[teamName] ?? []) : [];

  const summary = useMemo(() => ({
    goals:   teamStats.reduce((s, p) => s + p.totalGoals, 0),
    assists: teamStats.reduce((s, p) => s + p.totalAssists, 0),
    matches: teamStats.reduce((m, p) => Math.max(m, p.matchesTotal), 0),
    players: teamStats.length,
  }), [teamStats]);

  const ranked = useMemo(() => rankBy(teamStats, metric), [teamStats, metric]);

  const padBottom = 'calc(90px + env(safe-area-inset-bottom, 0px))';

  if (loading) {
    return (
      <div style={{ padding: `14px 14px ${padBottom}` }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[0, 1, 2, 3].map(i => (
            <div key={i} style={{ height: 56, borderRadius: 'var(--sl-radius-xl)', backgroundColor: 'var(--sl-card)', border: '1px solid var(--sl-border)', opacity: 0.5 }} />
          ))}
        </div>
      </div>
    );
  }

  if (stats.length === 0) {
    return (
      <div style={{ padding: `14px 14px ${padBottom}`, textAlign: 'center' }}>
        <div style={{ padding: '44px 20px' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
          <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--sl-t1)', marginBottom: 6 }}>La saison démarre</div>
          <div style={{ fontSize: 12.5, color: 'var(--sl-t3)', lineHeight: 1.55, maxWidth: 300, margin: '0 auto' }}>
            Les classements (buteurs, passeurs, présence) apparaîtront ici au fur et à mesure des matchs.
            {canEdit && ' Après un match, saisis les stats via le bouton « 📋 Stats joueurs » sur la carte du match.'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: `14px 14px ${padBottom}` }}>
      {/* Sélecteur d'équipe (clubs multi-équipes) */}
      {showTeamBar && (
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none', marginBottom: 14, paddingBottom: 2 } as React.CSSProperties}>
          {teamsWithData.map(t => {
            const active = effectiveFilter === t.id;
            return (
              <button key={t.id} onClick={() => setTeamFilter(t.id)} style={teamChip(active, accentColor)}>{t.name}</button>
            );
          })}
          <button onClick={() => setTeamFilter(null)} style={teamChip(effectiveFilter === null, accentColor)}>Toutes</button>
          <div style={{ flexShrink: 0, width: 4 }} />
        </div>
      )}

      {/* Bilan V/N/D + forme */}
      {bilan.played > 0 && <SeasonBilan bilan={bilan} form={form} />}

      {/* Récap */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 }}>
        {[
          { icon: '⚽', value: summary.goals,   label: 'Buts' },
          { icon: '🎯', value: summary.assists, label: 'Passes' },
          { icon: '📅', value: summary.matches, label: 'Matchs' },
          { icon: '👥', value: summary.players, label: 'Joueurs' },
        ].map(s => (
          <div key={s.label} style={{ padding: '12px 6px', borderRadius: 'var(--sl-radius-xl)', backgroundColor: 'var(--sl-card)', border: '1px solid var(--sl-border)', textAlign: 'center' }}>
            <div style={{ fontSize: 16, marginBottom: 3 }}>{s.icon}</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--sl-t1)', lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--sl-t3)', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Sélecteur de classement */}
      <div role="tablist" aria-label="Classement" style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        {METRICS.map(m => {
          const active = metric === m.id;
          return (
            <button
              key={m.id}
              role="tab"
              aria-selected={active}
              onClick={() => setMetric(m.id)}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                padding: '8px 4px', borderRadius: 'var(--sl-radius-lg)', cursor: 'pointer',
                border: `1px solid ${active ? 'transparent' : 'var(--sl-border)'}`,
                backgroundColor: active ? accentColor : 'var(--sl-card)',
                color: active ? '#fff' : 'var(--sl-t2)',
                transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: 15 }}>{m.icon}</span>
              <span style={{ fontSize: 10.5, fontWeight: 800 }}>{m.label}</span>
            </button>
          );
        })}
      </div>

      {/* Classement */}
      {ranked.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '30px 20px', fontSize: 12.5, color: 'var(--sl-t3)' }}>
          Aucune donnée pour ce classement.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {ranked.map((p, i) => (
            <SeasonRow key={p.playerId} player={p} rank={i} metric={metric} accentColor={accentColor} />
          ))}
        </div>
      )}
    </div>
  );
}

interface Bilan { played: number; wins: number; draws: number; losses: number; gf: number; ga: number }

function SeasonBilan({ bilan, form }: { bilan: Bilan; form: ('W' | 'D' | 'L')[] }) {
  const diff = bilan.gf - bilan.ga;
  return (
    <div style={{ padding: 14, borderRadius: 'var(--sl-radius-xl)', backgroundColor: 'var(--sl-card)', border: '1px solid var(--sl-border)', marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--sl-t2)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Bilan · {bilan.played} matchs
        </span>
        {form.length > 0 && (
          <div style={{ display: 'flex', gap: 4 }}>
            {form.map((r, i) => <FormChip key={i} r={r} />)}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        {[
          { n: bilan.wins,   label: 'Victoires', color: 'var(--sl-green)' },
          { n: bilan.draws,  label: 'Nuls',      color: '#f59e0b' },
          { n: bilan.losses, label: 'Défaites',  color: 'var(--sl-error)' },
        ].map(x => (
          <div key={x.label} style={{ flex: 1, textAlign: 'center', padding: '9px 4px', borderRadius: 'var(--sl-radius-lg)', backgroundColor: 'var(--sl-card-hi)' }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: x.color, lineHeight: 1 }}>{x.n}</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--sl-t3)', marginTop: 3 }}>{x.label}</div>
          </div>
        ))}
      </div>
      <div style={{ textAlign: 'center', fontSize: 12, fontWeight: 600, color: 'var(--sl-t2)' }}>
        ⚽ {bilan.gf} marqués · {bilan.ga} encaissés{' '}
        <span style={{ color: diff >= 0 ? 'var(--sl-green)' : 'var(--sl-error)', fontWeight: 800 }}>
          ({diff >= 0 ? '+' : ''}{diff})
        </span>
      </div>
    </div>
  );
}

function FormChip({ r }: { r: 'W' | 'D' | 'L' }) {
  const map: Record<string, [string, string]> = {
    W: ['var(--sl-green)', 'V'], D: ['#f59e0b', 'N'], L: ['var(--sl-error)', 'D'],
  };
  const [bg, label] = map[r] ?? map.D;
  return (
    <span style={{ width: 18, height: 18, borderRadius: 'var(--sl-radius-xs)', backgroundColor: bg, color: '#fff', fontSize: 10, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {label}
    </span>
  );
}

function teamChip(active: boolean, accentColor: string): React.CSSProperties {
  return {
    flexShrink: 0, padding: '7px 14px', borderRadius: 'var(--sl-radius-4xl)', cursor: 'pointer',
    fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', transition: 'all 0.15s',
    border: `1px solid ${active ? 'transparent' : 'var(--sl-border)'}`,
    backgroundColor: active ? accentColor : 'var(--sl-card)',
    color: active ? '#fff' : 'var(--sl-t2)',
  };
}

function SeasonRow({ player, rank, metric, accentColor }: {
  player: PlayerSeasonStat; rank: number; metric: Metric; accentColor: string;
}) {
  const top3 = rank < 3;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
      borderRadius: 'var(--sl-radius-xl)', backgroundColor: 'var(--sl-card)',
      border: `1px solid ${top3 ? `${accentColor}55` : 'var(--sl-border)'}`,
    }}>
      <div style={{ width: 26, textAlign: 'center', fontSize: top3 ? 18 : 13, fontWeight: 900, color: top3 ? undefined : 'var(--sl-t3)', flexShrink: 0 }}>
        {top3 ? MEDALS[rank] : rank + 1}
      </div>

      {player.jerseyNumber != null && (
        <div style={{ width: 24, height: 24, flexShrink: 0, borderRadius: 'var(--sl-radius-sm)', backgroundColor: `${accentColor}18`, color: accentColor, fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {player.jerseyNumber}
        </div>
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--sl-t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {player.playerName}
        </div>
        {player.position && (
          <div style={{ fontSize: 10.5, color: 'var(--sl-t3)', fontWeight: 600 }}>{player.position}</div>
        )}
      </div>

      <SeasonValue player={player} metric={metric} accentColor={accentColor} />
    </div>
  );
}

function SeasonValue({ player, metric, accentColor }: { player: PlayerSeasonStat; metric: Metric; accentColor: string }) {
  if (metric === 'presence') {
    const pct = player.matchesTotal > 0 ? Math.round((player.matchesPlayed / player.matchesTotal) * 100) : 0;
    return (
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: 17, fontWeight: 900, color: 'var(--sl-t1)', lineHeight: 1 }}>{pct}<span style={{ fontSize: 11 }}>%</span></div>
        <div style={{ fontSize: 10, color: 'var(--sl-t3)', fontWeight: 600, marginTop: 2 }}>{player.matchesPlayed}/{player.matchesTotal} matchs</div>
      </div>
    );
  }
  if (metric === 'cards') {
    return (
      <div style={{ display: 'flex', gap: 8, flexShrink: 0, alignItems: 'center' }}>
        <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--sl-t2)' }}>🟨 {player.totalYellow}</span>
        <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--sl-t2)' }}>🟥 {player.totalRed}</span>
      </div>
    );
  }
  const value = metric === 'goals' ? player.totalGoals : player.totalAssists;
  return (
    <div style={{ textAlign: 'right', flexShrink: 0 }}>
      <div style={{ fontSize: 19, fontWeight: 900, color: accentColor, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 10, color: 'var(--sl-t3)', fontWeight: 600, marginTop: 2 }}>en {player.matchesPlayed} m.</div>
    </div>
  );
}
