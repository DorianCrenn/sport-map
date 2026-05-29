/**
 * ClubSimpleEditor — Mode rapide d'édition de page club.
 * Propose des sections prédéfinies à ajouter en un clic.
 * Extrait de ClubPageView.jsx.
 */

const SIMPLE_PRESETS = [
  {
    type: 'upcoming-events',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    label: 'Prochains événements',
    desc:  'Liste automatique des matchs à venir',
  },
  {
    type: 'matches',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 8l2.47 5h5.27l-4.27 3.1 1.64 5.02L12 18.12l-5.1 3L8.53 16.1 4.26 13h5.27L12 8z"/></svg>,
    label: 'Résultats & calendrier',
    desc:  'Scores V/N/D et prochains matchs',
  },
  {
    type: 'about',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
    label: 'À propos du club',
    desc:  'Description, adresse, contacts, tarifs',
  },
  {
    type: 'training',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    label: "Créneaux d'entraînement",
    desc:  'Horaires hebdomadaires par équipe',
  },
  {
    type: 'image',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
    label: 'Photo',
    desc:  'Image ou photo du club',
  },
  {
    type: 'sponsors',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>,
    label: 'Sponsors',
    desc:  'Logos et liens de vos partenaires',
  },
];

export default function ClubSimpleEditor({ blocks, onAddBlock, onAdvanced, accentColor }) {
  const existingTypes = new Set(blocks.map(b => b.type));

  return (
    <div className="px-4 py-6">
      <div style={{ marginBottom: 20, textAlign: 'center' }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--sl-t1)', marginBottom: 4 }}>Construisez votre page en un clic</div>
        <div style={{ fontSize: 12, color: 'var(--sl-t3)', lineHeight: 1.5 }}>
          Ajoutez les sections essentielles. Chaque section sera visible sur la page publique de votre club.
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {SIMPLE_PRESETS.map(preset => {
          const added = existingTypes.has(preset.type);
          return (
            <button
              key={preset.type}
              type="button"
              onClick={() => { if (!added) onAddBlock(preset.type); }}
              disabled={added}
              style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
                borderRadius: 16, textAlign: 'left', cursor: added ? 'default' : 'pointer',
                border: `1.5px solid ${added ? 'var(--sl-green)' : 'var(--sl-border)'}`,
                backgroundColor: added ? 'var(--sl-green-dim)' : 'var(--sl-card)',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { if (!added) { e.currentTarget.style.borderColor = accentColor; e.currentTarget.style.backgroundColor = 'var(--sl-surface)'; } }}
              onMouseLeave={e => { if (!added) { e.currentTarget.style.borderColor = 'var(--sl-border)'; e.currentTarget.style.backgroundColor = 'var(--sl-card)'; } }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                backgroundColor: added ? 'rgba(34,197,94,0.15)' : 'var(--sl-surface)',
                color: added ? 'var(--sl-green)' : 'var(--sl-t2)',
              }}>
                {added
                  ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  : preset.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: added ? 'var(--sl-green)' : 'var(--sl-t1)', marginBottom: 2 }}>{preset.label}</div>
                <div style={{ fontSize: 11, color: 'var(--sl-t3)' }}>{preset.desc}</div>
              </div>
              {!added && (
                <div style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: 'var(--sl-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--sl-t3)' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                </div>
              )}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onAdvanced}
        style={{
          display: 'block', width: '100%', marginTop: 20, padding: '13px',
          borderRadius: 14, border: '1px solid var(--sl-border)',
          backgroundColor: 'var(--sl-surface)', color: 'var(--sl-t2)',
          fontSize: 13, fontWeight: 600, cursor: 'pointer', textAlign: 'center',
        }}
      >
        Passer en mode Avancé →
      </button>
    </div>
  );
}
