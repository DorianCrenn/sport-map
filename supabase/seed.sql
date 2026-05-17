-- ============================================================
-- SportLink — Seed data  [ARCH-001]
-- Clubs et événements statiques pour déploiement initial
-- Idempotent — safe to re-run
-- Exécuter dans : Supabase Dashboard → SQL Editor
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. Extensions de schéma (colonnes non présentes dans schema.sql)
-- ────────────────────────────────────────────────────────────

ALTER TABLE IF EXISTS public.clubs
  ADD COLUMN IF NOT EXISTS static_id  TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS members    INTEGER,
  ADD COLUMN IF NOT EXISTS level      TEXT,
  ADD COLUMN IF NOT EXISTS categories JSONB,
  ADD COLUMN IF NOT EXISTS source     TEXT DEFAULT 'user';

ALTER TABLE IF EXISTS public.events
  ADD COLUMN IF NOT EXISTS static_id     TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS venue         TEXT,
  ADD COLUMN IF NOT EXISTS department_id TEXT,
  ADD COLUMN IF NOT EXISTS region_id     TEXT,
  ADD COLUMN IF NOT EXISTS level         TEXT,
  ADD COLUMN IF NOT EXISTS standings     JSONB,
  ADD COLUMN IF NOT EXISTS club_name     TEXT,
  ADD COLUMN IF NOT EXISTS sport_group   TEXT,
  ADD COLUMN IF NOT EXISTS score         JSONB DEFAULT NULL;

-- ────────────────────────────────────────────────────────────
-- 2. Clubs (19 clubs statiques finistériens)
-- ────────────────────────────────────────────────────────────

INSERT INTO public.clubs
  (static_id, name, sport, city, email, members, level, logo_url, categories, source)
VALUES
  ('1',  'US Brest Football',       'Football',   'Brest',      'usbrest29@gmail.com',     320, 'Division Honneur',     NULL, NULL, 'seed'),
  ('2',  'Quimper Cornouaille FC',  'Football',   'Quimper',    'qcfc29@gmail.com',        280, 'Division Honneur',     NULL, NULL, 'seed'),
  ('3',  'Morlaix FC',              'Football',   'Morlaix',    'morlaixfc@gmail.com',     210, 'Division Honneur',     NULL, NULL, 'seed'),
  ('4',  'ASC Carhaix',             'Football',   'Carhaix',    'asccarhaix@gmail.com',    180, 'Promotion de Ligue',   NULL, NULL, 'seed'),
  ('5',  'AS Plabennec',            'Football',   'Plabennec',  'asplabennec@gmail.com',   195, 'Division Honneur',     NULL,
    '[{"id":"seniors-asp","name":"Seniors","teams":[{"id":"asp-s1","name":"Seniors 1","category":"Division Honneur Bretagne"},{"id":"asp-s2","name":"Seniors 2","category":"Promotion de Ligue"}]},{"id":"jeunes-asp","name":"Jeunes","teams":[{"id":"asp-u17","name":"U17","category":"U17 Régional"},{"id":"asp-u15","name":"U15","category":"U15 Régional"},{"id":"asp-u13","name":"U13","category":"U13 Départemental"}]}]'::jsonb,
    'seed'),
  ('6',  'HBC Brest',               'Handball',   'Brest',      'hbcbrest@gmail.com',      150, 'N3 Régional',          NULL, NULL, 'seed'),
  ('7',  'HBC Concarneau',          'Handball',   'Concarneau', 'hbcconcarneau@gmail.com', 120, 'N3 Régional',          NULL, NULL, 'seed'),
  ('8',  'Morlaix Handball',        'Handball',   'Morlaix',    'morlaixhb@gmail.com',      95, 'N3 Régional',          NULL, NULL, 'seed'),
  ('9',  'Landerneau Bretagne BB',  'Basketball', 'Landerneau', 'lbb29@gmail.com',         200, 'Pro B',                NULL, NULL, 'seed'),
  ('10', 'Quimper Basket',          'Basketball', 'Quimper',    'quimperbasket@gmail.com', 175, 'Pro B',                NULL, NULL, 'seed'),
  ('11', 'Concarneau Basket',       'Basketball', 'Concarneau', 'concbask@gmail.com',      130, 'Régional',             NULL, NULL, 'seed'),
  ('12', 'Rugby Club Brestois',     'Rugby',      'Brest',      'rcb29@gmail.com',         160, 'Fédérale 3',           NULL, NULL, 'seed'),
  ('13', 'RC Quimper',              'Rugby',      'Quimper',    'rcquimper@gmail.com',     140, 'Fédérale 3',           NULL, NULL, 'seed'),
  ('14', 'Brest Atlético Club',     'Running',    'Brest',      'bac29@gmail.com',         420, 'Loisir / Compétition', NULL, NULL, 'seed'),
  ('15', 'Quimper Athlétisme',      'Running',    'Quimper',    'qa29@gmail.com',           310, 'Loisir / Compétition',NULL, NULL, 'seed'),
  ('16', 'Trail Côtier Finistère',  'Trail',      'Brest',      'tcf29@gmail.com',         180, 'Tout public',          NULL, NULL, 'seed'),
  ('17', 'Vélo Club Brestois',      'Cyclisme',   'Brest',      'vcb29@gmail.com',         260, 'Loisir / Compétition', NULL, NULL, 'seed'),
  ('18', 'Cyclisme Cornouaille',    'Cyclisme',   'Quimper',    'cyclcorn@gmail.com',      195, 'Loisir / Compétition', NULL, NULL, 'seed'),
  ('usc-29', 'US Concarneau',       'Football',   'Concarneau', 'contact@usconcarneau.fr', 620, 'National 2',
    'https://upload.wikimedia.org/wikipedia/fr/thumb/4/4e/US_Concarneau_logo.png/120px-US_Concarneau_logo.png',
    '[{"id":"usc-seniors","name":"Seniors","teams":[{"id":"usc-s1","name":"Seniors 1","category":"National 2"},{"id":"usc-reserve","name":"Réserve","category":"Division Honneur Bretagne"}]},{"id":"usc-jeunes","name":"Jeunes","teams":[{"id":"usc-u19","name":"U19","category":"U19 Régional Bretagne"},{"id":"usc-u17","name":"U17","category":"U17 Régional"},{"id":"usc-u15","name":"U15","category":"U15 Régional"},{"id":"usc-u13","name":"U13","category":"U13 Départemental"}]},{"id":"usc-feminines","name":"Féminines","teams":[{"id":"usc-f1","name":"Féminines 1","category":"Division 2 Fédérale"}]}]'::jsonb,
    'seed')
