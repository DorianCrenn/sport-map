import { useState, useEffect } from 'react';
import PlayerSelector from '../PlayerSelector.jsx';
import TennisSetsInput from './TennisSetsInput.jsx';

const SIDE_COLOR = { home: '#22c55e', away: '#ef4444' };

/**
 * Carte d'une rencontre individuelle tennis (simple ou double).
 *
 * Props :
 *   encounter     — objet rencontre (depuis match_encounters)
 *   encounterType — config du type ({ key, label, players, order })
 *   clubId        — ID du club pour PlayerSelector
 *   setsPerMatch  — nombre de sets (3 par défaut)
 *   onSave        — fn(encounter) appelée après chaque modification
 */
export default function EncounterCard({ encounter, encounterType, clubId, setsPerMatch = 3, onSave }) {
  const [open, setOpen]         = useState(false);
  const [local, setLocal]       = useState(encounter);
  const [saving, setSaving]     = useState(false);

  useEffect(() => { setLocal(encounter); }, [encounter.encounter_type]);

  const isDouble = encounterType.players.home === 2;
  const winner   = local.winner_side;

  function setPlayer(side, slot, value) {
    const key   = `${side}_player${slot}`;
    const dataKey = `${key}_data`;
    const idKey   = `${key}_id`;
    setLocal(prev => ({ ...prev, [idKey]: value.player_id ?? null, [dataKey]: value.data ?? {} }));
  }

  function handleSetsChange(setsData) {
    const next = {
      ...local,
      score_detail:  { sets: setsData.sets, sets_won: setsData.sets_won },
      winner_side:   setsData.winner_side ?? local.winner_side,
    };
    setLocal(next);
    autoSave(next);
  }

  function setWinnerManual(side) {
    const next = { ...local, winner_side: side };
    setLocal(next);
    autoSave(next);
  }

  async function autoSave(data) {
    setSaving(true);
    await onSave(data);
    setSaving(false);
  }

  function playerLabel(side, slot) {
    const data = local[`${side}_player${slot}_data`] ?? {};
    return data.name || '—';
  }

  const setsWon = local.score_detail?.sets_won;

  return (
    <div style={{
      borderRadius: 12, border: `1px solid ${winner ? SIDE_COLOR[winner] + '40' : 'var(--sl-border)'}`,
      backgroundColor: 'var(--sl-card)', overflow: 'hidden',
      transition: 'border-color 0.2s',
    }}>
      {/* Header cliquable */}
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%', padding: '11px 14px', background: 'none', border: 'none',
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
          borderBottom: open ? '1px solid var(--sl-border)' : 'none',
        }}
      >
        {/* Badge type */}
        <span style={{
          fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 20,
          backgroundColor: 'rgba(99,102,241,0.12)', color: '#6366f1', flexShrink: 0,
        }}>
          {isDouble ? '×2' : '×1'} {encounterType.label}
        </span>

        {/* Score ou état */}
        <span style={{ flex: 1, fontSize: 11, color: 'var(--sl-t2)', textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {setsWon
            ? `${setsWon.home}–${setsWon.away}`
            : `${playerLabel('home', 1)} vs ${playerLabel('away', 1)}`
          }
        </span>

        {/* Gagnant badge */}
        {winner && (
          <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 20, backgroundColor: SIDE_COLOR[winner] + '18', color: SIDE_COLOR[winner], flexShrink: 0 }}>
            {winner === 'home' ? 'Dom. ✓' : 'Ext. ✓'}
          </span>
        )}

        {saving && <span style={{ fontSize: 10, color: 'var(--sl-t3)', flexShrink: 0 }}>⏳</span>}
        <span style={{ color: 'var(--sl-t3)', fontSize: 12, flexShrink: 0 }}>{open ? '▲' : '▼'}</span>
      </button>

      {/* Corps */}
      {open && (
        <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Joueurs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 9, fontWeight: 800, color: '#22c55e', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                ● Domicile
              </span>
              <PlayerSelector
                clubId={clubId}
                value={{ player_id: local.home_player1_id, data: local.home_player1_data ?? {} }}
                onChange={v => setPlayer('home', 1, v)}
                label={isDouble ? 'Joueur 1' : 'Joueur'}
              />
              {isDouble && (
                <PlayerSelector
                  clubId={clubId}
                  value={{ player_id: local.home_player2_id, data: local.home_player2_data ?? {} }}
                  onChange={v => setPlayer('home', 2, v)}
                  label="Joueur 2"
                />
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 9, fontWeight: 800, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                ● Extérieur
              </span>
              <PlayerSelector
                clubId={clubId}
                value={{ player_id: local.away_player1_id, data: local.away_player1_data ?? {} }}
                onChange={v => setPlayer('away', 1, v)}
                label={isDouble ? 'Joueur 1' : 'Joueur'}
              />
              {isDouble && (
                <PlayerSelector
                  clubId={clubId}
                  value={{ player_id: local.away_player2_id, data: local.away_player2_data ?? {} }}
                  onChange={v => setPlayer('away', 2, v)}
                  label="Joueur 2"
                />
              )}
            </div>
          </div>

          {/* Sets */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--sl-t3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
              Score par set
            </div>
            <TennisSetsInput
              setsPerMatch={setsPerMatch}
              value={local.score_detail ?? { sets: [], sets_won: { home: 0, away: 0 } }}
              onChange={handleSetsChange}
            />
          </div>

          {/* Gagnant manuel (forfait, abandon…) */}
          <div style={{ display: 'flex', gap: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--sl-t3)', alignSelf: 'center' }}>Gagnant :</span>
            {['home', 'away'].map(side => (
              <button
                key={side}
                onClick={() => setWinnerManual(winner === side ? null : side)}
                style={{
                  flex: 1, padding: '7px 0', borderRadius: 8, border: 'none',
                  cursor: 'pointer', fontSize: 12, fontWeight: 700,
                  backgroundColor: winner === side ? SIDE_COLOR[side] : SIDE_COLOR[side] + '18',
                  color: winner === side ? '#fff' : SIDE_COLOR[side],
                  transition: 'all 0.15s',
                }}
              >
                {side === 'home' ? '✓ Domicile' : '✓ Extérieur'}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
