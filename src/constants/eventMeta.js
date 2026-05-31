/** Métadonnées des types d'événements — source de vérité unique */
export const EVENT_TYPE_META = {
  championship: { label: 'Championnat', color: '#3b82f6' },
  cup:          { label: 'Coupe',        color: '#f97316' },
  friendly:     { label: 'Amical',       color: '#22d96a' },
  tournament:   { label: 'Tournoi',      color: '#8b5cf6' },
};

/** Métadonnées des statuts d'événements — source de vérité unique */
export const STATUS_META = {
  upcoming:  { label: 'À venir',      color: '#4da6ff', bg: 'rgba(77,166,255,0.12)'  },
  live:      { label: '● En direct',  color: '#ef4444', bg: 'rgba(239,68,68,0.12)'   },
  done:      { label: 'Terminé',      color: '#64748b', bg: 'rgba(100,116,139,0.10)' },
  postponed: { label: 'Reporté',      color: '#f59e0b', bg: 'rgba(245,158,11,0.12)'  },
  cancelled: { label: 'Annulé',       color: '#ef4444', bg: 'rgba(239,68,68,0.08)'   },
};