ON CONFLICT (static_id) DO NOTHING;

-- ────────────────────────────────────────────────────────────
-- 3. Events — semaine du 4 mai + weekend 9-10 mai
-- ────────────────────────────────────────────────────────────

INSERT INTO public.events
  (static_id, title, sport, sport_group, date, city, venue, lat, lng,
   department_id, region_id, description, level, event_type,
   team_name, category, club_id, club_name, standings, source)
VALUES
  ('1',
   'US Brest vs FC Landivisiau', 'Football', 'football',
   '2026-05-06T19:00:00', 'Brest', 'Stade Francis-Le Blé', 48.3904, -4.4861,
   'finistere', 'brittany',
   'Choc du haut de tableau en Division Honneur Bretagne. L''US Brest, dauphin du championnat, reçoit un FC Landivisiau accrocheur qui joue sa place dans le top 5.',
   'Amateur', 'championship', '', '', NULL, NULL,
   '{"home":{"team":"US Brest","rank":2,"points":54,"played":28,"wins":17,"draws":3,"losses":8},"away":{"team":"FC Landivisiau","rank":5,"points":44,"played":28,"wins":13,"draws":5,"losses":10}}'::jsonb,
   'seed'),

  ('2',
   'ASC Carhaix vs Stade Quimperlois', 'Football', 'football',
   '2026-05-07T20:30:00', 'Carhaix', 'Stade de Carhaix', 48.2776, -3.5729,
   'finistere', 'brittany',
   'Match de Promotion de Ligue entre deux équipes du centre-Finistère. L''ASC Carhaix cherche à consolider sa 4e place face à Quimper qui lutte pour le maintien.',
   'Amateur', 'championship', '', '', NULL, NULL,
   '{"home":{"team":"ASC Carhaix","rank":4,"points":38,"played":25,"wins":11,"draws":5,"losses":9},"away":{"team":"Stade Quimperlois","rank":11,"points":22,"played":25,"wins":6,"draws":4,"losses":15}}'::jsonb,
   'seed'),

  ('3',
   'Trail des Abers', 'Trail', 'endurance',
   '2026-05-09T09:00:00', 'Lannilis', 'Départ Place de la Mairie', 48.5695, -4.5076,
   'finistere', 'brittany',
   'Trail nature en bord de mer le long des Abers. Deux parcours : 22 km (D+ 450m) et 10 km (D+ 180m). Ravitaillement au km 11. Inscription sur place acceptée jusqu''à 8h30.',
   'Tout public', 'friendly', '', '', NULL, NULL, NULL, 'seed'),

  ('4',
   'HBC Brest vs HBC Guipavas', 'Handball', 'team',
   '2026-05-09T15:00:00', 'Brest', 'Palais des Sports de Brest', 48.3826, -4.4958,
   'finistere', 'brittany',
   'Derby brestois en Championnat Régional N3. HBC Brest, leader incontesté, reçoit son voisin guipavésien dans ce duel local à haute intensité.',
   'Régional', 'championship', '', '', NULL, NULL,
   '{"home":{"team":"HBC Brest","rank":1,"points":46,"played":22,"wins":15,"draws":1,"losses":6},"away":{"team":"HBC Guipavas","rank":6,"points":28,"played":22,"wins":8,"draws":4,"losses":10}}'::jsonb,
   'seed'),

  ('5',
   'US Brest vs Quimper Cornouaille FC', 'Football', 'football',
   '2026-05-10T15:00:00', 'Brest', 'Stade Francis-Le Blé', 48.3904, -4.4861,
   'finistere', 'brittany',
   'Le grand derby du Finistère ! US Brest accueille son rival historique de Quimper pour un match au sommet de la Division Honneur. Ambiance garantie dans ce stade mythique.',
   'Amateur', 'championship', '', '', NULL, NULL,
   '{"home":{"team":"US Brest","rank":2,"points":54,"played":28,"wins":17,"draws":3,"losses":8},"away":{"team":"Quimper Cornouaille FC","rank":3,"points":50,"played":28,"wins":15,"draws":5,"losses":8}}'::jsonb,
   'seed'),

  ('6',
   'Landerneau Bretagne BB vs Quimper Basket', 'Basketball', 'team',
   '2026-05-10T17:30:00', 'Landerneau', 'Salle Kéroual', 48.4498, -4.2504,
   'finistere', 'brittany',
   'Match aller des playoffs Pro B. Landerneau Bretagne BB, habitué des hautes sphères, reçoit Quimper Basket dans une salle Kéroual qui s''annonce électrique.',
   'Pro', 'championship', '', '', NULL, NULL,
   '{"home":{"team":"Landerneau Bretagne BB","rank":3,"points":null,"played":30,"wins":18,"draws":0,"losses":12},"away":{"team":"Quimper Basket","rank":6,"points":null,"played":30,"wins":15,"draws":0,"losses":15}}'::jsonb,
   'seed'),

  ('7',
   'Cyclosportive des Monts d''Arrée', 'Cyclisme', 'endurance',
   '2026-05-10T08:30:00', 'Châteaulin', 'Départ Place du Général de Gaulle', 48.1924, -4.0888,
   'finistere', 'brittany',
   'Cyclosportive en plein cœur des Monts d''Arrée. Deux parcours : 80 km (D+ 950m) et 120 km (D+ 1450m). Passage par Brasparts, Huelgoat et le Roc''h Trévezel.',
   'Tout public', 'friendly', '', '', NULL, NULL, NULL, 'seed')

