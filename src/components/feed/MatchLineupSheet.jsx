import { useState } from 'react';
import { motion } from 'framer-motion';
import { useMatchLineup } from '../../hooks/useMatchLineup.js';
import { useClubPlayers } from '../../hooks/useClubPlayers.js';

const FORMATIONS = ['4-3-3', '4-4-2', '4-2-3-1', '3-5-2', '5-3-2', '4-5-1', '3-4-3'];

function PlayerBadge({ player, inLineup, isLinked, onClick }) {
  const role = inLineup?.status;
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '9px 14px', borderRadius: 12, border: 'none', cursor: 'pointer',
        backgroundColor: role === 'titulaire'
          ? 'rgba(34,217,106,0.1)'
          : role === 'remplacant'
          ? 'rgba(99,102,241,0.1)'
          : 'var(--sl-surface)',
        borderWidth: 1, borderStyle: 'solid',
        borderColor: role === 'titulaire'
          ? 'rgba(34,217,106,0.35)'
          : role === 'remplacant'
          ? 'rgba(99,102,241,0.35)'
          : 'var(--sl-border)',
        textAlign: 'left', width: '100%', transition: 'all 0.12s',
      }}
    >
      {player.photo_url ? (
        <img src={player.photo_url} alt={player.name} style={{ width: 34, height: 34, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
      ) : (
        <div style={{
          width: 34, height: 34, borderRadius: 8, flexShrink: 0,
          backgroundColor: 'var(--sl-border)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 700, color: 'var(--sl-t3)',
        }}>
          {player.number ?? '?'}
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--sl-t1)', display: 'flex', alignItems: 'center', gap: 5 }}>
          {player.name}
          {isLinked && <span style={{ fontSize: 10, color: 'var(--sl-green)', fontWeight: 800 }}>Toi</span>}
        </div>
        <div style={{ fontSize: 11, color: 'var(--sl-t3)' }}>{player.position ?? 'Joueur'}</div>
      </div>
      {role === 'titulaire' && (
        <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--sl-green)', backgroundColor: 'rgba(34,217,106,0.15)', padding: '2px 7px', borderRadius: 6 }}>
          TITULAIRE
        </span>
      )}
      {role === 'remplacant' && (
        <span style={{ fontSize: 10, fontWeight: 800, color: '#818cf8', backgroundColor: 'rgba(99,102,241,0.15)', padding: '2px 7px', borderRadius: 6 }}>
          REMPL.
        </span>
      )}
    </button>
  );
}

