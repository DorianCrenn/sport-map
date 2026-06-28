import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useClubPlayers } from '../../hooks/useClubPlayers.js';
import { useMatchStats, type PlayerMatchStat } from '../../hooks/usePlayerStats.js';

interface MatchStatsModalProps {
  event: Record<string, any>;
  clubId: string;
  onClose: () => void;
}

const STATUS_OPTIONS = [
  { value: 'present',    label: '✅ Présent' },
  { value: 'absent',     label: '❌ Absent' },
  { value: 'unsure',     label: '❓ Incertain' },
  { value: 'not_called', label: '— Non convoqué' },
];

interface PlayerRow {
  playerId: string;
  name: string;
  number?: number | null;
  position?: string | null;
  status: PlayerMatchStat['status'];
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
}

function StatCounter({ value, onChange, disabled }: { value: number; onChange: (v: number) => void; disabled?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <button onClick={() => onChange(Math.max(0, value - 1))} disabled={disabled || value === 0}
        style={{ width: 24, height: 24, borderRadius: 6, border: '1px solid var(--sl-border)', backgroundColor: 'var(--sl-surface)', color: 'var(--sl-t2)', cursor: 'pointer', fontSize: 16, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: disabled || value === 0 ? 0.4 : 1 }}>
        −
      </button>
      <span style={{ fontSize: 14, fontWeight: 800, minWidth: 18, textAlign: 'center', color: value > 0 ? 'var(--sl-t1)' : 'var(--sl-t3)', fontVariantNumeric: 'tabular-nums' }}>{value}</span>
      <button onClick={() => onChange(value + 1)} disabled={disabled}
        style={{ width: 24, height: 24, borderRadius: 6, border: '1px solid var(--sl-border)', backgroundColor: 'var(--sl-surface)', color: 'var(--sl-t2)', cursor: 'pointer', fontSize: 16, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: disabled ? 0.4 : 1 }}>
        +
      </button>
    </div>
  );
}