ON CONFLICT (static_id) DO NOTHING;

-- ────────────────────────────────────────────────────────────
-- 4. Events — semaine du 11 mai + weekend 16-17 mai
-- ────────────────────────────────────────────────────────────

INSERT INTO public.events
  (static_id, title, sport, sport_group, date, city, venue, lat, lng,
   department_id, region_id, description, level, event_type,
   team_name, category, club_id, club_name, standings, source)
VALUES
  ('8',
   'Morlaix FC vs AS Plabennec', 'Football', 'football',
   '2026-05-13T19:00:00', 'Morlaix', 'Stade Marcel Guéguen', 48.5779, -3.8290,
   'finistere', 'brittany',
   'Morlaix FC reçoit Plabennec dans un match à enjeu en Division Honneur Bretagne. Les deux équipes se tiennent en 3 points et visent toutes deux le podium final.',
   'Amateur', 'championship', '', '', NULL, NULL,
   '{"home":{"team":"Morlaix FC","rank":4,"points":47,"played":28,"wins":14,"draws":5,"losses":9},"away":{"team":"AS Plabennec","rank":6,"points":44,"played":28,"wins":13,"draws":5,"losses":10}}'::jsonb,
   'seed'),

  ('9',
   'Rugby Club Brestois vs RC Quimper', 'Rugby', 'team',
   '2026-05-14T20:00:00', 'Brest', 'Stade du Bouguen', 48.3750, -4.4621,
   'finistere', 'brittany',
   'Demi-finale des playoffs Fédérale 3. RC Brest, impressionnant en phase régulière, accueille RC Quimper pour ce choc qui enverra le vainqueur en finale départementale.',
   'Amateur', 'championship', '', '', NULL, NULL,
   '{"home":{"team":"Rugby Club Brestois","rank":1,"points":72,"played":18,"wins":14,"draws":0,"losses":4},"away":{"team":"RC Quimper","rank":4,"points":55,"played":18,"wins":10,"draws":5,"losses":3}}'::jsonb,
   'seed'),

  ('10',
   'Semi-marathon de Quimper', 'Running', 'endurance',
   '2026-05-17T09:30:00', 'Quimper', 'Départ Place de la Résistance', 48.0022, -4.1020,
   'finistere', 'brittany',
   'Semi-marathon officiel sur un parcours plat et rapide longeant l''Odet. Accompagné d''un 10 km et d''un 5 km famille. Ravitaillement tous les 5 km. Plus de 1500 inscrits attendus.',
   'Tout public', 'friendly', '', '', NULL, NULL, NULL, 'seed'),

  ('11',
   'HBC Concarneau vs Morlaix Handball', 'Handball', 'team',
   '2026-05-16T16:00:00', 'Concarneau', 'Palais des Sports de Cornouaille', 47.8726, -3.9206,
   'finistere', 'brittany',
   'Match capital en fin de saison N3. Concarneau joue sa qualification pour les playoffs, Morlaix lutte pour éviter la descente. Un match sous haute tension.',
   'Régional', 'championship', '', '', NULL, NULL,
   '{"home":{"team":"HBC Concarneau","rank":4,"points":30,"played":20,"wins":9,"draws":3,"losses":8},"away":{"team":"Morlaix Handball","rank":10,"points":18,"played":20,"wins":5,"draws":3,"losses":12}}'::jsonb,
   'seed'),

  ('12',
   'Douarnenez FC vs US Pont-l''Abbé', 'Football', 'football',
   '2026-05-17T15:00:00', 'Douarnenez', 'Stade de Pouldavid', 48.0943, -4.3285,
   'finistere', 'brittany',
   'Match de milieu de tableau en Division Honneur. Douarnenez et Pont-l''Abbé s''affrontent dans un derby du Pays Bigouden, toujours animé par une belle rivalité locale.',
   'Amateur', 'championship', '', '', NULL, NULL,
   '{"home":{"team":"Douarnenez FC","rank":8,"points":38,"played":28,"wins":11,"draws":5,"losses":12},"away":{"team":"US Pont-l''Abbé","rank":9,"points":36,"played":28,"wins":10,"draws":6,"losses":12}}'::jsonb,
   'seed'),

  ('13',
   'Quimper Cornouaille FC vs Morlaix FC', 'Football', 'football',
   '2026-05-17T17:00:00', 'Quimper', 'Stade de Penn ar Ru', 47.9892, -4.1080,
   'finistere', 'brittany',
   'Duel entre deux prétendants au titre en Division Honneur Bretagne. Quimper reçoit Morlaix dans un match qui pourrait redistribuer les cartes au classement à 3 journées de la fin.',
   'Amateur', 'championship', '', '', NULL, NULL,
   '{"home":{"team":"Quimper Cornouaille FC","rank":3,"points":50,"played":28,"wins":15,"draws":5,"losses":8},"away":{"team":"Morlaix FC","rank":4,"points":47,"played":28,"wins":14,"draws":5,"losses":9}}'::jsonb,
   'seed'),

  ('14',
   'Randonnée VTT du Cap Sizun', 'Cyclisme', 'endurance',
   '2026-05-16T09:00:00', 'Audierne', 'Départ Port d''Audierne', 48.0248, -4.5371,
   'finistere', 'brittany',
   'Randonnée VTT non-compétitive sur les sentiers du Cap Sizun. Deux boucles : 30 km (accessible à tous) et 50 km (intermédiaire). Magnifique vue sur la baie d''Audierne.',
   'Tout public', 'friendly', '', '', NULL, NULL, NULL, 'seed')

ON CONFLICT (static_id) DO NOTHING;