export default function MatchLineupSheet({ eventId, clubId, canEdit, currentUserId, onClose }) {
  const { lineup, formation, locked, loading, updateLineup, lockLineup } = useMatchLineup(eventId);
  const { players } = useClubPlayers(clubId);
  const [localLineup, setLocalLineup] = useState(null);
  const [localFormation, setLocalFormation] = useState(null);
  const [saving, setSaving] = useState(false);

  const activeLineup    = localLineup    ?? lineup;
  const activeFormation = localFormation ?? formation;

  function getPlayerInLineup(playerId) {
    return activeLineup.find(e => e.player_id === playerId);
  }

  function togglePlayer(player) {
    if (!canEdit || locked) return;
    const current = getPlayerInLineup(player.id);
    let next;
    if (!current) {
      // pas dans la compo → ajouter comme titulaire
      next = [...activeLineup, {
        player_id: player.id, name: player.name, number: player.number,
        position: player.position ?? 'Joueur', status: 'titulaire',
      }];
    } else if (current.status === 'titulaire') {
      // titulaire → remplaçant
      next = activeLineup.map(e => e.player_id === player.id ? { ...e, status: 'remplacant' } : e);
    } else {
      // remplaçant → retirer
      next = activeLineup.filter(e => e.player_id !== player.id);
    }
    setLocalLineup(next);
  }

  async function handleSave() {
    setSaving(true);
    await updateLineup({ lineup_data: activeLineup, formation: activeFormation });
    setLocalLineup(null);
    setLocalFormation(null);
    setSaving(false);
  }

  async function handleLock() {
    if (localLineup || localFormation) await handleSave();
    await lockLineup();
  }

  const titulaires   = activeLineup.filter(e => e.status === 'titulaire');
  const remplacants  = activeLineup.filter(e => e.status === 'remplacant');
  const hasChanges   = localLineup !== null || localFormation !== null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', flexDirection: 'column', backgroundColor: 'var(--sl-bg)' }}
    >
      {/* Header */}
      <div style={{
        padding: '14px 16px', borderBottom: '1px solid var(--sl-border)',
        display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
        backgroundColor: 'var(--sl-card)',
      }}>
        <button onClick={onClose} style={{ width: 40, height: 40, borderRadius: 11, border: 'none', cursor: 'pointer', backgroundColor: 'var(--sl-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--sl-t2)' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--sl-t1)', letterSpacing: '-0.02em' }}>
            Composition
          </div>
          <div style={{ fontSize: 11, color: 'var(--sl-t3)', marginTop: 1 }}>
            {locked
              ? '✅ Compo annoncée'
              : canEdit
              ? '1 clic = titulaire · 2 clics = remplaçant · 3 clics = retirer'
              : 'Vue en lecture seule'}
          </div>
        </div>
        {locked && (
          <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--sl-green)', backgroundColor: 'rgba(34,217,106,0.12)', padding: '4px 10px', borderRadius: 8, border: '1px solid rgba(34,217,106,0.3)' }}>
            ANNONCÉE
          </span>
        )}
      </div>

      {/* Formation picker (coach only) */}
      {canEdit && !locked && (
        <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--sl-border)', flexShrink: 0, backgroundColor: 'var(--sl-card)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--sl-t3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Formation</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {FORMATIONS.map(f => (
              <button
                key={f}
                onClick={() => setLocalFormation(f)}
                style={{
                  padding: '4px 10px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700,
                  backgroundColor: activeFormation === f ? 'var(--sl-green)' : 'var(--sl-surface)',
                  color: activeFormation === f ? '#fff' : 'var(--sl-t2)',
                }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      )}

      {!canEdit && !locked && (
        <div style={{ padding: '12px 16px', backgroundColor: 'rgba(99,102,241,0.07)', borderBottom: '1px solid var(--sl-border)' }}>
          <p style={{ fontSize: 12, color: '#818cf8', fontWeight: 600, margin: 0 }}>
            ⏳ La composition n'a pas encore été annoncée par le coach.
          </p>
        </div>
      )}

      {/* Player list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
            <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          </div>
        ) : canEdit ? (
          <>
            {/* Coach view: full player list with toggle */}
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--sl-t3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Joueurs ({players.length}) — {titulaires.length} titulaires · {remplacants.length} rempl.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {players.map(player => (
                <PlayerBadge
                  key={player.id}
                  player={player}
                  inLineup={getPlayerInLineup(player.id)}
                  isLinked={player.user_id === currentUserId}
                  onClick={() => togglePlayer(player)}
                />
              ))}
            </div>
          </>
        ) : (
          <>
            {/* Player/parent view: only announced lineup */}
            {titulaires.length > 0 && (
              <>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--sl-t3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Titulaires ({titulaires.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
                  {titulaires.map(entry => {
                    const player = players.find(p => p.id === entry.player_id) ?? { id: entry.player_id, name: entry.name, number: entry.number, position: entry.position };
                    return (
                      <PlayerBadge
                        key={entry.player_id}
                        player={player}
                        inLineup={entry}
                        isLinked={player.user_id === currentUserId}
                        onClick={() => {}}
                      />
                    );
                  })}
                </div>
              </>
            )}
            {remplacants.length > 0 && (
              <>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--sl-t3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Remplaçants ({remplacants.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {remplacants.map(entry => {
                    const player = players.find(p => p.id === entry.player_id) ?? { id: entry.player_id, name: entry.name, number: entry.number, position: entry.position };
                    return (
                      <PlayerBadge
                        key={entry.player_id}
                        player={player}
                        inLineup={entry}
                        isLinked={player.user_id === currentUserId}
                        onClick={() => {}}
                      />
                    );
                  })}
                </div>
              </>
            )}
            {!titulaires.length && !remplacants.length && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 0', color: 'var(--sl-t3)' }}>
                <span style={{ fontSize: 40 }}>📋</span>
                <p style={{ fontSize: 13, fontWeight: 600, marginTop: 12 }}>Composition vide</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer actions (coach only) */}
      {canEdit && !locked && (
        <div style={{
          padding: '12px 16px', borderTop: '1px solid var(--sl-border)', flexShrink: 0,
          backgroundColor: 'var(--sl-card)', display: 'flex', gap: 8,
          paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))',
        }}>
          {hasChanges && (
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                flex: 1, padding: '12px', borderRadius: 14, border: '1px solid var(--sl-border)',
                cursor: 'pointer', fontSize: 13, fontWeight: 700,
                backgroundColor: 'var(--sl-surface)', color: 'var(--sl-t1)',
              }}
            >
              {saving ? 'Sauvegarde…' : 'Sauvegarder'}
            </button>
          )}
          <button
            onClick={handleLock}
            disabled={saving || activeLineup.length === 0}
            style={{
              flex: 2, padding: '12px', borderRadius: 14, border: 'none',
              cursor: activeLineup.length === 0 ? 'not-allowed' : 'pointer',
              fontSize: 13, fontWeight: 800,
              backgroundColor: activeLineup.length === 0 ? 'var(--sl-surface)' : 'var(--sl-green)',
              color: activeLineup.length === 0 ? 'var(--sl-t3)' : '#fff',
              opacity: activeLineup.length === 0 ? 0.5 : 1,
            }}
          >
            📣 Annoncer la compo
          </button>
        </div>
      )}
    </motion.div>
  );
}
