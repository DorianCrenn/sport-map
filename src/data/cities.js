export const FINISTERE_CITIES = [
  { name: 'Brest', lat: 48.3904, lng: -4.4861 },
  { name: 'Quimper', lat: 48.0022, lng: -4.1020 },
  { name: 'Morlaix', lat: 48.5779, lng: -3.8290 },
  { name: 'Landerneau', lat: 48.4498, lng: -4.2504 },
  { name: 'Douarnenez', lat: 48.0943, lng: -4.3285 },
  { name: 'Concarneau', lat: 47.8726, lng: -3.9206 },
  { name: 'Châteaulin', lat: 48.1924, lng: -4.0888 },
  { name: 'Carhaix-Plouguer', lat: 48.2776, lng: -3.5729 },
  { name: 'Saint-Pol-de-Léon', lat: 48.6849, lng: -3.9848 },
  { name: "Pont-l'Abbé", lat: 47.8665, lng: -4.2215 },
  { name: 'Plabennec', lat: 48.4749, lng: -4.4163 },
  { name: 'Landivisiau', lat: 48.5095, lng: -4.0664 },
  { name: 'Audierne', lat: 48.0248, lng: -4.5371 },
  { name: 'Lannilis', lat: 48.5695, lng: -4.5076 },
  { name: 'Plogoff', lat: 48.0381, lng: -4.7255 },
  { name: 'Crozon', lat: 48.2497, lng: -4.5696 },
  { name: 'Quimperlé', lat: 47.8724, lng: -3.5498 },
  { name: 'Fouesnant', lat: 47.8944, lng: -4.0121 },
  { name: 'Pont-Aven', lat: 47.8565, lng: -3.7463 },
  { name: 'Roscoff', lat: 48.7270, lng: -3.9877 },
  { name: 'Brest (Guipavas)', lat: 48.4320, lng: -4.4000 },
  { name: 'Sizun', lat: 48.4006, lng: -4.0810 },
  { name: 'Pleyben', lat: 48.2320, lng: -3.9630 },
  { name: 'Scaër', lat: 48.0264, lng: -3.6990 },
];

export const SPORT_TO_GROUP = {
  Football: 'football',
  Handball: 'team',
  Basketball: 'team',
  Rugby: 'team',
  Trail: 'endurance',
  Running: 'endurance',
  Cyclisme: 'endurance',
  Triathlon: 'endurance',
  Natation: 'endurance',
  Autre: 'endurance',
};

export const SPORT_OPTIONS = Object.keys(SPORT_TO_GROUP);
export const LEVEL_OPTIONS = ['Amateur', 'Régional', 'Pro', 'Tout public'];