-- ────────────────────────────────────────────────────────────
-- 5. Events — semaine du 18 mai + weekend 23-24 mai
-- ────────────────────────────────────────────────────────────

INSERT INTO public.events
  (static_id, title, sport, sport_group, date, city, venue, lat, lng,
   department_id, region_id, description, level, event_type,
   team_name, category, club_id, club_name, standings, source)
VALUES
  ('15',
   'Landerneau Bretagne BB vs Brest Basket', 'Basketball', 'team',
   '2026-05-20T20:00:00', 'Landerneau', 'Salle Kéroual', 48.4498, -4.2504,
   'finistere', 'brittany',
   'Match retour des playoffs Pro B. Après la victoire à l''aller (78-65), Landerneau doit confirmer à domicile pour décrocher son billet pour la finale de conférence.',
   'Pro', 'championship', '', '', NULL, NULL,
   '{"home":{"team":"Landerneau Bretagne BB","rank":3,"points":null,"played":31,"wins":19,"draws":0,"losses":12},"away":{"team":"Brest Basket","rank":6,"points":null,"played":31,"wins":15,"draws":0,"losses":16}}'::jsonb,
   'seed'),

  ('16',
   'AS Plabennec vs Douarnenez FC', 'Football', 'football',
   '2026-05-21T19:30:00', 'Plabennec', 'Stade de Kerhuel', 48.4749, -4.4163,
   'finistere', 'brittany',
   'AS Plabennec reçoit Douarnenez dans un match d''importance en Division Honneur. Les Plabennecois ont besoin des 3 points pour rester dans la course au podium.',
   'Amateur', 'championship', '', '', NULL, NULL,
   '{"home":{"team":"AS Plabennec","rank":6,"points":44,"played":29,"wins":13,"draws":5,"losses":11},"away":{"team":"Douarnenez FC","rank":8,"points":38,"played":29,"wins":11,"draws":5,"losses":13}}'::jsonb,
   'seed'),

  ('17',
   'Cyclosportive du Pays de Brest', 'Cyclisme', 'endurance',
   '2026-05-24T08:00:00', 'Brest', 'Parc à Chaînes', 48.3826, -4.4758,
   'finistere', 'brittany',
   'Grande cyclosportive au départ du Parc à Chaînes. 3 parcours : 60 km, 100 km et 150 km. Le 150 km passe par la presqu''île de Crozon et les falaises de Camaret. Chronométrage officiel.',
   'Tout public', 'friendly', '', '', NULL, NULL, NULL, 'seed'),

  ('18',
   'Saint-Pol-de-Léon FC vs ASC Carhaix', 'Football', 'football',
   '2026-05-24T15:00:00', 'Saint-Pol-de-Léon', 'Stade municipal', 48.6849, -3.9848,
   'finistere', 'brittany',
   'Rencontre de Promotion de Ligue entre les Léonards et les Carhaisiens. Saint-Pol cherche à rejoindre la Division Honneur, Carhaix veut consolider sa place dans le top 5.',
   'Amateur', 'championship', '', '', NULL, NULL,
   '{"home":{"team":"Saint-Pol-de-Léon FC","rank":2,"points":52,"played":28,"wins":16,"draws":4,"losses":8},"away":{"team":"ASC Carhaix","rank":4,"points":42,"played":28,"wins":12,"draws":6,"losses":10}}'::jsonb,
   'seed'),

  ('19',
   'Rugby Club Quimper vs Brest RC', 'Rugby', 'team',
   '2026-05-23T15:30:00', 'Quimper', 'Stade de la Légion', 47.9957, -4.1024,
   'finistere', 'brittany',
   'Demi-finale Fédérale 3 - sens inverse. RC Quimper reçoit le RC Brest dans ce remake du derby finistérien. Le vainqueur rejoint la finale et rêve d''une montée en Fédérale 2.',
   'Amateur', 'championship', '', '', NULL, NULL,
   '{"home":{"team":"RC Quimper","rank":4,"points":55,"played":19,"wins":10,"draws":5,"losses":4},"away":{"team":"Rugby Club Brestois","rank":1,"points":72,"played":19,"wins":15,"draws":0,"losses":4}}'::jsonb,
   'seed'),

  ('20',
   'Trail des Korrigans', 'Trail', 'endurance',
   '2026-05-23T09:00:00', 'Carhaix', 'Départ Centre ville', 48.2776, -3.5729,
   'finistere', 'brittany',
   'Trail mythique dans les Monts d''Arrée. 3 distances : 15 km, 30 km et 50 km avec un dénivelé important. Version nocturne disponible pour le 15 km le samedi soir (lampe frontale obligatoire).',
   'Tout public', 'friendly', '', '', NULL, NULL, NULL, 'seed'),

  ('21',
   'Concarneau Basket vs Quimper Basket', 'Basketball', 'team',
   '2026-05-23T18:00:00', 'Concarneau', 'Salle Omnisports', 47.8726, -3.9206,
   'finistere', 'brittany',
   'Finale du Championnat Régional Bretagne de basket. Deux équipes séparées de seulement 2 points en saison régulière. Ce match unique décidera du champion de Bretagne.',
   'Régional', 'championship', '', '', NULL, NULL,
   '{"home":{"team":"Concarneau Basket","rank":1,"points":null,"played":20,"wins":14,"draws":0,"losses":6},"away":{"team":"Quimper Basket","rank":2,"points":null,"played":20,"wins":13,"draws":0,"losses":7}}'::jsonb,
   'seed'),

  ('22',
   'US Pont-l''Abbé vs Morlaix FC', 'Football', 'football',
   '2026-05-24T17:00:00', 'Pont-l''Abbé', 'Stade Langoz', 47.8665, -4.2215,
   'finistere', 'brittany',
   'Rencontre entre deux équipes aux profils opposés : Pont-l''Abbé se bat pour sa survie en Division Honneur, Morlaix lutte encore pour le podium. Un match à rebondissements attendu.',
   'Amateur', 'championship', '', '', NULL, NULL,
   '{"home":{"team":"US Pont-l''Abbé","rank":9,"points":36,"played":29,"wins":10,"draws":6,"losses":13},"away":{"team":"Morlaix FC","rank":4,"points":47,"played":29,"wins":14,"draws":5,"losses":10}}'::jsonb,
   'seed')

