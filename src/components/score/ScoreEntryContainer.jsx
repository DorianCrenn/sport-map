import { useState, useEffect, useMemo } from 'react';
import { useMatchScore } from '../../hooks/useMatchScore.js';
import { getSportConfig } from '../../config/sportMatchConfig.js';
import SportScoreForm from './SportScoreForm.jsx';

/**
 * Conteneur principal de saisie de score.
 * Remplace QuickScoreEdit dans MobileEventSheet.
 *
 * Props :
 *   event         — objet événement (id, sport, score, man_of_match)
 *   onUpdateEvent — callback (eventId, patch) pour màj état parent
 */
export default function ScoreEntryContainer({ event, onUpdateEvent }) {
  const config = useMemo(() => getSportConfig(event?.sport), [event?.sport]);
  const { matchScore, loading, saving, saved, error, saveScore } = useMatchScore(event?.id);

  // État local du formulaire
  const [formData, setFormData] = useState({});

  // Initialiser depuis la source la plus récente disponible
  useEffect(() => {
    if (matchScore) {
      setFormData({
        home: matchScore.score_home ?? undefined,
        away: matchScore.score_away ?? undefined,
        ...matchScore.score_detail,
      });
    } else if (event?.score) {
      setFormData({ home: event.score.home, away: event.score.away });
    }
  }, [matchScore?.id, event?.score?.home, event?.score?.away]);

  const [motm, setMotm] = useState(
    matchScore?.man_of_match ?? event?.man_of_match ?? ''
  );

  // Sync motm depuis matchScore
  useEffect(() => {
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

  const canSave = config.scoreType === 'calculated'
    ? true  // rugby : toujours sauvegardable
    : config.scoreType === 'individual_encounters'
    ? false  // tennis : pas de bouton ici
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
        <div style={{ marginTop: 14 }}>
          <label style={lbl}>Joueur du match</label>
          <input
            value={motm}
            onChange={e => setMotm(e.target.value)}
            placeholder="Nom du joueur (optionnel)"
            style={inp}
          />
        </div>
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
