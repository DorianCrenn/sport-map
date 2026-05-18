import { motion } from 'framer-motion';

const BLOCK_TYPES = [
  {
    type: 'title',
    label: 'Titre / Section',
    desc: 'H1, H2 ou H3 — structurez votre page',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M4 6h16M4 12h10M4 18h6"/>
      </svg>
    ),
  },
  {
    type: 'text',
    label: 'Texte',
    desc: 'Un paragraphe libre — description, histoire…',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M4 6h16M4 10h16M4 14h10M4 18h8"/>
      </svg>
    ),
  },
  {
    type: 'upcoming-events',
    label: 'Prochains événements',
    desc: 'Liste automatique filtrée par sport',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
  },
  {
    type: 'training',
    label: 'Entraînements',
    desc: 'Créneaux hebdomadaires — jour, heure, lieu, niveau',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
  },
  {
    type: 'image',
    label: 'Image',
    desc: 'Photo ou illustration — fichier local ou URL',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
        <polyline points="21 15 16 10 5 21"/>
      </svg>
    ),
  },
  {
    type: 'matches',
    label: 'Matchs & Résultats',
    desc: 'Calendrier des matchs avec scores et V/N/D',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
        <line x1="2" y1="12" x2="22" y2="12"/>
      </svg>
    ),
  },
  {
    type: 'about',
    label: 'À propos',
    desc: 'Description, adresse, tarifs licences, contacts',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
    ),
  },
  {
    type: 'gallery',
    label: 'Galerie photos',
    desc: 'Jusqu\'à 5 photos — grille avec zoom lightbox',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <circle cx="8.5" cy="8.5" r="1.5"/>
        <polyline points="21 15 16 10 5 21"/>
        <path d="M21 9l-5 5"/>
      </svg>
    ),
  },
  {
    type: 'next-match',
    label: 'Prochain match',
    desc: 'Affiche automatiquement le prochain match du club',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
        <line x1="2" y1="12" x2="22" y2="12"/>
        <polyline points="12 8 15 12 12 16"/>
      </svg>
    ),
  },
  {
    type: 'sponsors',
    label: 'Sponsors',
    desc: 'Logos et liens de vos partenaires et sponsors',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2"/>
        <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
        <line x1="12" y1="12" x2="12" y2="16"/>
        <line x1="10" y1="14" x2="14" y2="14"/>
      </svg>
    ),
  },
];

export default function AddBlockMenu({ onAdd, onCancel }) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      style={{ overflow: 'hidden', marginBottom: 12 }}
    >
      <div style={{
        borderRadius: 18, border: '1px solid var(--sl-border)',
        backgroundColor: 'var(--sl-card)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
        padding: 14,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--sl-t1)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Choisir un type de bloc
          </span>
          <button
            onClick={onCancel}
            style={{ fontSize: 11, color: 'var(--sl-t3)', padding: '3px 10px', borderRadius: 8, border: '1px solid var(--sl-border-s)', backgroundColor: 'transparent', cursor: 'pointer' }}
          >
            Annuler
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
          {BLOCK_TYPES.map(({ type, label, desc, icon }) => (
            <button
              key={type}
              onClick={() => onAdd(type)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 12, textAlign: 'left',
                border: '1px solid var(--sl-border)', backgroundColor: 'var(--sl-surface)',
                cursor: 'pointer', transition: 'all 0.12s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.backgroundColor = 'rgba(59,130,246,0.06)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--sl-border)'; e.currentTarget.style.backgroundColor = 'var(--sl-surface)'; }}
            >
              <span style={{ color: 'var(--sl-t3)', flexShrink: 0 }}>{icon}</span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--sl-t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</div>
                <div style={{ fontSize: 10, color: 'var(--sl-t3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