ON CONFLICT (static_id) DO NOTHING;

-- ────────────────────────────────────────────────────────────
-- 6. Events — semaine du 25 mai + weekend 30-31 mai
-- ────────────────────────────────────────────────────────────

INSERT INTO public.events
  (static_id, title, sport, sport_group, date, city, venue, lat, lng,
   department_id, region_id, description, level, event_type,
   team_name, category, club_id, club_name, standings, source)
VALUES
  ('23',
   'Brest Handball vs HBC Douarnenez', 'Handball', 'team',
   '2026-05-27T20:30:00', 'Brest', 'Palais des Sports de Brest', 48.3826, -4.4958,
   'finistere', 'brittany',
   'Dernière journée du Championnat N3. HBC Brest, déjà couronné champion, reçoit HBC Douarnenez dans un match de gala. L''occasion pour les Brestois de fêter leur titre devant leur public.',
   'Régional', 'championship', '', '', NULL, NULL,
   '{"home":{"team":"Brest Handball","rank":1,"points":48,"played":22,"wins":16,"draws":0,"losses":6},"away":{"team":"HBC Douarnenez","rank":8,"points":24,"played":22,"wins":7,"draws":3,"losses":12}}'::jsonb,
   'seed'),

  ('24',
   'Morlaix FC vs FC Landivisiau', 'Football', 'football',
   '2026-05-28T19:00:00', 'Morlaix', 'Stade Marcel Guéguen', 48.5779, -3.8290,
   'finistere', 'brittany',
   'Avant-dernière journée de Division Honneur. Morlaix accueille Landivisiau dans un match que les deux équipes ont besoin de gagner pour leurs objectifs respectifs de fin de saison.',
   'Amateur', 'championship', '', '', NULL, NULL,
   '{"home":{"team":"Morlaix FC","rank":4,"points":47,"played":29,"wins":14,"draws":5,"losses":10},"away":{"team":"FC Landivisiau","rank":7,"points":40,"played":29,"wins":12,"draws":4,"losses":13}}'::jsonb,
   'seed'),

  ('25',
   'Course de la Pointe du Raz', 'Running', 'endurance',
   '2026-05-31T09:00:00', 'Plogoff', 'Départ Pointe du Raz', 48.0381, -4.7255,
   'finistere', 'brittany',
   'Course nature spectaculaire sur les sentiers côtiers de la Pointe du Raz. 10 km et 21 km avec une vue imprenable sur la mer d''Iroise. Parcours vallonné, chaussures trail recommandées.',
   'Tout public', 'friendly', '', '', NULL, NULL, NULL, 'seed'),

  ('26',
   'US Brest vs AS Plabennec', 'Football', 'football',
   '2026-05-31T15:00:00', 'Brest', 'Stade Francis-Le Blé', 48.3904, -4.4861,
   'finistere', 'brittany',
   'Journée décisive pour le titre en Division Honneur Bretagne. US Brest peut décrocher le championnat en cas de victoire combinée à un faux-pas du leader. Stade Francis-Le Blé en feu.',
   'Amateur', 'championship', '', '', NULL, NULL,
   '{"home":{"team":"US Brest","rank":2,"points":57,"played":30,"wins":18,"draws":3,"losses":9},"away":{"team":"AS Plabennec","rank":6,"points":44,"played":30,"wins":13,"draws":5,"losses":12}}'::jsonb,
   'seed'),

  ('27',
   'Tournoi de Basket de Landerneau', 'Basketball', 'team',
   '2026-05-30T09:00:00', 'Landerneau', 'Salle Kéroual', 48.4498, -4.2504,
   'finistere', 'brittany',
   'Tournoi inter-clubs sur une journée complète. Catégories U18 (matin) et Seniors (après-midi). 8 équipes au programme. Entrée libre, restauration sur place. Finale prévue à 17h.',
   'Amateur', 'friendly', '', '', NULL, NULL, NULL, 'seed'),

  ('28',
   'Quimper Cornouaille FC vs Douarnenez FC', 'Football', 'football',
   '2026-05-30T15:00:00', 'Quimper', 'Stade de Penn ar Ru', 47.9892, -4.1080,
   'finistere', 'brittany',
   'Barrage maintien en Division Honneur. Douarnenez, en grande difficulté, se déplace à Quimper dans un match qui pourrait sceller son sort. Quimper de son côté assure sa place dans le top 5.',
   'Amateur', 'championship', '', '', NULL, NULL,
   '{"home":{"team":"Quimper Cornouaille FC","rank":3,"points":53,"played":30,"wins":16,"draws":5,"losses":9},"away":{"team":"Douarnenez FC","rank":13,"points":28,"played":30,"wins":8,"draws":4,"losses":18}}'::jsonb,
   'seed'),

  ('29',
   'Trail Finistère Extrême', 'Trail', 'endurance',
   '2026-05-30T07:00:00', 'Brest', 'Départ Pointe de Pen Hir', 48.2497, -4.5696,
   'finistere', 'brittany',
   'Le trail côtier le plus exigeant du Finistère. 3 formats : 25 km, 45 km et 70 km (Ultra). Dénivelé cumulé jusqu''à 2800m sur le 70 km. Obligatoire : sac avec eau, coupe-vent et couverture de survie.',
   'Tout public', 'friendly', '', '', NULL, NULL, NULL, 'seed'),

  ('30',
   'RC Brest vs RC Concarneau', 'Rugby', 'team',
   '2026-05-31T16:00:00', 'Brest', 'Stade du Bouguen', 48.3750, -4.4621,
   'finistere', 'brittany',
   'Finale départementale Fédérale 3 ! RC Brest accueille RC Concarneau pour le titre de champion du Finistère. Le vainqueur se qualifie pour les phases nationales de montée en Fédérale 2.',
   'Amateur', 'championship', '', '', NULL, NULL,
   '{"home":{"team":"Rugby Club Brestois","rank":1,"points":74,"played":20,"wins":15,"draws":0,"losses":5},"away":{"team":"RC Concarneau","rank":2,"points":68,"played":20,"wins":13,"draws":2,"losses":5}}'::jsonb,
   'seed')

