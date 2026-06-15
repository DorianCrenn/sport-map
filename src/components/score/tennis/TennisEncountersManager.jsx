import { getSportConfig } from '../../../config/sportMatchConfig.js';
import { useMatchEncounters } from '../../../hooks/useMatchEncounters.js';
import { useMatchScore } from '../../../hooks/useMatchScore.js';
import EncounterCard from './EncounterCard.jsx';

/**
 * Gestionnaire des rencontres individuelles tennis.
 * Affiché uniquement quand event.sport === 'Tennis' (ou tout sport individuel).
 *
 * Props :
 *   event         — objet événement (id, sport, clubId)
 *   onUpdateEvent — callback màj état parent
 */
export default function TennisEncountersManager({ event, onUpdateEvent }) {
  const config = getSportConfig(event?.sport);
  const { encounters, loading, upsertEncounter, computeTotalScore, isComplete } = useMatchEncounters(event?.id, event?.sport);
  const { saveScore, saving: savingTotal, saved: savedTotal } = useMatchScore(event?.id);

  async function handleEncounterSave(encounter) {
    await upsertEncounter(encounter);
  }

  async function handleValidate() {
    const { home, away } = computeTotalScore();
    await saveScore(
      {
        sport:        event?.sport ?? 'Tennis',
        score_home:   home,
        score_away:   away,
        score_detail: {
          encounters_summary: Object.fromEntries(
            encounters.map(e => [e.encounter_type, e.winner_side])
          ),
          final_score: { home, away },
        },
        status: 'final',
      },
      (patch) => onUpdateEvent?.(event.id, patch),
    );
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 14 }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={{ height: 52, borderRadius: 12, backgroundColor: 'var(--sl-surface)', opacity: 1 - i * 0.15 }} />
        ))}
      </div>
    );
  }

  const total = computeTotalScore();

  return (
    <div style={{ borderTop: '1px solid var(--sl-border)', paddingTop: 14 }}>

      {/* En-tête */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--sl-t3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          🎾 Rencontres
        </div>
        {(total.home > 0 || total.away > 0) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 12px', borderRadius: 20, backgroundColor: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Score</span>
            <span style={{ fontSize: 16, fontWeight: 900, color: 'var(--sl-t1)' }}>{total.home} — {total.away}</span>
          </div>
        )}
      </div>

      {/* Cartes rencontres */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {(config.encounterTypes ?? []).map(type => {
          const enc = encounters.find(e => e.encounter_type === type.key) ?? {
            encounter_type: type.key,
            encounter_order: type.order,
            winner_side: null,
            score_detail: { sets: [], sets_won: { home: 0, away: 0 } },
            home_player1_id: null, home_player1_data: {},
            home_player2_id: null, home_player2_data: {},
            away_player1_id: null, away_player1_data: {},
            away_player2_id: null, away_player2_data: {},
          };

          return (
            <EncounterCard
              key={type.key}
              encounter={enc}
              encounterType={type}
              clubId={event?.clubId}
              setsPerMatch={config.setsPerMatch ?? 3}
              onSave={handleEncounterSave}
            />
          );
        })}
      </div>

      {/* Bouton validation finale */}
      <button
        onClick={handleValidate}
        disabled={!isComplete || savingTotal}
        style={{
          width: '100%', marginTop: 14, padding: '11px 0', borderRadius: 12,
          border: savedTotal ? '1px solid var(--sl-green)' : 'none',
          cursor: isComplete && !savingTotal ? 'pointer' : 'not-allowed',
          fontSize: 14, fontWeight: 700,
          backgroundColor: savedTotal
            ? 'var(--sl-green-dim)'
            : isComplete ? 'var(--sl-green)' : 'var(--sl-surface)',
          color: savedTotal
            ? 'var(--sl-green)'
            : isComplete ? '#fff' : 'var(--sl-t3)',
          opacity: savingTotal ? 0.7 : 1,
          transition: 'all 0.15s',
        }}
      >
        {savingTotal
          ? '⏳ Enregistrement…'
          : savedTotal
          ? '✓ Résultat enregistré'
          : isComplete
          ? 'Valider la rencontre'
          : `Complétez les ${(config.encounterTypes ?? []).length} rencontres`
        }
      </button>
    </div>
  );
}
