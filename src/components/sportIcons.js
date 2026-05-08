// SVG icon snippets for each sport (24×24 grid, currentColor elements)
// Embedded inside a parent <svg> via <g dangerouslySetInnerHTML={{ __html: icon }} />

export const SPORT_ICONS = {
  // ── Built-in sports ─────────────────────────────────────────────────────────
  Football: `<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2" fill="none"/><path d="M12 7l4 2.5v5l-4 2.5-4-2.5v-5z" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linejoin="round"/><path d="M12 7V3M16 9.5l3.5-2M16 14.5l3.5 2M12 17v4M8 14.5l-3.5 2M8 9.5l-3.5-2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" fill="none"/>`,

  Handball: `<circle cx="13" cy="4" r="2.5" fill="currentColor"/><path d="M13 7v6M11 8.5l2-1.5 2 1.5M10 13l-2 5M14 13l2 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/><circle cx="17.5" cy="8" r="2.5" fill="currentColor"/>`,

  Basketball: `<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2" fill="none"/><path d="M12 3v18M3 12h18M5.5 5.5a9 9 0 0 1 6.5 6.5M18.5 5.5a9 9 0 0 0-6.5 6.5M5.5 18.5a9 9 0 0 0 6.5-6.5M18.5 18.5a9 9 0 0 1-6.5-6.5" stroke="currentColor" stroke-width="1.6" fill="none"/>`,

  Rugby: `<ellipse cx="12" cy="12" rx="9" ry="5.5" stroke="currentColor" stroke-width="2" fill="none"/><path d="M12 6.5v11M9.5 9.5c1.7 1 3.3 1 5 0M9.5 14.5c1.7-1 3.3-1 5 0" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round"/>`,

  Running: `<circle cx="15" cy="4" r="2.5" fill="currentColor"/><path d="M14 6.5l-2 5.5M12 12l2.5 5M12 12l-3 5.5M13 9l3-2.5M13 9l-2.5 1.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/>`,

  Trail: `<path d="M2 20h20" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M4 20L9 7l5 8 3-5 5 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,

  Cyclisme: `<circle cx="7" cy="15" r="5" stroke="currentColor" stroke-width="2" fill="none"/><circle cx="17" cy="15" r="5" stroke="currentColor" stroke-width="2" fill="none"/><path d="M7 15l5-6 5 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M12 9l3-3h2" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/>`,

  // ── Aquatic ──────────────────────────────────────────────────────────────────
  Natation: `<circle cx="17" cy="4.5" r="2" fill="currentColor"/><path d="M15.5 6l-3 4.5-5-1.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M2 15c2-3 4-3 6 0s4 3 6 0 4-3 6 0" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/><path d="M2 19c2-3 4-3 6 0s4 3 6 0 4-3 6 0" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/>`,

  Surf: `<path d="M12 2c2.5 0 5 4 5 10.5S14.5 22 12 22 7 18 7 12.5 9.5 2 12 2z" stroke="currentColor" stroke-width="2" fill="none"/><path d="M12 5v14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" fill="none"/>`,

  Voile: `<path d="M12 20V5" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/><path d="M12 5l9 12H12M12 5L3 17h9" stroke="currentColor" stroke-width="2" fill="none" stroke-linejoin="round"/><path d="M5 20h14" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" fill="none"/>`,

  Aviron: `<path d="M4 16h16M6 13c0 3 12 3 12 0" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/><path d="M2 10l10 7M22 10l-10 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/><circle cx="12" cy="5" r="2" fill="currentColor"/>`,

  // ── Racket sports ────────────────────────────────────────────────────────────
  Tennis: `<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2" fill="none"/><path d="M5.5 6C8 8.5 8 15.5 5.5 18M18.5 6c-2.5 2.5-2.5 9.5 0 12" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>`,

  Badminton: `<ellipse cx="12" cy="8" rx="5.5" ry="7" stroke="currentColor" stroke-width="2" fill="none"/><path d="M12 1v14M6.5 8h11" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" fill="none"/><path d="M12 15v8" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" fill="none"/>`,

  TennisTable: `<circle cx="12" cy="9" r="6.5" stroke="currentColor" stroke-width="2" fill="none"/><path d="M5.5 9h13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" fill="none"/><rect x="10.5" y="15.5" width="3" height="6" rx="1.5" stroke="currentColor" stroke-width="2" fill="none"/>`,

  // ── Ball sports ──────────────────────────────────────────────────────────────
  Volleyball: `<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2" fill="none"/><path d="M12 3c-4 4 0 9 5 9M17 12c-4 0-8-4-5-9M12 21c4-4 0-9-5-9M7 12c4 0 8 4 5 9" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round"/>`,

  Hockey: `<path d="M5 4l4 14" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" fill="none"/><path d="M9 18c0 2 9 2 9-1" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round"/><circle cx="19" cy="20" r="1.5" fill="currentColor"/>`,

  Golf: `<path d="M9 20V6" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/><path d="M9 6l9-3v8L9 9" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/><circle cx="9" cy="20" r="1.5" fill="currentColor"/><path d="M5 22h8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" fill="none"/>`,

  Petanque: `<circle cx="8" cy="16" r="4.5" stroke="currentColor" stroke-width="2" fill="none"/><circle cx="16" cy="16" r="4.5" stroke="currentColor" stroke-width="2" fill="none"/><circle cx="12" cy="9" r="2.5" fill="currentColor"/><path d="M3 22h18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" fill="none"/>`,

  // ── Combat sports ────────────────────────────────────────────────────────────
  Boxe: `<rect x="2" y="7" width="8.5" height="9.5" rx="4" stroke="currentColor" stroke-width="2" fill="none"/><path d="M2 17.5h8.5" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" fill="none"/><rect x="13.5" y="7" width="8.5" height="9.5" rx="4" stroke="currentColor" stroke-width="2" fill="none"/><path d="M13.5 17.5h8.5" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" fill="none"/>`,

  Judo: `<circle cx="12" cy="3.5" r="1.8" fill="currentColor"/><path d="M7 7.5h10v13H7z" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linejoin="round"/><path d="M7 7.5l5 6.5M17 7.5l-5 6.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/><path d="M7 15h10" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" fill="none"/><path d="M7 9.5L3 13M17 9.5l4 3.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/>`,

  Karate: `<circle cx="12" cy="4" r="2" fill="currentColor"/><path d="M12 6v5" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/><path d="M9 8.5L5 12M15 8.5l5 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/><path d="M10 11l-3 8M14 11l5 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/>`,

  // ── Winter / outdoor ─────────────────────────────────────────────────────────
  Ski: `<circle cx="16" cy="4" r="2" fill="currentColor"/><path d="M16 6l-3 5-4 1.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M12 12l1 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/><path d="M2 21h20" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/><path d="M6 8l-4 13M18 6l-3 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" fill="none"/>`,

  Escalade: `<path d="M4 21V3" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/><circle cx="15" cy="6" r="2" fill="currentColor"/><path d="M15 8l-3 5-4 2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M8 15l-3 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/><circle cx="7" cy="9" r="1.3" fill="currentColor"/><circle cx="12" cy="17" r="1.3" fill="currentColor"/>`,

  // ── Fitness / gym ────────────────────────────────────────────────────────────
  Musculation: `<path d="M6 12h12" stroke="currentColor" stroke-width="3" stroke-linecap="round" fill="none"/><path d="M4 9v6M20 9v6" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" fill="none"/><path d="M1 10v4M23 10v4" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/>`,

  Yoga: `<circle cx="12" cy="4" r="2" fill="currentColor"/><path d="M12 6v5" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/><path d="M9 9L4 12M15 9l5 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/><path d="M9 18l3-7 3 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M9 18h6" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/>`,

  Fitness: `<circle cx="12" cy="4" r="2" fill="currentColor"/><path d="M12 6l-3 4 3 3 3-3-3-4z" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linejoin="round"/><path d="M9 10l-4 8M15 10l4 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/>`,

  // ── Other ────────────────────────────────────────────────────────────────────
  Equitation: `<ellipse cx="14" cy="15" rx="6" ry="3.5" stroke="currentColor" stroke-width="2" fill="none"/><path d="M8 13.5c-1 -3.5 .5 -6 3 -7" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" fill="none"/><path d="M11 6.5c.5-1.5 2-2.5 3.5-2s2.5 2 1.5 3.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/><path d="M10 18.5l-1 4.5M13 18.5v4.5M16.5 18.5l1 4M19.5 17l1.5 4.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/><path d="M20 15c2.5-1 3.5-2.5 3-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/>`,

  Athletisme: `<circle cx="14" cy="4" r="2" fill="currentColor"/><path d="M14 6l-2 5-5 2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M12 11l-3 8M12 11l4 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/><ellipse cx="6" cy="18" rx="5" ry="2.5" stroke="currentColor" stroke-width="1.5" fill="none"/>`,

  Danse: `<circle cx="13" cy="4" r="2" fill="currentColor"/><path d="M13 6l-2 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/><path d="M11 10l-4-2M11 10l-1 5M11 10l5-2" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/><path d="M10 15l-2 5M10 15l4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/>`,

  Tir: `<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2" fill="none"/><circle cx="12" cy="12" r="5.5" stroke="currentColor" stroke-width="1.8" fill="none"/><circle cx="12" cy="12" r="2.5" stroke="currentColor" stroke-width="1.5" fill="none"/><circle cx="12" cy="12" r="1" fill="currentColor"/>`,

  Triathlon: `<circle cx="6" cy="15" r="4" stroke="currentColor" stroke-width="2" fill="none"/><circle cx="18" cy="15" r="4" stroke="currentColor" stroke-width="2" fill="none"/><path d="M10 15h4M12 12v3" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/><circle cx="12" cy="6" r="2" fill="currentColor"/><path d="M10 8l2 4 2-4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
};

// Icon picker options — displayed in admin sports form
export const SPORT_ICON_OPTIONS = [
  { id: 'Football',    label: 'Football' },
  { id: 'Handball',    label: 'Handball' },
  { id: 'Basketball',  label: 'Basketball' },
  { id: 'Rugby',       label: 'Rugby' },
  { id: 'Volleyball',  label: 'Volleyball' },
  { id: 'Hockey',      label: 'Hockey' },
  { id: 'Golf',        label: 'Golf' },
  { id: 'Petanque',    label: 'Pétanque' },
  { id: 'Running',     label: 'Course' },
  { id: 'Trail',       label: 'Trail' },
  { id: 'Cyclisme',    label: 'Cyclisme' },
  { id: 'Triathlon',   label: 'Triathlon' },
  { id: 'Athletisme',  label: 'Athlétisme' },
  { id: 'Natation',    label: 'Natation' },
  { id: 'Surf',        label: 'Surf' },
  { id: 'Voile',       label: 'Voile' },
  { id: 'Aviron',      label: 'Aviron' },
  { id: 'Tennis',      label: 'Tennis' },
  { id: 'Badminton',   label: 'Badminton' },
  { id: 'TennisTable', label: 'Tennis de table' },
  { id: 'Boxe',        label: 'Boxe' },
  { id: 'Judo',        label: 'Judo' },
  { id: 'Karate',      label: 'Karaté' },
  { id: 'Ski',         label: 'Ski' },
  { id: 'Escalade',    label: 'Escalade' },
  { id: 'Musculation', label: 'Musculation' },
  { id: 'Yoga',        label: 'Yoga' },
  { id: 'Fitness',     label: 'Fitness' },
  { id: 'Equitation',  label: 'Équitation' },
  { id: 'Danse',       label: 'Danse' },
  { id: 'Tir',         label: 'Tir' },
];
