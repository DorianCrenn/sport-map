import SimpleScoreInputs from './inputs/SimpleScoreInputs.jsx';
import CalculatedScoreInputs from './inputs/CalculatedScoreInputs.jsx';
import PeriodsScoreInputs from './inputs/PeriodsScoreInputs.jsx';
import SetsScoreInputs from './inputs/SetsScoreInputs.jsx';

/**
 * Formulaire de score adaptatif — choisit le bon composant selon config.scoreType.
 * Ne contient aucune logique sport-spécifique : tout vient de la config.
 */
export default function SportScoreForm({ config, value, onChange }) {
  if (!config) return null;

  const props = { config, value: value ?? {}, onChange };

  switch (config.scoreType) {
    case 'calculated':
      return <CalculatedScoreInputs {...props} />;
    case 'periods':
      return <PeriodsScoreInputs {...props} />;
    case 'sets':
      return <SetsScoreInputs {...props} />;
    case 'individual_encounters':
      // Tennis géré par TennisEncountersManager (Phase 2)
      return (
        <div style={{ padding: '14px', textAlign: 'center', color: 'var(--sl-t3)', fontSize: 12 }}>
          🎾 Gérez les rencontres individuelles via le panneau "Rencontres" ci-dessous.
        </div>
      );
    case 'simple':
    default:
      return <SimpleScoreInputs {...props} />;
  }
}