export default function MatchStatsModal({ event, clubId, onClose }: MatchStatsModalProps) {
  const { players, loading: playersLoading } = useClubPlayers(clubId) as any;
  const { stats, loading: statsLoading, bulkUpsert } = useMatchStats(event.id);
  const [rows, setRows] = useState<PlayerRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  // Initialize rows from players + existing stats
  useEffect(() => {
    if (playersLoading || statsLoading) return;
    const statMap: Record<string, PlayerMatchStat> = {};
    for (const s of stats) statMap[s.playerId] = s;

    setRows((players ?? []).filter((p: any) => p.is_active !== false).map((p: any): PlayerRow => {
      const s = statMap[p.id];
      return {
        playerId:    p.id,
        name:        p.name ?? '?',
        number:      p.number ?? null,
        position:    p.position ?? null,
        status:      s?.status ?? 'not_called',
        goals:       s?.goals ?? 0,
        assists:     s?.assists ?? 0,
        yellowCards: s?.yellowCards ?? 0,
        redCards:    s?.redCards ?? 0,
      };
    }));
  }, [players, stats, playersLoading, statsLoading]);

  function updateRow(playerId: string, patch: Partial<PlayerRow>) {
    setRows(prev => prev.map(r => r.playerId === playerId ? { ...r, ...patch } : r));
  }

  const present = useMemo(() => rows.filter(r => r.status === 'present'), [rows]);
  const others  = useMemo(() => rows.filter(r => r.status !== 'present'), [rows]);

  async function handleSave() {
    setSaving(true);
    try {
      await bulkUpsert(rows.map(r => ({
        eventId:      event.id,
        playerId:     r.playerId,
        clubId:       clubId,
        status:       r.status,
        goals:        r.goals,
        assists:      r.assists,
        yellowCards:  r.yellowCards,
        redCards:     r.redCards,
      })));
      setSaved(true);
      setTimeout(onClose, 1200);
    } finally { setSaving(false); }
  }

  const statLabelStyle = { fontSize: 9, fontWeight: 700, color: 'var(--sl-t3)', letterSpacing: '0.06em', textTransform: 'uppercase' as const, textAlign: 'center' as const };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 300, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        style={{ width: '100%', maxWidth: 560, backgroundColor: 'var(--sl-card)', borderRadius: '20px 20px 0 0', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Header */}
        <div style={{ padding: '16px 18px 12px', borderBottom: '1px solid var(--sl-border)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--sl-t1)' }}>Stats post-match</div>
              <div style={{ fontSize: 11, color: 'var(--sl-t3)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 240 }}>{event.title}</div>
            </div>
            <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--sl-border)', backgroundColor: 'transparent', color: 'var(--sl-t3)', cursor: 'pointer' }}>×</button>
          </div>
        </div>

        {/* Column headers */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px 40px 40px 40px 40px', gap: 6, padding: '8px 16px', flexShrink: 0 }}>
          <span style={statLabelStyle}>Joueur</span>
          <span style={statLabelStyle}>Présence</span>
          <span style={statLabelStyle}>⚽</span>
          <span style={statLabelStyle}>🅰️</span>
          <span style={statLabelStyle}>🟨</span>
          <span style={statLabelStyle}>🟥</span>
        </div>

        {/* Player rows */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '0 12px 12px' }}>
          {playersLoading || statsLoading ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--sl-t3)', fontSize: 13 }}>Chargement…</div>
          ) : (
            <>
              {present.length > 0 && (
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--sl-t3)', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '10px 4px 6px' }}>Présents ({present.length})</div>
                  {present.map(r => <PlayerStatRow key={r.playerId} row={r} onChange={patch => updateRow(r.playerId, patch)} />)}
                </div>
              )}
              {others.length > 0 && (
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--sl-t3)', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '10px 4px 6px' }}>Autres ({others.length})</div>
                  {others.map(r => <PlayerStatRow key={r.playerId} row={r} onChange={patch => updateRow(r.playerId, patch)} />)}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 16px calc(16px + env(safe-area-inset-bottom, 0px))', borderTop: '1px solid var(--sl-border)', flexShrink: 0 }}>
          <button onClick={handleSave} disabled={saving || saved}
            style={{ width: '100%', padding: '13px', borderRadius: 12, border: 'none', backgroundColor: saved ? '#22C55E' : 'var(--sl-accent)', color: '#fff', fontSize: 14, fontWeight: 800, cursor: saving || saved ? 'default' : 'pointer' }}>
            {saved ? '✅ Enregistré !' : saving ? '⏳ Enregistrement…' : `💾 Enregistrer les stats (${rows.length} joueurs)`}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function PlayerStatRow({ row, onChange }: { row: PlayerRow; onChange: (p: Partial<PlayerRow>) => void }) {
  const isPresent = row.status === 'present';
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px 40px 40px 40px 40px', gap: 6, alignItems: 'center', padding: '6px 4px', borderBottom: '1px solid var(--sl-border-s)' }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--sl-t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {row.number ? `#${row.number} ` : ''}{row.name}
        </div>
        {row.position && <div style={{ fontSize: 10, color: 'var(--sl-t3)' }}>{row.position}</div>}
      </div>

      <select value={row.status} onChange={e => onChange({ status: e.target.value as PlayerRow['status'] })}
        style={{ fontSize: 10, fontWeight: 600, padding: '4px 4px', borderRadius: 7, border: `1px solid ${isPresent ? 'rgba(34,197,94,0.4)' : 'var(--sl-border)'}`, backgroundColor: isPresent ? 'rgba(34,197,94,0.08)' : 'var(--sl-surface)', color: isPresent ? '#22c55e' : 'var(--sl-t2)', cursor: 'pointer' }}>
        {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>

      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <StatCounter value={row.goals}       onChange={v => onChange({ goals: v })}       disabled={!isPresent} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <StatCounter value={row.assists}     onChange={v => onChange({ assists: v })}     disabled={!isPresent} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <StatCounter value={row.yellowCards} onChange={v => onChange({ yellowCards: v })} disabled={!isPresent} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <StatCounter value={row.redCards}    onChange={v => onChange({ redCards: v })}    disabled={!isPresent} />
      </div>
    </div>
  );
}
