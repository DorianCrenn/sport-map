export const STATIC_CLUBS = [
  { id: 1,  name: 'US Brest Football',       sport: 'Football',   city: 'Brest',      members: 320, level: 'Division Honneur',      contact: 'usbrest29@gmail.com' },
  { id: 2,  name: 'Quimper Cornouaille FC',  sport: 'Football',   city: 'Quimper',    members: 280, level: 'Division Honneur',      contact: 'qcfc29@gmail.com' },
  { id: 3,  name: 'Morlaix FC',              sport: 'Football',   city: 'Morlaix',    members: 210, level: 'Division Honneur',      contact: 'morlaixfc@gmail.com' },
  { id: 4,  name: 'ASC Carhaix',             sport: 'Football',   city: 'Carhaix',    members: 180, level: 'Promotion de Ligue',    contact: 'asccarhaix@gmail.com' },
  {
    id: 5,
    name: 'AS Plabennec',
    sport: 'Football',
    city: 'Plabennec',
    members: 195,
    level: 'Division Honneur',
    contact: 'asplabennec@gmail.com',
    categories: [
      {
        id: 'seniors-asp',
        name: 'Seniors',
        teams: [
          { id: 'asp-s1',    name: 'Seniors 1', category: 'Division Honneur Bretagne' },
          { id: 'asp-s2',    name: 'Seniors 2', category: 'Promotion de Ligue' },
        ],
      },
      {
        id: 'jeunes-asp',
        name: 'Jeunes',
        teams: [
          { id: 'asp-u17', name: 'U17', category: 'U17 Régional' },
          { id: 'asp-u15', name: 'U15', category: 'U15 Régional' },
          { id: 'asp-u13', name: 'U13', category: 'U13 Départemental' },
        ],
      },
    ],
  },
  { id: 6,  name: 'HBC Brest',              sport: 'Handball',   city: 'Brest',      members: 150, level: 'N3 Régional',           contact: 'hbcbrest@gmail.com' },
  { id: 7,  name: 'HBC Concarneau',         sport: 'Handball',   city: 'Concarneau', members: 120, level: 'N3 Régional',           contact: 'hbcconcarneau@gmail.com' },
  { id: 8,  name: 'Morlaix Handball',       sport: 'Handball',   city: 'Morlaix',    members: 95,  level: 'N3 Régional',           contact: 'morlaixhb@gmail.com' },
  { id: 9,  name: 'Landerneau Bretagne BB', sport: 'Basketball', city: 'Landerneau', members: 200, level: 'Pro B',                 contact: 'lbb29@gmail.com' },
  { id: 10, name: 'Quimper Basket',         sport: 'Basketball', city: 'Quimper',    members: 175, level: 'Pro B',                 contact: 'quimperbasket@gmail.com' },
  { id: 11, name: 'Concarneau Basket',      sport: 'Basketball', city: 'Concarneau', members: 130, level: 'Régional',              contact: 'concbask@gmail.com' },
  { id: 12, name: 'Rugby Club Brestois',    sport: 'Rugby',      city: 'Brest',      members: 160, level: 'Fédérale 3',            contact: 'rcb29@gmail.com' },
  { id: 13, name: 'RC Quimper',             sport: 'Rugby',      city: 'Quimper',    members: 140, level: 'Fédérale 3',            contact: 'rcquimper@gmail.com' },
  { id: 14, name: 'Brest Atlético Club',    sport: 'Running',    city: 'Brest',      members: 420, level: 'Loisir / Compétition',  contact: 'bac29@gmail.com' },
  { id: 15, name: 'Quimper Athlétisme',     sport: 'Running',    city: 'Quimper',    members: 310, level: 'Loisir / Compétition',  contact: 'qa29@gmail.com' },
  { id: 16, name: 'Trail Côtier Finistère', sport: 'Trail',      city: 'Brest',      members: 180, level: 'Tout public',           contact: 'tcf29@gmail.com' },
  { id: 17, name: 'Vélo Club Brestois',     sport: 'Cyclisme',   city: 'Brest',      members: 260, level: 'Loisir / Compétition',  contact: 'vcb29@gmail.com' },
  { id: 18, name: 'Cyclisme Cornouaille',   sport: 'Cyclisme',   city: 'Quimper',    members: 195, level: 'Loisir / Compétition',  contact: 'cyclcorn@gmail.com' },

  // ── US Concarneau — club complet avec équipes réelles ──────────────────────
  {
    id: 'usc-29',
    name: 'US Concarneau',
    sport: 'Football',
    city: 'Concarneau',
    members: 620,
    level: 'National 2',
    contact: 'contact@usconcarneau.fr',
    // Logo officiel USC (bleu & blanc)
    logo: 'https://upload.wikimedia.org/wikipedia/fr/thumb/4/4e/US_Concarneau_logo.png/120px-US_Concarneau_logo.png',
    categories: [
      {
        id: 'usc-seniors',
        name: 'Seniors',
        teams: [
          { id: 'usc-s1',       name: 'Seniors 1',  category: 'National 2' },
          { id: 'usc-reserve',  name: 'Réserve',    category: 'Division Honneur Bretagne' },
        ],
      },
      {
        id: 'usc-jeunes',
        name: 'Jeunes',
        teams: [
          { id: 'usc-u19', name: 'U19',  category: 'U19 Régional Bretagne' },
          { id: 'usc-u17', name: 'U17',  category: 'U17 Régional' },
          { id: 'usc-u15', name: 'U15',  category: 'U15 Régional' },
          { id: 'usc-u13', name: 'U13',  category: 'U13 Départemental' },
        ],
      },
      {
        id: 'usc-feminines',
        name: 'Féminines',
        teams: [
          { id: 'usc-f1', name: 'Féminines 1', category: 'Division 2 Fédérale' },
        ],
      },
    ],
  },
];