ON CONFLICT (static_id) DO NOTHING;

-- ────────────────────────────────────────────────────────────
-- 7. Events — semaine du 1er juin + weekend 6-7 juin
-- ────────────────────────────────────────────────────────────

INSERT INTO public.events
  (static_id, title, sport, sport_group, date, city, venue, lat, lng,
   department_id, region_id, description, level, event_type,
   team_name, category, club_id, club_name, standings, source)
VALUES
  ('31',
   'Morlaix Handball vs HBC Brest', 'Handball', 'team',
   '2026-06-03T20:00:00', 'Morlaix', 'Salle de Kervéguen', 48.5779, -3.8290,
   'finistere', 'brittany',
   'Match aller des play-offs N3 entre Morlaix et le champion HBC Brest. Morlaix, surprenant outsider, tentera de créer l''exploit face à des Brestois portés par leur titre de champion.',
   'Régional', 'championship', '', '', NULL, NULL,
   '{"home":{"team":"Morlaix Handball","rank":3,"points":36,"played":24,"wins":11,"draws":3,"losses":10},"away":{"team":"HBC Brest","rank":1,"points":50,"played":24,"wins":16,"draws":2,"losses":6}}'::jsonb,
   'seed'),

  ('32',
   'ASC Carhaix vs Saint-Pol-de-Léon FC', 'Football', 'football',
   '2026-06-04T19:00:00', 'Carhaix', 'Stade de Carhaix', 48.2776, -3.5729,
   'finistere', 'brittany',
   'Barrage de montée en Promotion de Ligue. Le vainqueur de ce duel accédera à la Division Honneur Bretagne. Un match à élimination directe entre deux équipes qui ont tout joué cette saison.',
   'Amateur', 'championship', '', '', NULL, NULL,
   '{"home":{"team":"ASC Carhaix","rank":3,"points":46,"played":30,"wins":13,"draws":7,"losses":10},"away":{"team":"Saint-Pol-de-Léon FC","rank":2,"points":55,"played":30,"wins":17,"draws":4,"losses":9}}'::jsonb,
   'seed'),

  ('33',
   'Triathlon de Brest', 'Triathlon', 'endurance',
   '2026-06-06T07:30:00', 'Brest', 'Plage du Moulin Blanc', 48.3874, -4.4198,
   'finistere', 'brittany',
   'Triathlon officiel en rade de Brest. 3 formats : S (750m nage / 20km vélo / 5km cap), M (1,5km / 40km / 10km) et XL (3km / 80km / 20km). Eau à 16°C prévue, combinaison autorisée.',
   'Tout public', 'friendly', '', '', NULL, NULL, NULL, 'seed'),

  ('34',
   'Landivisiau FC vs Quimper Cornouaille FC', 'Football', 'football',
   '2026-06-07T15:00:00', 'Landivisiau', 'Stade de Kerjean', 48.5095, -4.0664,
   'finistere', 'brittany',
   'Dernière journée de la saison en Division Honneur Bretagne. Landivisiau reçoit Quimper dans un match sans enjeu pour les deux équipes, mais qui clôturera une belle saison.',
   'Amateur', 'championship', '', '', NULL, NULL,
   '{"home":{"team":"Landivisiau FC","rank":7,"points":40,"played":31,"wins":12,"draws":4,"losses":15},"away":{"team":"Quimper Cornouaille FC","rank":3,"points":53,"played":31,"wins":16,"draws":5,"losses":10}}'::jsonb,
   'seed'),

  ('35',
   'Grand Prix Cycliste du Finistère', 'Cyclisme', 'endurance',
   '2026-06-06T10:00:00', 'Quimper', 'Départ Stade de Cornouaille', 47.9892, -4.1080,
   'finistere', 'brittany',
   'Course cycliste régionale avec engagement de coureurs Elite et Amateurs 1ère catégorie. Circuit de 8 km à réaliser 15 fois (120 km). Arrivée en peloton ou en solitaire au sprint final.',
   'Régional', 'friendly', '', '', NULL, NULL, NULL, 'seed'),

  ('36',
   'HBC Quimper vs HBC Concarneau', 'Handball', 'team',
   '2026-06-06T18:00:00', 'Quimper', 'Gymnase de Penhars', 47.9757, -4.1125,
   'finistere', 'brittany',
   'Match aller de play-off N3 au Gymnase de Penhars. HBC Quimper, favori sur son terrain, doit prendre le large avant le retour à Concarneau. Ambiance attendue dans cette salle vite chauffée.',
   'Régional', 'championship', '', '', NULL, NULL,
   '{"home":{"team":"HBC Quimper","rank":2,"points":40,"played":24,"wins":13,"draws":1,"losses":10},"away":{"team":"HBC Concarneau","rank":4,"points":32,"played":24,"wins":10,"draws":2,"losses":12}}'::jsonb,
   'seed'),

  ('37',
   '10 km de Concarneau', 'Running', 'endurance',
   '2026-06-07T09:30:00', 'Concarneau', 'Départ Ville Close', 47.8726, -3.9206,
   'finistere', 'brittany',
   'Course urbaine emblématique autour de la ville close de Concarneau. Parcours plat et rapide longeant le port de pêche. Ambiance festive, musique tout au long du parcours. Remise des prix à 12h.',
   'Tout public', 'friendly', '', '', NULL, NULL, NULL, 'seed'),

  ('38',
   'Rugby Club Morlaix vs RC Landerneau', 'Rugby', 'team',
   '2026-06-07T15:00:00', 'Morlaix', 'Stade de la Boissière', 48.5779, -3.8290,
   'finistere', 'brittany',
   'Finale de promotion Fédérale 3 entre Morlaix et Landerneau. Le gagnant accèdera à la Fédérale 2 la saison prochaine. Une finale inédite entre deux équipes du nord-Finistère !',
   'Amateur', 'championship', '', '', NULL, NULL,
   '{"home":{"team":"Rugby Club Morlaix","rank":2,"points":65,"played":20,"wins":12,"draws":5,"losses":3},"away":{"team":"RC Landerneau","rank":3,"points":60,"played":20,"wins":11,"draws":3,"losses":6}}'::jsonb,
   'seed'),

  ('39',
   'Châteaulin FC vs Pont-l''Abbé FC', 'Football', 'football',
   '2026-06-07T16:00:00', 'Châteaulin', 'Stade de Châteaulin', 48.1924, -4.0888,
   'finistere', 'brittany',
   'Avant-dernière journée de Promotion de Ligue. Châteaulin cherche à finir dans le top 3 synonyme de montée, Pont-l''Abbé joue sa survie dans la division. Match à fort enjeu.',
   'Amateur', 'championship', '', '', NULL, NULL,
   '{"home":{"team":"Châteaulin FC","rank":3,"points":49,"played":30,"wins":15,"draws":4,"losses":11},"away":{"team":"Pont-l''Abbé FC","rank":12,"points":24,"played":30,"wins":6,"draws":6,"losses":18}}'::jsonb,
   'seed'),

  ('40',
   'Raid Multisports du Finistère', 'Trail', 'endurance',
   '2026-06-06T08:00:00', 'Châteaulin', 'Départ Stade Parc Lann', 48.1924, -4.0888,
   'finistere', 'brittany',
   'Raid aventure en équipes de 2 combinant trail (15 km), VTT (30 km) et kayak (8 km) sur l''Aulne. Classement par temps cumulé. Départ toutes les 10 min de 8h à 10h. Remise des prix le soir.',
   'Tout public', 'friendly', '', '', NULL, NULL, NULL, 'seed')

