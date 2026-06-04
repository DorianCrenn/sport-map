// Créneaux d'entraînement fictifs pour les mocks.
// Structure : { [teamId]: Session[] }
// Session : { id, day (fr), time (HH:MM), location }

export const MOCK_TRAININGS = {

  // ── Stade Brestois FC (sbf-29) ────────────────────────────────────────────

  'sbf-s1': [
    { id: 'tr-sbf-s1-1', day: 'Mardi',    time: '19:30', location: 'Stade Francis-Le Blé — Terrain annexe' },
    { id: 'tr-sbf-s1-2', day: 'Jeudi',    time: '19:30', location: 'Stade Francis-Le Blé — Terrain principal' },
    { id: 'tr-sbf-s1-3', day: 'Samedi',   time: '10:00', location: 'Stade Francis-Le Blé — Terrain principal' },
  ],
  'sbf-s2': [
    { id: 'tr-sbf-s2-1', day: 'Lundi',    time: '19:00', location: 'Stade Francis-Le Blé — Terrain annexe' },
    { id: 'tr-sbf-s2-2', day: 'Mercredi', time: '19:00', location: 'Stade Francis-Le Blé — Terrain annexe' },
  ],
  'sbf-res': [
    { id: 'tr-sbf-res-1', day: 'Lundi',   time: '20:00', location: 'Terrain de Penfeld' },
    { id: 'tr-sbf-res-2', day: 'Vendredi', time: '19:30', location: 'Terrain de Penfeld' },
  ],
  'sbf-u19': [
    { id: 'tr-sbf-u19-1', day: 'Mardi',   time: '18:00', location: 'Stade Francis-Le Blé — Terrain B' },
    { id: 'tr-sbf-u19-2', day: 'Jeudi',   time: '18:00', location: 'Stade Francis-Le Blé — Terrain B' },
    { id: 'tr-sbf-u19-3', day: 'Samedi',  time: '09:00', location: 'Stade Francis-Le Blé — Terrain B' },
  ],
  'sbf-u17': [
    { id: 'tr-sbf-u17-1', day: 'Mercredi', time: '17:00', location: 'Stade Francis-Le Blé — Terrain C' },
    { id: 'tr-sbf-u17-2', day: 'Vendredi', time: '17:00', location: 'Stade Francis-Le Blé — Terrain C' },
  ],
  'sbf-u15': [
    { id: 'tr-sbf-u15-1', day: 'Mercredi', time: '16:00', location: 'Plaine de jeux de Penfeld' },
    { id: 'tr-sbf-u15-2', day: 'Samedi',   time: '10:00', location: 'Plaine de jeux de Penfeld' },
  ],
  'sbf-u13': [
    { id: 'tr-sbf-u13-1', day: 'Mercredi', time: '14:30', location: 'Stade municipal du Vern' },
    { id: 'tr-sbf-u13-2', day: 'Samedi',   time: '09:30', location: 'Stade municipal du Vern' },
  ],
  'sbf-f1': [
    { id: 'tr-sbf-f1-1', day: 'Lundi',    time: '19:30', location: 'Stade du Vern' },
    { id: 'tr-sbf-f1-2', day: 'Mercredi', time: '19:30', location: 'Stade Francis-Le Blé — Terrain annexe' },
    { id: 'tr-sbf-f1-3', day: 'Vendredi', time: '19:00', location: 'Stade du Vern' },
  ],
  'sbf-f2': [
    { id: 'tr-sbf-f2-1', day: 'Mardi',    time: '19:00', location: 'Terrain de Lambézellec' },
    { id: 'tr-sbf-f2-2', day: 'Samedi',   time: '10:30', location: 'Terrain de Lambézellec' },
  ],

  // ── HBC Brest Métropole (hbcbm-29) ───────────────────────────────────────

  'hbcbm-sm': [
    { id: 'tr-hbcbm-sm-1', day: 'Mardi',   time: '20:00', location: 'Palais des Sports — Salle A' },
    { id: 'tr-hbcbm-sm-2', day: 'Jeudi',   time: '20:00', location: 'Palais des Sports — Salle A' },
    { id: 'tr-hbcbm-sm-3', day: 'Samedi',  time: '10:00', location: 'Palais des Sports — Salle A' },
  ],
  'hbcbm-sf': [
    { id: 'tr-hbcbm-sf-1', day: 'Lundi',    time: '19:30', location: 'Palais des Sports — Salle B' },
    { id: 'tr-hbcbm-sf-2', day: 'Mercredi', time: '19:30', location: 'Palais des Sports — Salle B' },
    { id: 'tr-hbcbm-sf-3', day: 'Vendredi', time: '20:00', location: 'Palais des Sports — Salle A' },
  ],
  'hbcbm-sm2': [
    { id: 'tr-hbcbm-sm2-1', day: 'Mardi',   time: '18:30', location: 'Gymnase Jean Jaurès' },
    { id: 'tr-hbcbm-sm2-2', day: 'Jeudi',   time: '18:30', location: 'Gymnase Jean Jaurès' },
  ],
  'hbcbm-u18m': [
    { id: 'tr-hbcbm-u18m-1', day: 'Mercredi', time: '17:00', location: 'Palais des Sports — Salle B' },
    { id: 'tr-hbcbm-u18m-2', day: 'Vendredi', time: '17:30', location: 'Palais des Sports — Salle B' },
    { id: 'tr-hbcbm-u18m-3', day: 'Samedi',   time: '14:00', location: 'Gymnase Jean Jaurès' },
  ],
  'hbcbm-u18f': [
    { id: 'tr-hbcbm-u18f-1', day: 'Mardi',  time: '17:00', location: 'Gymnase du Moulin Blanc' },
    { id: 'tr-hbcbm-u18f-2', day: 'Jeudi',  time: '17:00', location: 'Gymnase du Moulin Blanc' },
  ],
  'hbcbm-u16m': [
    { id: 'tr-hbcbm-u16m-1', day: 'Mercredi', time: '14:00', location: 'Gymnase de Lambézellec' },
    { id: 'tr-hbcbm-u16m-2', day: 'Samedi',   time: '09:00', location: 'Gymnase de Lambézellec' },
  ],
  'hbcbm-u14': [
    { id: 'tr-hbcbm-u14-1', day: 'Mercredi', time: '13:30', location: 'Gymnase de l\'École Keroual' },
    { id: 'tr-hbcbm-u14-2', day: 'Samedi',   time: '09:00', location: 'Gymnase de l\'École Keroual' },
  ],

  // ── Trail Club de Crozon (tcc-29) ─────────────────────────────────────────

  'tcc-comp': [
    { id: 'tr-tcc-comp-1', day: 'Mardi',    time: '18:30', location: 'Parking de Morgat — circuit entraînement' },
    { id: 'tr-tcc-comp-2', day: 'Jeudi',    time: '18:30', location: 'Parking de Morgat — fractionné côte' },
    { id: 'tr-tcc-comp-3', day: 'Dimanche', time: '09:00', location: 'Place de l\'Église Crozon — sortie longue' },
  ],
  'tcc-loisir': [
    { id: 'tr-tcc-loisir-1', day: 'Mercredi', time: '18:00', location: 'Parking de Morgat' },
    { id: 'tr-tcc-loisir-2', day: 'Samedi',   time: '09:00', location: 'Parking de Morgat' },
  ],
  'tcc-debutants': [
    { id: 'tr-tcc-deb-1', day: 'Samedi', time: '10:00', location: 'Stade municipal de Crozon' },
  ],

  // ── AS Plabennec (id: 5 dans clubs.js) ───────────────────────────────────

  'asp-s1': [
    { id: 'tr-asp-s1-1', day: 'Mardi',   time: '19:30', location: 'Stade de Kerhuel — Terrain principal' },
    { id: 'tr-asp-s1-2', day: 'Jeudi',   time: '19:30', location: 'Stade de Kerhuel — Terrain principal' },
    { id: 'tr-asp-s1-3', day: 'Samedi',  time: '10:00', location: 'Stade de Kerhuel' },
  ],
  'asp-s2': [
    { id: 'tr-asp-s2-1', day: 'Lundi',    time: '19:00', location: 'Stade de Kerhuel — Terrain annexe' },
    { id: 'tr-asp-s2-2', day: 'Mercredi', time: '19:00', location: 'Stade de Kerhuel — Terrain annexe' },
  ],
  'asp-u17': [
    { id: 'tr-asp-u17-1', day: 'Mercredi', time: '17:00', location: 'Stade municipal de Plabennec' },
    { id: 'tr-asp-u17-2', day: 'Vendredi', time: '17:00', location: 'Stade municipal de Plabennec' },
  ],
  'asp-u15': [
    { id: 'tr-asp-u15-1', day: 'Mercredi', time: '15:30', location: 'Stade municipal de Plabennec' },
    { id: 'tr-asp-u15-2', day: 'Samedi',   time: '09:30', location: 'Stade municipal de Plabennec' },
  ],
  'asp-u13': [
    { id: 'tr-asp-u13-1', day: 'Mercredi', time: '14:30', location: 'Terrain synthétique de Plabennec' },
    { id: 'tr-asp-u13-2', day: 'Samedi',   time: '10:00', location: 'Terrain synthétique de Plabennec' },
  ],

  // ── US Concarneau (usc-29) ────────────────────────────────────────────────

  'usc-s1': [
    { id: 'tr-usc-s1-1', day: 'Mardi',    time: '19:00', location: 'Stade Guy Piriou — Terrain 1' },
    { id: 'tr-usc-s1-2', day: 'Mercredi', time: '15:00', location: 'Stade Guy Piriou — Terrain 1' },
    { id: 'tr-usc-s1-3', day: 'Jeudi',    time: '19:00', location: 'Stade Guy Piriou — Terrain 1' },
  ],
  'usc-reserve': [
    { id: 'tr-usc-res-1', day: 'Mardi',   time: '18:30', location: 'Stade Guy Piriou — Terrain 2' },
    { id: 'tr-usc-res-2', day: 'Jeudi',   time: '18:30', location: 'Stade Guy Piriou — Terrain 2' },
  ],
  'usc-u19': [
    { id: 'tr-usc-u19-1', day: 'Lundi',    time: '18:00', location: "Terrain d'entraînement USC" },
    { id: 'tr-usc-u19-2', day: 'Mercredi', time: '17:00', location: "Terrain d'entraînement USC" },
    { id: 'tr-usc-u19-3', day: 'Vendredi', time: '18:00', location: "Terrain d'entraînement USC" },
  ],
  'usc-u17': [
    { id: 'tr-usc-u17-1', day: 'Mercredi', time: '16:00', location: 'Terrain annexe Concarneau' },
    { id: 'tr-usc-u17-2', day: 'Samedi',   time: '09:00', location: 'Terrain annexe Concarneau' },
  ],
  'usc-u15': [
    { id: 'tr-usc-u15-1', day: 'Mercredi', time: '14:30', location: 'Stade de la Ville Close' },
    { id: 'tr-usc-u15-2', day: 'Samedi',   time: '09:30', location: 'Stade de la Ville Close' },
  ],
  'usc-f1': [
    { id: 'tr-usc-f1-1', day: 'Lundi',   time: '19:00', location: 'Stade Guy Piriou — Terrain 2' },
    { id: 'tr-usc-f1-2', day: 'Jeudi',   time: '19:00', location: 'Stade Guy Piriou — Terrain 2' },
    { id: 'tr-usc-f1-3', day: 'Samedi',  time: '09:30', location: 'Terrain annexe Concarneau' },
  ],

  // ── Paris Athlétisme Nord (pan-75) ────────────────────────────────────────

  'pan-elite': [
    { id: 'tr-pan-elite-1', day: 'Lundi',    time: '07:00', location: 'Stade Hélène Boucher — piste' },
    { id: 'tr-pan-elite-2', day: 'Mercredi', time: '19:00', location: 'Stade Hélène Boucher — piste' },
    { id: 'tr-pan-elite-3', day: 'Vendredi', time: '07:00', location: 'Stade Hélène Boucher — piste' },
    { id: 'tr-pan-elite-4', day: 'Dimanche', time: '08:00', location: 'Bois de Boulogne — sortie longue' },
  ],
  'pan-espoirs': [
    { id: 'tr-pan-esp-1', day: 'Mardi',    time: '19:00', location: 'Stade Hélène Boucher — piste' },
    { id: 'tr-pan-esp-2', day: 'Jeudi',    time: '19:00', location: 'Stade Hélène Boucher — piste' },
    { id: 'tr-pan-esp-3', day: 'Samedi',   time: '09:00', location: 'Bois de Boulogne' },
  ],
  'pan-run1': [
    { id: 'tr-pan-run1-1', day: 'Mardi',   time: '19:30', location: 'Parc Monceau — départ fontaine' },
    { id: 'tr-pan-run1-2', day: 'Samedi',  time: '10:00', location: 'Parc Monceau — départ fontaine' },
  ],
  'pan-run2': [
    { id: 'tr-pan-run2-1', day: 'Lundi',    time: '19:30', location: 'Bois de Boulogne — parking Lac Inférieur' },
    { id: 'tr-pan-run2-2', day: 'Mercredi', time: '19:30', location: 'Bois de Boulogne — parking Lac Inférieur' },
    { id: 'tr-pan-run2-3', day: 'Dimanche', time: '09:00', location: 'Bois de Boulogne — parking Lac Inférieur' },
  ],
  'pan-trail': [
    { id: 'tr-pan-trail-1', day: 'Jeudi',   time: '19:00', location: 'Butte Montmartre — Départ Place Jules Joffrin' },
    { id: 'tr-pan-trail-2', day: 'Samedi',  time: '08:30', location: 'Bois de Vincennes — Départ Porte Dorée' },
  ],

  // ── Lyon Handball Club (lhc-69) ───────────────────────────────────────────

  'lhc-sm1': [
    { id: 'tr-lhc-sm1-1', day: 'Lundi',    time: '20:00', location: 'Halle Tony Garnier — Salle principale' },
    { id: 'tr-lhc-sm1-2', day: 'Mercredi', time: '20:00', location: 'Halle Tony Garnier — Salle principale' },
    { id: 'tr-lhc-sm1-3', day: 'Vendredi', time: '19:30', location: 'Halle Tony Garnier — Salle principale' },
  ],
  'lhc-sf1': [
    { id: 'tr-lhc-sf1-1', day: 'Mardi',   time: '19:30', location: 'Gymnase Anatole France — Lyon 7e' },
    { id: 'tr-lhc-sf1-2', day: 'Jeudi',   time: '19:30', location: 'Gymnase Anatole France — Lyon 7e' },
    { id: 'tr-lhc-sf1-3', day: 'Samedi',  time: '09:30', location: 'Halle Tony Garnier — Salle B' },
  ],
  'lhc-sm2': [
    { id: 'tr-lhc-sm2-1', day: 'Mardi',   time: '20:00', location: 'Gymnase Jean Bouin — Lyon 8e' },
    { id: 'tr-lhc-sm2-2', day: 'Jeudi',   time: '20:00', location: 'Gymnase Jean Bouin — Lyon 8e' },
  ],
  'lhc-u20m': [
    { id: 'tr-lhc-u20-1', day: 'Lundi',    time: '18:30', location: 'Halle Tony Garnier — Salle B' },
    { id: 'tr-lhc-u20-2', day: 'Mercredi', time: '18:30', location: 'Halle Tony Garnier — Salle B' },
    { id: 'tr-lhc-u20-3', day: 'Samedi',   time: '14:00', location: 'Gymnase Anatole France' },
  ],

  // ── Toulouse Rugby Olympique (tro-31) ─────────────────────────────────────

  'tro-s1': [
    { id: 'tr-tro-s1-1', day: 'Mardi',    time: '19:30', location: 'Stade Émile Sarrade — Terrain 1' },
    { id: 'tr-tro-s1-2', day: 'Jeudi',    time: '19:30', location: 'Stade Émile Sarrade — Terrain 1' },
    { id: 'tr-tro-s1-3', day: 'Samedi',   time: '09:30', location: 'Stade Émile Sarrade — Terrain 1' },
  ],
  'tro-s2': [
    { id: 'tr-tro-s2-1', day: 'Lundi',    time: '19:00', location: 'Stade Émile Sarrade — Terrain 2' },
    { id: 'tr-tro-s2-2', day: 'Mercredi', time: '19:00', location: 'Stade Émile Sarrade — Terrain 2' },
  ],
  'tro-u19': [
    { id: 'tr-tro-u19-1', day: 'Mercredi', time: '17:30', location: 'Stade Émile Sarrade — Terrain 3' },
    { id: 'tr-tro-u19-2', day: 'Vendredi', time: '17:30', location: 'Stade Émile Sarrade — Terrain 3' },
    { id: 'tr-tro-u19-3', day: 'Samedi',   time: '10:00', location: 'Stade Émile Sarrade — Terrain 2' },
  ],
  'tro-u17': [
    { id: 'tr-tro-u17-1', day: 'Mercredi', time: '16:00', location: 'Terrain de la Reynerie' },
    { id: 'tr-tro-u17-2', day: 'Samedi',   time: '10:00', location: 'Terrain de la Reynerie' },
  ],

  // ── Marseille Trail Calanques (mtc-13) ────────────────────────────────────

  'mtc-elite': [
    { id: 'tr-mtc-elite-1', day: 'Mardi',    time: '06:30', location: 'Calanques — Départ Goudes' },
    { id: 'tr-mtc-elite-2', day: 'Jeudi',    time: '06:30', location: 'Calanques — Départ Luminy' },
    { id: 'tr-mtc-elite-3', day: 'Dimanche', time: '07:00', location: 'Calanques — Sortie longue Cassis' },
  ],
  'mtc-perf': [
    { id: 'tr-mtc-perf-1', day: 'Mardi',    time: '18:30', location: 'Parc Borély — Piste athlétisme' },
    { id: 'tr-mtc-perf-2', day: 'Vendredi', time: '18:30', location: 'Calanques — Départ Goudes' },
    { id: 'tr-mtc-perf-3', day: 'Dimanche', time: '08:00', location: 'Calanques — Sortie technique' },
  ],
  'mtc-loisir': [
    { id: 'tr-mtc-loisir-1', day: 'Mercredi', time: '18:00', location: 'Parc Borély — Départ kiosque' },
    { id: 'tr-mtc-loisir-2', day: 'Samedi',   time: '09:00', location: 'Parc Borély — Départ kiosque' },
  ],
  'mtc-decouverte': [
    { id: 'tr-mtc-deco-1', day: 'Samedi', time: '10:00', location: 'Stade Vallier — Piste' },
  ],

  // ── Nantes Cyclisme Métropole (ncm-44) ────────────────────────────────────

  'ncm-elite': [
    { id: 'tr-ncm-elite-1', day: 'Mardi',    time: '06:30', location: 'Vélodrome Nantais — Piste' },
    { id: 'tr-ncm-elite-2', day: 'Jeudi',    time: '06:30', location: 'Sortie Route — Départ Vélodrome' },
    { id: 'tr-ncm-elite-3', day: 'Samedi',   time: '07:30', location: 'Sortie longue — Départ Vélodrome' },
  ],
  'ncm-loisir': [
    { id: 'tr-ncm-loisir-1', day: 'Mercredi', time: '18:00', location: 'Vélodrome Nantais — Départ' },
    { id: 'tr-ncm-loisir-2', day: 'Dimanche', time: '09:00', location: 'Parc de la Beaujoire — Parking' },
  ],
  'ncm-vtt': [
    { id: 'tr-ncm-vtt-1', day: 'Mercredi', time: '18:30', location: 'Forêt du Gâvre — Parking' },
    { id: 'tr-ncm-vtt-2', day: 'Samedi',   time: '09:00', location: 'Forêt du Gâvre — Parking' },
  ],
  'ncm-gravel': [
    { id: 'tr-ncm-gravel-1', day: 'Dimanche', time: '08:30', location: 'Départ Vélodrome — Vignoble Loire' },
  ],
};
