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
];

export default function AddBlockMenu({ onAdd, onCancel }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97, y: -6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97, y: -6 }}
      transition={{ duration: 0.15 }}
      className="bg-white border border-gray-200 rounded-2xl shadow-lg p-4 mb-4"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-gray-800">Choisir un bloc</span>
        <button
          onClick={onCancel}
          className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors"
        >
          Annuler
        </button>
      </div>
      <div className="space-y-1">
        {BLOCK_TYPES.map(({ type, label, desc, icon }) => (
          <button
            key={type}
            onClick={() => onAdd(type)}
            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 active:bg-gray-100 text-left transition-colors group"
          >
            <span className="text-gray-400 group-hover:text-slate-700 transition-colors flex-shrink-0">
              {icon}
            </span>
            <div>
              <div className="text-sm font-medium text-gray-800">{label}</div>
              <div className="text-xs text-gray-400">{desc}</div>
            </div>
          </button>
        ))}
      </div>
    </motion.div>
  );
}