ON CONFLICT (static_id) DO NOTHING;

-- ────────────────────────────────────────────────────────────
-- 8. Events — US Concarneau (Seniors 1 / Réserve / U19 / Féminines)
-- ────────────────────────────────────────────────────────────

INSERT INTO public.events
  (static_id, title, sport, sport_group, date, city, venue, lat, lng,
   department_id, region_id, description, level, event_type,
   team_name, category, club_id, club_name, standings, source)
VALUES
  ('101',
   'US Concarneau vs Stade Briochin', 'Football', 'football',
   '2026-05-17T20:00:00', 'Concarneau', 'Stade Guy Piriou', 47.8691, -3.9185,
   'finistere', 'brittany',
   'Journée 32 de National 2 Groupe B. L''USC, dans la course au maintien, reçoit le Stade Briochin (Saint-Brieuc) dans une rencontre décisive. L''ambiance du Guy Piriou s''annonce chaude pour ce derby breton.',
   'National 2', 'championship', 'Seniors 1', '', 'usc-29', 'US Concarneau',
   '{"home":{"team":"US Concarneau","rank":9,"points":38,"played":31,"wins":10,"draws":8,"losses":13},"away":{"team":"Stade Briochin","rank":11,"points":33,"played":31,"wins":9,"draws":6,"losses":16}}'::jsonb,
   'seed'),

  ('102',
   'Vannes OC vs US Concarneau', 'Football', 'football',
   '2026-05-24T18:00:00', 'Vannes', 'Stade de la Rabine', 47.6561, -2.7745,
   'morbihan', 'brittany',
   'Déplacement difficile pour l''USC à Vannes. Le Vannes OC, en bonne position pour le top 6, reçoit des Concarnois qui ont besoin des 3 points pour assurer leur maintien en National 2.',
   'National 2', 'championship', 'Seniors 1', '', 'usc-29', 'US Concarneau',
   '{"home":{"team":"Vannes OC","rank":5,"points":54,"played":32,"wins":16,"draws":6,"losses":10},"away":{"team":"US Concarneau","rank":9,"points":38,"played":32,"wins":10,"draws":8,"losses":14}}'::jsonb,
   'seed'),

  ('103',
   'US Concarneau vs SO Romorantin', 'Football', 'football',
   '2026-05-31T17:00:00', 'Concarneau', 'Stade Guy Piriou', 47.8691, -3.9185,
   'finistere', 'brittany',
   'Dernière journée de National 2. L''USC reçoit Romorantin lors d''une soirée qui pourrait tout décider. Match à vivre en direct au Guy Piriou — tous en bleu !',
   'National 2', 'championship', 'Seniors 1', '', 'usc-29', 'US Concarneau',
   '{"home":{"team":"US Concarneau","rank":9,"points":38,"played":33,"wins":10,"draws":8,"losses":15},"away":{"team":"SO Romorantin","rank":14,"points":27,"played":33,"wins":7,"draws":6,"losses":20}}'::jsonb,
   'seed'),

  ('104',
   'USC Réserve vs AS Plabennec', 'Football', 'football',
   '2026-05-18T15:00:00', 'Concarneau', 'Terrain annexe Guy Piriou', 47.8688, -3.9190,
   'finistere', 'brittany',
   'J28 de Division Honneur Bretagne. Derby entre la réserve concarnoise et le club plabennecois dans un match que les deux équipes jouent à fond pour le classement final.',
   'Division Honneur Bretagne', 'championship', 'Réserve', '', 'usc-29', 'US Concarneau',
   '{"home":{"team":"USC Réserve","rank":4,"points":46,"played":27,"wins":14,"draws":4,"losses":9},"away":{"team":"AS Plabennec","rank":7,"points":38,"played":27,"wins":11,"draws":5,"losses":11}}'::jsonb,
   'seed'),

  ('105',
   'FC Landivisiau vs USC Réserve', 'Football', 'football',
   '2026-05-25T15:00:00', 'Landivisiau', 'Stade de Pen Ar Roz', 48.5095, -4.0640,
   'finistere', 'brittany',
   'Déplacement de la réserve de l''USC à Landivisiau pour l''avant-dernière journée. Le FC Landivisiau joue sa survie en DH face à une équipe concarnoise solide.',
   'Division Honneur Bretagne', 'championship', 'Réserve', '', 'usc-29', 'US Concarneau',
   '{"home":{"team":"FC Landivisiau","rank":12,"points":24,"played":28,"wins":6,"draws":6,"losses":16},"away":{"team":"USC Réserve","rank":4,"points":49,"played":28,"wins":15,"draws":4,"losses":9}}'::jsonb,
   'seed'),

  ('106',
   'USC U19 vs Quimper Cornouaille FC U19', 'Football', 'football',
   '2026-05-17T14:30:00', 'Concarneau', 'Terrain annexe Guy Piriou', 47.8688, -3.9190,
   'finistere', 'brittany',
   'Derby finistérien entre les U19 de l''USC et du QCFC. Deux équipes de valeur pour un match de championnat qui s''annonce serré et technique.',
   'U19 Régional Bretagne', 'championship', 'U19', '', 'usc-29', 'US Concarneau',
   NULL, 'seed'),

  ('107',
   'USC U19 vs Brest Armorique FC U19', 'Football', 'football',
   '2026-05-31T14:00:00', 'Concarneau', 'Terrain annexe Guy Piriou', 47.8688, -3.9190,
   'finistere', 'brittany',
   'Dernière journée de championnat U19 pour l''USC, qui reçoit Brest Armorique avec l''objectif de finir sur une note positive et de décrocher la 2e place du groupe.',
   'U19 Régional Bretagne', 'championship', 'U19', '', 'usc-29', 'US Concarneau',
   NULL, 'seed'),

  ('108',
   'USC Féminines vs Entente Sportive Pays Bigouden', 'Football', 'football',
   '2026-05-24T14:30:00', 'Concarneau', 'Stade Guy Piriou', 47.8691, -3.9185,
   'finistere', 'brittany',
   'Avant-dernière journée pour les Féminines de l''USC qui reçoivent l''ESPB dans un match à forts enjeux. Objectif top 3 pour se qualifier en barrages de montée en D1 Fédérale.',
   'Division 2 Fédérale Féminine', 'championship', 'Féminines 1', '', 'usc-29', 'US Concarneau',
   '{"home":{"team":"USC Féminines","rank":3,"points":44,"played":17,"wins":14,"draws":2,"losses":1},"away":{"team":"ESPB Féminines","rank":6,"points":28,"played":17,"wins":9,"draws":1,"losses":7}}'::jsonb,
   'seed'),

  ('109',
   'US Lorient Féminines vs USC Féminines', 'Football', 'football',
   '2026-05-31T15:00:00', 'Lorient', 'Stade du Moustoir — terrain annexe', 47.7492, -3.3738,
   'morbihan', 'brittany',
   'Déplacement décisif à Lorient pour la dernière journée. L''USC Féminines peut décrocher la qualification en barrages en cas de victoire ou de nul. Match à vivre en direct !',
   'Division 2 Fédérale Féminine', 'championship', 'Féminines 1', '', 'usc-29', 'US Concarneau',
   '{"home":{"team":"US Lorient Féminines","rank":2,"points":47,"played":18,"wins":15,"draws":2,"losses":1},"away":{"team":"USC Féminines","rank":3,"points":44,"played":18,"wins":14,"draws":2,"losses":2}}'::jsonb,
   'seed')

