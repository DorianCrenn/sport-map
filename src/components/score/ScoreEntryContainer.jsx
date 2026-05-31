import { useState, useEffect, useMemo, useRef } from 'react';
import { useMatchScore } from '../../hooks/useMatchScore.js';
import { useClubPlayers } from '../../hooks/useClubPlayers.js';
import { getSportConfig } from '../../config/sportMatchConfig.js';
import SportScoreForm from './SportScoreForm.jsx';
import TennisEncountersManager from './tennis/TennisEncountersManager.jsx';

// ── Joueur du match — picker avec dropdown ────────────────────────────────────

function MotmPicker({ value, onChange, players, inp, lbl }) {
  const [open, setOpen]   = useState(false);
  const wrapRef           = useRef(null);

  const filtered = useMemo(() => {
    if (!value.trim()) return players.slice(0, 10);
    const q = value.toLowerCase();
    return players.filter(p => p.name.toLowerCase().includes(q)).slice(0, 8);
  }, [players, value]);

  // Close on outside click
  useEffect(() => {
    function onDown(e) { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  return (
    <div ref={wrapRef} style={{ marginTop: 14, position: 'relative' }}>
      <label style={lbl}>Joueur du match</label>
      <input
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder={players.length ? 'Sélectionner ou saisir un nom…' : 'Nom du joueur (optionnel)'}
        autoComplete="off"
        style={inp}
      />
      {open && filtered.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 200,
          marginTop: 4, borderRadius: 10, border: '1px solid var(--sl-border)',
          backgroundColor: 'var(--sl-card)', boxShadow: 'var(--sl-shadow)',
          maxHeight: 180, overflowY: 'auto',
        }}>
          {filtered.map(p => (
            <button
              key={p.id}
              type="button"
              onMouseDown={e => { e.preventDefault(); onChange(p.name); setOpen(false); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                width: '100%', padding: '8px 12px', background: 'none',
                border: 'none', cursor: 'pointer', textAlign: 'left',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--sl-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              {p.number != null && (
                <span style={{
                  minWidth: 24, height: 24, borderRadius: 6, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 10, fontWeight: 800,
                  backgroundColor: 'var(--sl-surface)', color: 'var(--sl-t2)', flexShrink: 0,
                }}>
                  {p.number}
                </span>
              )}
              <span style={{ fontSize: 13, color: 'var(--sl-t1)', fontWeight: 500 }}>{p.name}</span>
              {p.position && (
                <span style={{ fontSize: 10, color: 'var(--sl-t3)', marginLeft: 'auto' }}>{p.position}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Conteneur principal de saisie de score.
 * Remplace QuickScoreEdit dans MobileEventSheet.
 *
 * Props :
 *   event         — objet événement (id, sport, score, man_of_match, club_id | clubId)
 *   onUpdateEvent — callback (eventId, patch) pour màj état parent
 */
export default function ScoreEntryContainer({ event, onUpdateEvent }) {
  const config = useMemo(() => getSportConfig(event?.sport), [event?.sport]);
  const { matchScore, saving, saved, error, saveScore } = useMatchScore(event?.id);

  // club_id peut être snake_case (Supabase) ou camelCase (useLocalEvents)
  const clubId = event?.club_id ?? event?.clubId ?? null;
  const { players } = useClubPlayers(clubId);

  // État local du formulaire
  const [formData, setFormData] = useState({});

  // Initialiser depuis la source la plus récente disponible
  useEffect(() => {
    if (matchScore) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({
        home: matchScore.score_home ?? undefined,
        away: matchScore.score_away ?? undefined,
        ...matchScore.score_detail,
      });
    } else if (event?.score) {
      setFormData({ home: event.score.home, away: event.score.away });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchScore?.id, event?.score?.home, event?.score?.away]);

  const [motm, setMotm] = useState(
    matchScore?.man_of_match ?? event?.man_of_match ?? ''
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMotm(matchScore?.man_of_match ?? event?.man_of_match ?? '');
  }, [matchScore?.man_of_match, event?.man_of_match]);

  async function handleSave() {
    const isCalculated = config.scoreType === 'calculated';
    const score_home = isCalculated
      ? config.scoreComputed(formData, 'home')
      : (formData.home !== undefined ? Number(formData.home) : null);
    const score_away = isCalculated
      ? config.scoreComputed(formData, 'away')
      : (formData.away !== undefined ? Number(formData.away) : null);

    // score_detail = tout ce qui n'est pas home/away/sets_home/sets_away
    // eslint-disable-next-line no-unused-vars
    const { home, away, sets_home, sets_away, ...detail } = formData;
    const score_detail = isCalculated ? formData : detail;

    await saveScore(
      {
        sport:        event?.sport ?? 'Football',
        score_home,
        score_away,
        score_detail,
        man_of_match: motm.trim() || null,
        status:       'final',
      },
      (patch) => onUpdateEvent?.(event.id, patch),
    );
  }

  // Tennis : déléguer entièrement à TennisEncountersManager
  if (config.scoreType === 'individual_encounters') {
    return <TennisEncountersManager event={event} onUpdateEvent={onUpdateEvent} />;
  }

  const canSave = config.scoreType === 'calculated'
    ? true  // rugby : toujours sauvegardable
    : (formData.home !== undefined || formData.sets_home !== undefined);

  const inp = {
    padding: '7px 10px', borderRadius: 8, fontSize: 12,
    border: '1px solid var(--sl-border-s)', backgroundColor: 'var(--sl-surface)',
    color: 'var(--sl-t1)', outline: 'none', width: '100%', boxSizing: 'border-box',
  };
  const lbl = {
    fontSize: 10, fontWeight: 700, color: 'var(--sl-t3)',
    textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 4,
  };

  return (
    <div style={{ borderTop: '1px solid var(--sl-border)', paddingTop: 14, marginBottom: 14 }}>

      {/* Titre */}
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--sl-t3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>
        {matchScore?.score_home != null ? 'Modifier le score' : 'Saisir le score'}
        <span style={{ marginLeft: 8, fontSize: 9, fontWeight: 600, color: 'var(--sl-t3)', textTransform: 'none', letterSpacing: 0 }}>
          {event?.sport ?? ''}
        </span>
      </div>

      {/* Formulaire adaptatif */}
      <SportScoreForm
        config={config}
        value={formData}
        onChange={setFormData}
      />

      {/* Joueur du match (si supporté par le sport) */}
      {config.manOfMatch && (
        <MotmPicker
          value={motm}
          onChange={setMotm}
          players={players}
          inp={inp}
          lbl={lbl}
        />
      )}

      {/* Erreur */}
      {error && (
        <div style={{ marginTop: 10, padding: '7px 10px', borderRadius: 8, backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', fontSize: 11, color: '#ef4444' }}>
          {error}
        </div>
      )}

      {/* Bouton Enregistrer */}
      {config.scoreType !== 'individual_encounters' && (
        <button
          onClick={handleSave}
          disabled={!canSave || saving}
          style={{
            width: '100%', marginTop: 14, padding: '11px 0', borderRadius: 12,
            border: saved ? '1px solid var(--sl-green)' : 'none',
            cursor: canSave && !saving ? 'pointer' : 'not-allowed',
            fontSize: 14, fontWeight: 700,
            backgroundColor: saved ? 'var(--sl-green-dim)' : 'var(--sl-green)',
            color: saved ? 'var(--sl-green)' : '#fff',
            opacity: saving ? 0.7 : 1,
            transition: 'all 0.15s',
          }}
        >
          {saving ? '⏳ Enregistrement…' : saved ? '✓ Enregistré' : 'Enregistrer'}
        </button>
      )}
    </div>
  );
}