ON CONFLICT (static_id) DO NOTHING;

-- ────────────────────────────────────────────────────────────
-- 9. Events — AS Plabennec
-- ────────────────────────────────────────────────────────────

INSERT INTO public.events
  (static_id, title, sport, sport_group, date, city, venue, lat, lng,
   department_id, region_id, description, level, event_type,
   team_name, category, club_id, club_name, standings, source)
VALUES
  ('110',
   'AS Plabennec vs FC Landerneau', 'Football', 'football',
   '2026-05-18T15:00:00', 'Plabennec', 'Stade de l''Aber Ildut', 48.4847, -4.4296,
   'finistere', 'brittany',
   'Plabennec reçoit Landerneau pour un match de milieu de tableau. L''ASPL cherche à consolider sa 7e place avant la trêve estivale.',
   'Division Honneur Bretagne', 'championship', 'Seniors 1', '', '5', 'AS Plabennec',
   '{"home":{"team":"AS Plabennec","rank":7,"points":38,"played":27,"wins":11,"draws":5,"losses":11},"away":{"team":"FC Landerneau","rank":9,"points":33,"played":27,"wins":9,"draws":6,"losses":12}}'::jsonb,
   'seed'),

  ('111',
   'AS Plabennec vs Morlaix FC', 'Football', 'football',
   '2026-05-25T15:00:00', 'Plabennec', 'Stade de l''Aber Ildut', 48.4847, -4.4296,
   'finistere', 'brittany',
   'Derby entre voisins finistériens. Plabennec reçoit Morlaix pour l''avant-dernière journée de Division Honneur dans un match aux enjeux classement.',
   'Division Honneur Bretagne', 'championship', 'Seniors 1', '', '5', 'AS Plabennec',
   NULL, 'seed')

ON CONFLICT (static_id) DO NOTHING;

-- ============================================================
-- Vérification finale
-- ============================================================

SELECT 'clubs' AS table_name, COUNT(*) AS seed_count
  FROM public.clubs WHERE source = 'seed'
UNION ALL
SELECT 'events', COUNT(*)
  FROM public.events WHERE source = 'seed'
ORDER BY table_name;
