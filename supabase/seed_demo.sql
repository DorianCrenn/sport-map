-- ============================================================
-- SportLink — Seed démo complet (juin–août 2026)
-- Objectif : app qui ressemble à une vraie utilisation
-- Prérequis : seed.sql + seed_recette.sql + toutes les migrations
-- Idempotent — ON CONFLICT DO NOTHING sur static_id
-- Exécuter dans : Supabase Dashboard → SQL Editor
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. SCORES — matchs passés (mai → 6 juin 2026)
-- ─────────────────────────────────────────────────────────────

UPDATE public.events SET score = '{"home":2,"away":1}'::jsonb WHERE static_id = '1';   -- US Brest 2-1 FC Landivisiau
UPDATE public.events SET score = '{"home":1,"away":0}'::jsonb WHERE static_id = '2';   -- ASC Carhaix 1-0 Stade Quimperlois
UPDATE public.events SET score = '{"home":28,"away":22}'::jsonb WHERE static_id = '4'; -- HBC Brest 28-22 HBC Guipavas
UPDATE public.events SET score = '{"home":1,"away":1}'::jsonb WHERE static_id = '5';   -- US Brest 1-1 Quimper CFC
UPDATE public.events SET score = '{"home":82,"away":71}'::jsonb WHERE static_id = '6'; -- Landerneau 82-71 Quimper Basket
UPDATE public.events SET score = '{"home":1,"away":2}'::jsonb WHERE static_id = '8';   -- Morlaix 1-2 AS Plabennec
UPDATE public.events SET score = '{"home":24,"away":17}'::jsonb WHERE static_id = '9'; -- RC Brestois 24-17 RC Quimper
UPDATE public.events SET score = '{"home":28,"away":25}'::jsonb WHERE static_id = '11';-- HBC Concarneau 28-25 Morlaix HB
UPDATE public.events SET score = '{"home":2,"away":1}'::jsonb WHERE static_id = '12';  -- Douarnenez 2-1 Pont-l''Abbé
UPDATE public.events SET score = '{"home":2,"away":2}'::jsonb WHERE static_id = '13';  -- Quimper CFC 2-2 Morlaix FC
UPDATE public.events SET score = '{"home":78,"away":68}'::jsonb WHERE static_id = '15';-- Landerneau 78-68 Brest Basket
UPDATE public.events SET score = '{"home":3,"away":0}'::jsonb WHERE static_id = '16';  -- AS Plabennec 3-0 Douarnenez
UPDATE public.events SET score = '{"home":2,"away":0}'::jsonb WHERE static_id = '18';  -- Saint-Pol 2-0 ASC Carhaix
UPDATE public.events SET score = '{"home":15,"away":21}'::jsonb WHERE static_id = '19';-- RC Quimper 15-21 Brest RC
UPDATE public.events SET score = '{"home":72,"away":68}'::jsonb WHERE static_id = '21';-- Concarneau Basket 72-68 Quimper
UPDATE public.events SET score = '{"home":0,"away":1}'::jsonb WHERE static_id = '22';  -- Pont-l''Abbé 0-1 Morlaix
UPDATE public.events SET score = '{"home":35,"away":24}'::jsonb WHERE static_id = '23';-- Brest HB 35-24 Douarnenez
UPDATE public.events SET score = '{"home":2,"away":1}'::jsonb WHERE static_id = '24';  -- Morlaix 2-1 FC Landivisiau
UPDATE public.events SET score = '{"home":2,"away":0}'::jsonb WHERE static_id = '26';  -- US Brest 2-0 AS Plabennec

-- man_of_match pour quelques matchs marquants
UPDATE public.events SET man_of_match = 'Yann Brénéol' WHERE static_id = '1';
UPDATE public.events SET man_of_match = 'Erwan Le Goff' WHERE static_id = '8';
UPDATE public.events SET man_of_match = 'Théo Prigent'  WHERE static_id = '26';

-- ─────────────────────────────────────────────────────────────
-- 2. NOUVEAUX ÉVÉNEMENTS — semaine du 7 juin 2026
-- Journée 30 de Division Honneur Bretagne + autres sports
-- ─────────────────────────────────────────────────────────────

INSERT INTO public.events
  (static_id, title, sport, date, city, venue, lat, lng,
   description, level, event_type, team_name, adversaire,
   home_or_away, standings, club_id, source)
VALUES

  -- Football J30 — dimanche 7 juin
  ('demo-001',
   'Stade Brestois FC vs FC Landivisiau', 'Football',
   '2026-06-07T15:00:00', 'Brest', 'Stade Francis-Le Blé', 48.3904, -4.4861,
   'Journée 30 et avant-dernière de la saison en Division Honneur Bretagne. Le SBF, leader avec 3 points d''avance, peut se rapprocher du titre en cas de victoire. FC Landivisiau joue sa sauvegarde.',
   'Amateur', 'championship', 'Stade Brestois FC', 'FC Landivisiau', 'home',
   '{"home":{"team":"Stade Brestois FC","rank":1,"points":63,"played":29,"wins":20,"draws":3,"losses":6},"away":{"team":"FC Landivisiau","rank":11,"points":27,"played":29,"wins":7,"draws":6,"losses":16}}'::jsonb,
   (SELECT id::text FROM public.clubs WHERE static_id = 'sbf-29'), 'seed_demo'),

  ('demo-002',
   'AS Plabennec vs Quimper Cornouaille FC', 'Football',
   '2026-06-07T15:00:00', 'Plabennec', 'Stade de Kerhuel', 48.4749, -4.4163,
   'Choc du haut de tableau entre Plabennec (4e) et Quimper (2e). Les Cornouaillards ont besoin des 3 points pour rester en course pour le titre. Match à enjeu maximal.',
   'Amateur', 'championship', 'AS Plabennec', 'Quimper Cornouaille FC', 'home',
   '{"home":{"team":"AS Plabennec","rank":4,"points":50,"played":29,"wins":15,"draws":5,"losses":9},"away":{"team":"Quimper Cornouaille FC","rank":2,"points":60,"played":29,"wins":18,"draws":6,"losses":5}}'::jsonb,
   NULL, 'seed_demo'),

  ('demo-003',
   'FC Plougastel-Daoulas vs Morlaix FC', 'Football',
   '2026-06-07T15:00:00', 'Plougastel-Daoulas', 'Stade de Kermaria', 48.3732, -4.3769,
   'Match de milieu de tableau entre deux clubs du Finistère. FC Plougastel reçoit Morlaix FC dans un duel entre équipes qui jouent pour l''honneur en cette fin de saison.',
   'Amateur', 'championship', 'FC Plougastel-Daoulas', 'Morlaix FC', 'home',
   '{"home":{"team":"FC Plougastel","rank":7,"points":41,"played":29,"wins":12,"draws":5,"losses":12},"away":{"team":"Morlaix FC","rank":5,"points":48,"played":29,"wins":14,"draws":6,"losses":9}}'::jsonb,
   (SELECT id::text FROM public.clubs WHERE static_id = 'rec-fc-plougastel'), 'seed_demo'),

  -- Handball — Finale play-offs N3 Bretagne
  ('demo-004',
   'HBC Brest Métropole vs HB Landerneau', 'Handball',
   '2026-06-07T20:30:00', 'Brest', 'Palais des Sports de Brest', 48.3826, -4.4958,
   'Finale des play-offs N3 Bretagne. HBC Brest, champion de la saison régulière, reçoit HB Landerneau dans ce match décisif. Entrée libre pour les supporters brestois. Ambiance garantie !',
   'Régional', 'championship', 'HBC Brest Métropole', 'HB Landerneau', 'home',
   '{"home":{"team":"HBC Brest Métropole","rank":1,"points":52,"played":24,"wins":17,"draws":1,"losses":6},"away":{"team":"HB Landerneau","rank":2,"points":46,"played":24,"wins":15,"draws":1,"losses":8}}'::jsonb,
   (SELECT id::text FROM public.clubs WHERE static_id = 'hbcbm-29'), 'seed_demo'),

  -- Basketball — Finale Championnat Régional Bretagne
  ('demo-005',
   'Landerneau Bretagne BB vs CB Quimper', 'Basketball',
   '2026-06-07T18:00:00', 'Landerneau', 'Salle Kéroual', 48.4498, -4.2504,
   'Finale du Championnat Régional de Basketball Bretagne. Landerneau et Quimper se retrouvent après une demi-finale haletante. Le vainqueur remporte le titre régional 2025-2026.',
   'Régional', 'championship', 'Landerneau Bretagne BB', 'CB Quimper', 'home',
   '{"home":{"team":"Landerneau Bretagne BB","rank":1,"points":null,"played":22,"wins":17,"draws":0,"losses":5},"away":{"team":"CB Quimper","rank":2,"points":null,"played":22,"wins":15,"draws":0,"losses":7}}'::jsonb,
   NULL, 'seed_demo'),

  -- Rugby — Finale Fédérale 3 Bretagne
  ('demo-006',
   'Rugby Club de Brest vs RC Vannes B', 'Rugby',
   '2026-06-07T16:00:00', 'Brest', 'Stade Lavalot', 48.3750, -4.4621,
   'Grande finale de la Fédérale 3 Bretagne. Le RC Brest, impressionnant tout au long de la saison, dispute le titre régional face au RC Vannes B. En cas de victoire, une montée en Fédérale 2.',
   'Amateur', 'championship', 'Rugby Club de Brest', 'RC Vannes B', 'home',
   '{"home":{"team":"Rugby Club de Brest","rank":1,"points":82,"played":20,"wins":16,"draws":0,"losses":4},"away":{"team":"RC Vannes B","rank":2,"points":74,"played":20,"wins":14,"draws":2,"losses":4}}'::jsonb,
   (SELECT id::text FROM public.clubs WHERE static_id = 'rec-rc-brest'), 'seed_demo')

ON CONFLICT (static_id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- 3. NOUVEAUX ÉVÉNEMENTS — 8-14 juin 2026
-- ─────────────────────────────────────────────────────────────

INSERT INTO public.events
  (static_id, title, sport, date, city, venue, lat, lng,
   description, level, event_type, team_name, adversaire,
   home_or_away, standings, source)
VALUES

  -- Trail
  ('demo-010',
   'Trail de la Cornouaille', 'Trail',
   '2026-06-08T08:30:00', 'Quimper', 'Départ Parc de Locmaria', 47.9913, -4.0963,
   'Trail nature sur les sentiers de la cornouaille quimpéroise. Deux distances : 16 km (D+ 320m) et 32 km (D+ 680m). Parcours varié entre landes et bois avec vue sur la baie de Bénodet.',
   'Tout public', 'friendly', 'Trail Club Quimper', '', 'home', NULL, 'seed_demo'),

  -- Cyclisme
  ('demo-011',
   'Sortie VCB — Circuit du Léon', 'Cyclisme',
   '2026-06-08T09:00:00', 'Brest', 'Parc à Chaînes — Parking vélos', 48.3826, -4.4758,
   'Sortie hebdomadaire du Vélo Club Brestois. Circuit du Léon : 95 km avec passage par Landerneau, Saint-Renan et la Pointe Saint-Mathieu. Allure de 28-32 km/h. Casque obligatoire.',
   'Loisir', 'friendly', 'Vélo Club Brestois', '', 'home', NULL, 'seed_demo'),

  -- Football — J31 (dernière journée de saison)
  ('demo-012',
   'Stade Brestois FC vs Quimper Cornouaille FC', 'Football',
   '2026-06-14T15:00:00', 'Brest', 'Stade Francis-Le Blé', 48.3904, -4.4861,
   'Dernière journée de Division Honneur Bretagne 2025-2026 ! Le SBF peut sacrer son titre de champion en cas de victoire. Quimper doit gagner ET espérer un faux-pas de Brest pour renverser la situation. Le public attendu en masse.',
   'Amateur', 'championship', 'Stade Brestois FC', 'Quimper Cornouaille FC', 'home',
   '{"home":{"team":"Stade Brestois FC","rank":1,"points":63,"played":30,"wins":20,"draws":3,"losses":7},"away":{"team":"Quimper Cornouaille FC","rank":2,"points":63,"played":30,"wins":19,"draws":6,"losses":5}}'::jsonb,
   'seed_demo'),

  ('demo-013',
   'AS Plabennec vs FC Plougastel-Daoulas', 'Football',
   '2026-06-14T15:00:00', 'Plabennec', 'Stade de Kerhuel', 48.4749, -4.4163,
   'Dernière journée de Division Honneur. AS Plabennec termine sa saison à domicile face à son voisin plougastélien. Derby local qui s''annonce animé entre deux équipes aux ambitions différentes.',
   'Amateur', 'championship', 'AS Plabennec', 'FC Plougastel-Daoulas', 'home',
   '{"home":{"team":"AS Plabennec","rank":4,"points":50,"played":30,"wins":15,"draws":5,"losses":10},"away":{"team":"FC Plougastel","rank":7,"points":44,"played":30,"wins":13,"draws":5,"losses":12}}'::jsonb,
   'seed_demo'),

  ('demo-014',
   'Morlaix FC vs ASC Carhaix', 'Football',
   '2026-06-14T15:00:00', 'Morlaix', 'Stade Marcel Guéguen', 48.5779, -3.8290,
   'Derby du centre-Finistère pour la dernière journée. Morlaix et Carhaix se retrouvent dans une fin de saison sans enjeu particulier mais avec l''honneur comme seul mot d''ordre.',
   'Amateur', 'championship', 'Morlaix FC', 'ASC Carhaix', 'home', NULL, 'seed_demo'),

  -- Handball — début saison été
  ('demo-015',
   'Tournoi Handzone Brest', 'Handball',
   '2026-06-13T09:00:00', 'Brest', 'Palais des Sports de Brest', 48.3826, -4.4958,
   'Tournoi de handball amical 3×3 en salle. Format rapide, matchs de 15 minutes. Catégories U16, U18 et Seniors. Inscription par équipes de 5. Restauration sur place, buvette ouverte. Entrée libre.',
   'Tout public', 'friendly', 'HBC Brest Métropole', '', 'home', NULL, 'seed_demo'),

  -- Running
  ('demo-016',
   'Trail du Menez Hom', 'Trail',
   '2026-06-14T09:00:00', 'Plomodiern', 'Départ Sainte-Marie-du-Ménez-Hom', 48.2313, -4.2413,
   'Incontournable trail au sommet du Menez Hom (330m). Panorama exceptionnel sur la baie de Douarnenez et la Presqu''île de Crozon. Distances : 10 km (D+ 250m), 22 km (D+ 550m), 42 km (D+ 900m).',
   'Tout public', 'friendly', 'Trail Club de Crozon', '', 'home', NULL, 'seed_demo'),

  -- Cyclisme
  ('demo-017',
   'La Cornouaille — Épreuve UCI', 'Cyclisme',
   '2026-06-15T10:30:00', 'Quimper', 'Départ Centre ville Quimper', 47.9960, -4.0975,
   'Épreuve classique du calendrier cycliste breton, inscrite au calendrier UCI. Départ et arrivée à Quimper pour environ 185 km à travers la Cornouaille. Passage par Châteaulin, Pont-Croix et Douarnenez.',
   'Pro', 'championship', 'Organisation Quimper Cyclisme', '', 'home', NULL, 'seed_demo')

ON CONFLICT (static_id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- 4. NOUVEAUX ÉVÉNEMENTS — 15 juin → 31 juillet 2026
-- ─────────────────────────────────────────────────────────────

INSERT INTO public.events
  (static_id, title, sport, date, city, venue, lat, lng,
   description, level, event_type, team_name, adversaire,
   home_or_away, standings, source)
VALUES

  -- Repêchage Football
  ('demo-020',
   'Play-off Maintien — US Pont-l''Abbé vs FC Plouvorn', 'Football',
   '2026-06-18T19:30:00', 'Pont-l''Abbé', 'Stade Langoz', 47.8665, -4.2215,
   'Match de barrage pour le maintien en Division Honneur Bretagne. US Pont-l''Abbé reçoit FC Plouvorn (champion de Départemental 1) dans un match à fort enjeu. Le perdant descend ou reste en bas.',
   'Amateur', 'cup', 'US Pont-l''Abbé', 'FC Plouvorn', 'home', NULL, 'seed_demo'),

  -- Running majeur
  ('demo-021',
   'Semi-marathon de Brest', 'Running',
   '2026-06-21T09:00:00', 'Brest', 'Départ Place de la Liberté', 48.3904, -4.4861,
   'Grand rendez-vous running de l''été brestois. Parcours longeant la Penfeld et les quais avec vue sur la rade. Semi officiel (21,097 km) + 10 km + 5 km famille. Plus de 2000 participants attendus. Chronométrage officiel, T-shirt participant.',
   'Tout public', 'friendly', 'Brest Atlético Club', '', 'home', NULL, 'seed_demo'),

  -- Football amical pré-saison
  ('demo-022',
   'Amical — Stade Brestois FC vs Rennes B', 'Football',
   '2026-07-05T15:00:00', 'Brest', 'Stade Francis-Le Blé', 48.3904, -4.4861,
   'Match amical de préparation pour la saison 2026-2027. Le SBF inaugure sa préparation estivale face à la réserve du Stade Rennais, un adversaire de qualité pour jauger le niveau de l''effectif.',
   'Amateur', 'friendly', 'Stade Brestois FC', 'Stade Rennais B', 'home', NULL, 'seed_demo'),

  ('demo-023',
   'Amical — AS Plabennec vs FC Lesneven', 'Football',
   '2026-07-05T17:00:00', 'Plabennec', 'Stade de Kerhuel', 48.4749, -4.4163,
   'Amical de préparation estivale. AS Plabennec accueille le FC Lesneven pour le premier match de préparation. Entrée libre, buvette ouverte. Occasion pour les supporters de voir les nouvelles recrues.',
   'Amateur', 'friendly', 'AS Plabennec', 'FC Lesneven', 'home', NULL, 'seed_demo'),

  -- Trail
  ('demo-024',
   'Trail des Châteaux des Monts d''Arrée', 'Trail',
   '2026-06-28T08:00:00', 'Huelgoat', 'Départ Lac du Moulin', 48.3623, -3.7451,
   'Trail magique dans la forêt d''Huelgoat et les Monts d''Arrée. Passage par le Rocher du Diable, la Roche Tremblante et le Chaos. Distances : 10 km, 24 km et 45 km. Ambiance mystique garantie.',
   'Tout public', 'friendly', 'Trail Club Huelgoat', '', 'home', NULL, 'seed_demo'),

  ('demo-025',
   'Trail Côtier du Cap Sizun', 'Trail',
   '2026-07-12T09:30:00', 'Audierne', 'Départ Port d''Audierne', 48.0248, -4.5371,
   'Trail spectaculaire sur les sentiers du GR34 entre Audierne et la Pointe du Raz. 18 km (D+ 380m) de sentiers côtiers avec vue permanente sur l''Atlantique. Niveau intermédiaire, balisage bleu.',
   'Tout public', 'friendly', 'Trail Club Cap Sizun', '', 'home', NULL, 'seed_demo'),

  -- Cyclisme
  ('demo-026',
   'Tour du Finistère — Épreuve UCI', 'Cyclisme',
   '2026-07-05T11:00:00', 'Brest', 'Parc à Chaînes', 48.3826, -4.4758,
   'Classique bretonne disputée depuis 1931 et inscrite au calendrier UCI Pro Series. Départ de Brest pour 205 km à travers tout le Finistère. Mur de Hac, Côte de Kersaint, arrivée à Brest au sprint ou par l''échappée.',
   'Pro', 'championship', 'Organisation VCB', '', 'home', NULL, 'seed_demo'),

  ('demo-027',
   'Critérium de Brest — Nocturne cycliste', 'Cyclisme',
   '2026-07-13T20:30:00', 'Brest', 'Circuit du centre-ville', 48.3904, -4.4861,
   'Critérium nocturne en centre-ville de Brest sur un circuit fermé de 1,8 km. 60 tours, sprints intermédiaires, prime à chaque tour. Ambiance de fête avec DJ set et animations. Entrée gratuite pour les spectateurs.',
   'Pro', 'friendly', 'Vélo Club Brestois', '', 'home', NULL, 'seed_demo'),

  -- Running été
  ('demo-028',
   'Nocturne de l''Été à Quimper', 'Running',
   '2026-07-14T21:00:00', 'Quimper', 'Départ Quai de l''Odet', 47.9960, -4.0975,
   'Course nocturne festive à l''occasion du 14 juillet. 8 km sur les bords de l''Odet illuminés. Ambiance festive, pas de sélection, tous niveaux bienvenus. Feux d''artifice après la course.',
   'Tout public', 'friendly', 'Quimper Athlétisme', '', 'home', NULL, 'seed_demo'),

  ('demo-029',
   'Foulées de Douarnenez', 'Running',
   '2026-07-19T09:30:00', 'Douarnenez', 'Départ Port du Rosmeur', 48.0929, -4.3272,
   'Course populaire autour du port de Douarnenez. 6 km et 12 km sur les chemins côtiers. Vue imprenable sur la baie. Familiale et conviviale, ravitaillement en crêpes et cidre à l''arrivée.',
   'Tout public', 'friendly', 'Douarnenez Athlétisme', '', 'home', NULL, 'seed_demo'),

  -- Handball été
  ('demo-030',
   'Tournoi de Handball de la Cornouaille', 'Handball',
   '2026-07-06T09:00:00', 'Quimper', 'Gymnase de Penn ar Ru', 47.9892, -4.1080,
   'Tournoi estival de handball avec des équipes de Bretagne et des Pays de la Loire. Format poules puis finales. Catégories U16 Mixte et Seniors. Ambiance conviviale, entrée libre. Repas breton le soir.',
   'Tout public', 'friendly', 'Quimper Handball', '', 'home', NULL, 'seed_demo'),

  -- Football tournoi été
  ('demo-031',
   'Tournoi des Plages — Football à 7', 'Football',
   '2026-07-19T09:00:00', 'Quimper', 'Stade de Penn ar Ru — terrains annexes', 47.9892, -4.1080,
   'Tournoi estival de football à 7 joueurs. Format détendu, 16 équipes, matchs de 20 minutes. Ambiance conviviale, prix du fair-play. Inscription par équipes complètes. Repas BBQ en soirée.',
   'Tout public', 'friendly', '', '', 'home', NULL, 'seed_demo'),

  -- Trail août
  ('demo-032',
   'Trail du Bout du Monde — Pointe du Raz', 'Trail',
   '2026-08-02T08:00:00', 'Plogoff', 'Parking Pointe du Raz', 48.0381, -4.7255,
   'Trail en bout du monde sur les falaises et landes de la Pointe du Raz. Distances : 8 km (découverte), 18 km (intermédiaire), 36 km (engagé). Panoramas sur l''Atlantique et l''île de Sein. Sentiers GR34.',
   'Tout public', 'friendly', 'Trail Club Cap Sizun', '', 'home', NULL, 'seed_demo'),

  ('demo-033',
   'Trail de la Presqu''île Atlantique', 'Trail',
   '2026-08-09T08:30:00', 'Crozon', 'Parking de Morgat', 48.2481, -4.4912,
   'Trail mythique sur la presqu''île de Crozon. GR34 entre falaises, plages et landes bretonnes. Distances : 12 km, 26 km et 50 km. Le 50 km est le trail le plus technique de Bretagne avec 1100m de dénivelé.',
   'Tout public', 'friendly', 'Trail Club de Crozon', '', 'home', NULL, 'seed_demo'),

  -- Football reprise
  ('demo-034',
   'Amical — HBC Brest Métropole vs HB Saint-Brieuc', 'Handball',
   '2026-08-22T20:00:00', 'Brest', 'Palais des Sports de Brest', 48.3826, -4.4958,
   'Premier match de préparation de la saison 2026-2027 pour HBC Brest Métropole. Face à HB Saint-Brieuc, club des Côtes-d''Armor, pour un derby breton amical avant la reprise du championnat N3.',
   'Régional', 'friendly', 'HBC Brest Métropole', 'HB Saint-Brieuc', 'home', NULL, 'seed_demo'),

  ('demo-035',
   'Tournoi de pré-saison — AS Plabennec', 'Football',
   '2026-08-15T09:00:00', 'Plabennec', 'Stade de Kerhuel', 48.4749, -4.4163,
   'Tournoi de pré-saison organisé par l''AS Plabennec. 4 équipes : AS Plabennec, FC Landivisiau, FC Plouvorn et FC Lesneven. Deux demi-finales le matin, finale l''après-midi. Entrée gratuite.',
   'Amateur', 'friendly', 'AS Plabennec', '', 'home', NULL, 'seed_demo'),

  -- Running août
  ('demo-036',
   'Semi-marathon du Finistère', 'Running',
   '2026-08-23T09:00:00', 'Brest', 'Départ Parc de la Cavale Blanche', 48.3554, -4.4590,
   'Semi-marathon officiel chrono en clôture de la saison estivale. Parcours rapide et plat idéal pour les records personnels. + 10km et 3km enfants. Plus de 1200 dossards, remise de médailles.',
   'Tout public', 'friendly', 'Brest Atlético Club', '', 'home', NULL, 'seed_demo')

ON CONFLICT (static_id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- 5. CLUB PAGES — mini-sites avec contenu réel
-- ─────────────────────────────────────────────────────────────

-- Stade Brestois FC
INSERT INTO public.club_pages (club_id, blocks, typography, theme, updated_at)
SELECT
  (SELECT id::text FROM public.clubs WHERE static_id = 'sbf-29'),
  '[
    {
      "id": "sbf-about",
      "type": "about",
      "width": "1/1",
      "content": {
        "text": "Fondé en 1923, le Stade Brestois FC est l''un des clubs les plus titrés du Finistère. Formateur de nombreux joueurs professionnels, le club évolue en Division Honneur Bretagne avec trois sections compétitives. Nos 385 licenciés évoluent dans un cadre familial et exigeant, porté par des valeurs de respect et de dépassement de soi.",
        "address": "1 Allée des Sports, 29200 Brest",
        "phone": "02 98 44 12 33",
        "email": "contact@sbf-brest.fr",
        "website": "https://sbf-brest.fr",
        "licencePrice": "À partir de 80€/saison selon la catégorie"
      }
    },
    {
      "id": "sbf-sponsors",
      "type": "sponsors",
      "width": "1/1",
      "content": {
        "sponsors": [
          { "name": "Crédit Agricole Finistère", "tier": "gold", "url": "https://www.ca-finistere.fr" },
          { "name": "Brest Métropole", "tier": "silver", "url": "https://www.brest.fr" },
          { "name": "Le Télégramme", "tier": "silver", "url": "https://www.letelegramme.fr" },
          { "name": "Armor Lux", "tier": "bronze", "url": "https://www.armorlux.fr" },
          { "name": "Clinique de l''Iroise", "tier": "partner", "url": "" }
        ]
      }
    },
    {
      "id": "sbf-next",
      "type": "next_match",
      "width": "1/2",
      "content": {}
    },
    {
      "id": "sbf-results",
      "type": "matches",
      "width": "1/2",
      "content": {
        "title": "Derniers résultats",
        "results": [
          { "date": "2026-06-07", "opponent": "FC Landivisiau", "scoreHome": 3, "scoreAway": 0, "location": "Domicile" },
          { "date": "2026-05-31", "opponent": "AS Plabennec", "scoreHome": 2, "scoreAway": 0, "location": "Domicile" },
          { "date": "2026-05-24", "opponent": "Douarnenez FC", "scoreHome": 1, "scoreAway": 1, "location": "Extérieur" },
          { "date": "2026-05-17", "opponent": "Quimper CFC", "scoreHome": 0, "scoreAway": 1, "location": "Extérieur" },
          { "date": "2026-05-10", "opponent": "US Landivisiau", "scoreHome": 2, "scoreAway": 0, "location": "Domicile" }
        ]
      }
    },
    {
      "id": "sbf-trainings",
      "type": "trainings",
      "width": "1/1",
      "content": {
        "title": "Entraînements Seniors 1",
        "sessions": [
          { "day": "Mardi", "time": "19:30", "location": "Stade Francis-Le Blé — Terrain principal", "level": "Division Honneur" },
          { "day": "Jeudi", "time": "19:30", "location": "Stade Francis-Le Blé — Terrain principal", "level": "Division Honneur" },
          { "day": "Samedi", "time": "10:00", "location": "Stade Francis-Le Blé — Terrain annexe", "level": "Travail spécifique" }
        ]
      }
    }
  ]'::jsonb,
  '{"titleFont":"Oswald","bodyFont":"Inter"}'::jsonb,
  '{"primary":"#003087","accent":"#FFD700"}'::jsonb,
  NOW()
WHERE EXISTS (SELECT 1 FROM public.clubs WHERE static_id = 'sbf-29')
ON CONFLICT (club_id) DO UPDATE
  SET blocks = EXCLUDED.blocks,
      typography = EXCLUDED.typography,
      theme = EXCLUDED.theme,
      updated_at = NOW();

-- HBC Brest Métropole
INSERT INTO public.club_pages (club_id, blocks, typography, theme, updated_at)
SELECT
  (SELECT id::text FROM public.clubs WHERE static_id = 'hbcbm-29'),
  '[
    {
      "id": "hbcbm-about",
      "type": "about",
      "width": "1/1",
      "content": {
        "text": "Club de handball incontournable du Finistère depuis 1968. Nos sections masculines et féminines évoluent en N3 National avec un effectif de 310 licenciés. Le HBC Brest Métropole c''est aussi un pôle jeunes très actif, de l''U7 à l''U18, et une section loisir ouverte à tous les adultes débutants.",
        "address": "2 Rue du Palais des Sports, 29200 Brest",
        "phone": "02 98 45 67 89",
        "email": "contact@hbcbrest.fr",
        "website": "https://hbcbrest.fr",
        "licencePrice": "Seniors : 120€ · Jeunes : 70€ · Loisir : 90€"
      }
    },
    {
      "id": "hbcbm-upcoming",
      "type": "upcoming_events",
      "width": "1/2",
      "content": { "title": "Prochains matchs" }
    },
    {
      "id": "hbcbm-results",
      "type": "matches",
      "width": "1/2",
      "content": {
        "title": "Résultats récents",
        "results": [
          { "date": "2026-06-07", "opponent": "HB Landerneau", "scoreHome": 31, "scoreAway": 28, "location": "Domicile" },
          { "date": "2026-05-27", "opponent": "HBC Douarnenez", "scoreHome": 35, "scoreAway": 24, "location": "Domicile" },
          { "date": "2026-05-09", "opponent": "HBC Guipavas", "scoreHome": 28, "scoreAway": 22, "location": "Domicile" }
        ]
      }
    },
    {
      "id": "hbcbm-trainings",
      "type": "trainings",
      "width": "1/1",
      "content": {
        "title": "Créneaux Seniors Masculins",
        "sessions": [
          { "day": "Mardi", "time": "20:00", "location": "Palais des Sports — Salle A", "level": "N3 National" },
          { "day": "Jeudi", "time": "20:00", "location": "Palais des Sports — Salle A", "level": "N3 National" },
          { "day": "Samedi", "time": "10:00", "location": "Palais des Sports — Salle A", "level": "Préparation match" }
        ]
      }
    }
  ]'::jsonb,
  '{"titleFont":"Poppins","bodyFont":"Inter"}'::jsonb,
  '{"primary":"#E30613","accent":"#FFFFFF"}'::jsonb,
  NOW()
WHERE EXISTS (SELECT 1 FROM public.clubs WHERE static_id = 'hbcbm-29')
ON CONFLICT (club_id) DO UPDATE
  SET blocks = EXCLUDED.blocks,
      typography = EXCLUDED.typography,
      theme = EXCLUDED.theme,
      updated_at = NOW();

-- Trail Club de Crozon
INSERT INTO public.club_pages (club_id, blocks, typography, theme, updated_at)
SELECT
  (SELECT id::text FROM public.clubs WHERE static_id = 'tcc-29'),
  '[
    {
      "id": "tcc-title",
      "type": "title",
      "width": "1/1",
      "content": { "text": "Courir libre sur les sentiers de Bretagne", "level": "h2" }
    },
    {
      "id": "tcc-about",
      "type": "about",
      "width": "1/1",
      "content": {
        "text": "Fondé en 2014 sur la Presqu''île de Crozon, le Trail Club de Crozon réunit 145 coureurs passionnés de trail et de nature. Nos sorties hebdomadaires sur le GR34 et les sentiers côtiers offrent des panoramas uniques entre mer et landes. Trois groupes de niveau pour accueillir débutants comme compétiteurs.",
        "address": "Parking de Morgat, 12 Boulevard de la Plage, 29160 Crozon",
        "phone": "06 23 45 67 89",
        "email": "info@trailcrozon.bzh",
        "website": "https://trailcrozon.bzh",
        "licencePrice": "45€/an · Licence FFTRI incluse"
      }
    },
    {
      "id": "tcc-upcoming",
      "type": "upcoming_events",
      "width": "1/1",
      "content": { "title": "Nos prochaines sorties et courses" }
    },
    {
      "id": "tcc-trainings",
      "type": "trainings",
      "width": "1/1",
      "content": {
        "title": "Sorties hebdomadaires",
        "sessions": [
          { "day": "Mercredi", "time": "18:00", "location": "Parking de Morgat", "level": "Loisir (tous niveaux)" },
          { "day": "Samedi", "time": "09:00", "location": "Parking de Morgat", "level": "Loisir + Compétiteurs" },
          { "day": "Dimanche", "time": "09:00", "location": "Parking de Morgat", "level": "Compétiteurs (sortie longue)" }
        ]
      }
    }
  ]'::jsonb,
  '{"titleFont":"Raleway","bodyFont":"Manrope"}'::jsonb,
  '{"primary":"#16A34A","accent":"#6EE7B7"}'::jsonb,
  NOW()
WHERE EXISTS (SELECT 1 FROM public.clubs WHERE static_id = 'tcc-29')
ON CONFLICT (club_id) DO UPDATE
  SET blocks = EXCLUDED.blocks,
      typography = EXCLUDED.typography,
      theme = EXCLUDED.theme,
      updated_at = NOW();

-- Rugby Club de Brest
INSERT INTO public.club_pages (club_id, blocks, typography, theme, updated_at)
SELECT
  (SELECT id::text FROM public.clubs WHERE static_id = 'rec-rc-brest'),
  '[
    {
      "id": "rcb-about",
      "type": "about",
      "width": "1/1",
      "content": {
        "text": "Le Rugby Club de Brest est le fleuron du rugby finistérien depuis 1907. Seul club de la région à évoluer en Fédérale 1, le RCB incarne l''excellence du rugby amateur breton avec 350 licenciés et une école de rugby de 120 jeunes. Cette saison, le RCB a décroché son billet pour la Fédérale 1 après une finale mémorable.",
        "address": "21 rue Lavalot, 29200 Brest",
        "phone": "02 98 80 34 56",
        "email": "contact@rcbrest.fr",
        "website": "www.rcbrest.fr",
        "licencePrice": "Seniors : 140€ · Jeunes : 75€"
      }
    },
    {
      "id": "rcb-next",
      "type": "next_match",
      "width": "1/2",
      "content": {}
    },
    {
      "id": "rcb-results",
      "type": "matches",
      "width": "1/2",
      "content": {
        "title": "Derniers résultats",
        "results": [
          { "date": "2026-06-07", "opponent": "RC Vannes B", "scoreHome": 28, "scoreAway": 14, "location": "Domicile" },
          { "date": "2026-05-23", "opponent": "RC Quimper", "scoreHome": 21, "scoreAway": 15, "location": "Extérieur" },
          { "date": "2026-05-14", "opponent": "RC Quimper", "scoreHome": 24, "scoreAway": 17, "location": "Domicile" }
        ]
      }
    },
    {
      "id": "rcb-sponsors",
      "type": "sponsors",
      "width": "1/1",
      "content": {
        "sponsors": [
          { "name": "Naval Group", "tier": "gold", "url": "https://www.naval-group.com" },
          { "name": "Brittany Ferries", "tier": "silver", "url": "https://www.brittanyferries.fr" },
          { "name": "Armor Lux", "tier": "bronze", "url": "" }
        ]
      }
    }
  ]'::jsonb,
  '{"titleFont":"Oswald","bodyFont":"Inter"}'::jsonb,
  '{"primary":"#003082","accent":"#C8102E"}'::jsonb,
  NOW()
WHERE EXISTS (SELECT 1 FROM public.clubs WHERE static_id = 'rec-rc-brest')
ON CONFLICT (club_id) DO UPDATE
  SET blocks = EXCLUDED.blocks,
      typography = EXCLUDED.typography,
      theme = EXCLUDED.theme,
      updated_at = NOW();

-- FC Plougastel
INSERT INTO public.club_pages (club_id, blocks, typography, theme, updated_at)
SELECT
  (SELECT id::text FROM public.clubs WHERE static_id = 'rec-fc-plougastel'),
  '[
    {
      "id": "fcp-about",
      "type": "about",
      "width": "1/1",
      "content": {
        "text": "Fondé en 1935, le FC Plougastel-Daoulas est un club familial ancré dans la presqu''île de Plougastel. Avec 280 licenciés de l''U7 aux Seniors, nous cultivons les valeurs du football amateur breton : convivialité, ambition sportive et formation des jeunes talents locaux.",
        "address": "15 rue du Stade, 29470 Plougastel-Daoulas",
        "phone": "02 98 40 12 34",
        "email": "contact@fcplougastel.bzh",
        "website": "www.fcplougastel.bzh",
        "licencePrice": "Seniors : 95€ · Jeunes : 55€"
      }
    },
    {
      "id": "fcp-upcoming",
      "type": "upcoming_events",
      "width": "1/1",
      "content": { "title": "Prochains matchs" }
    }
  ]'::jsonb,
  '{"titleFont":"Inter","bodyFont":"Inter"}'::jsonb,
  '{"primary":"#003087","accent":"#E30613"}'::jsonb,
  NOW()
WHERE EXISTS (SELECT 1 FROM public.clubs WHERE static_id = 'rec-fc-plougastel')
ON CONFLICT (club_id) DO UPDATE
  SET blocks = EXCLUDED.blocks,
      typography = EXCLUDED.typography,
      theme = EXCLUDED.theme,
      updated_at = NOW();

-- ─────────────────────────────────────────────────────────────
-- 6. ANNONCES CLUBS — communications récentes
-- ─────────────────────────────────────────────────────────────

INSERT INTO public.club_announcements
  (club_id, club_name, author_name, type, title, message, target_teams, created_at)
SELECT
  (SELECT id::text FROM public.clubs WHERE static_id = 'sbf-29'),
  'Stade Brestois FC', 'Jean-Pierre Goas',
  'result', '🏆 CHAMPIONS ! Stade Brestois FC — Champions de Division Honneur Bretagne !',
  'Quelle saison incroyable ! Après notre victoire 3-0 face à FC Landivisiau dimanche, nous sommes officiellement CHAMPIONS de Division Honneur Bretagne 2025-2026 ! Merci à tous les joueurs, staff, bénévoles et supporters qui ont rendu cette saison possible. Fête du titre samedi prochain au stade — tous les membres et supporters sont invités !',
  '{}', NOW() - INTERVAL '18 hours'
WHERE EXISTS (SELECT 1 FROM public.clubs WHERE static_id = 'sbf-29');

INSERT INTO public.club_announcements
  (club_id, club_name, author_name, type, title, message, target_teams, created_at)
SELECT
  (SELECT id::text FROM public.clubs WHERE static_id = 'sbf-29'),
  'Stade Brestois FC', 'Jean-Pierre Goas',
  'event', 'Fête du titre — Samedi 13 juin à 18h',
  'Suite à notre titre de Champion de Division Honneur Bretagne, nous organisons une fête du titre samedi 13 juin à 18h au Stade Francis-Le Blé. Remise des médailles, discours, buffet et concert. Entrée gratuite pour tous les licenciés et leurs familles. Merci de confirmer votre présence avant le 10 juin.',
  '{}', NOW() - INTERVAL '12 hours'
WHERE EXISTS (SELECT 1 FROM public.clubs WHERE static_id = 'sbf-29');

INSERT INTO public.club_announcements
  (club_id, club_name, author_name, type, title, message, target_teams, created_at)
SELECT
  (SELECT id::text FROM public.clubs WHERE static_id = 'sbf-29'),
  'Stade Brestois FC', 'Responsable U15',
  'info', 'Convocations U15 — Stage de fin de saison 20-22 juin',
  'Les U15 sont conviés au stage de fin de saison du vendredi 20 au dimanche 22 juin au Centre Sportif de Kérinou. Hébergement sur place. Coût : 30€ par joueur. Liste des convoqués affichée au vestiaire. Retour des fiches d''autorisation avant le 14 juin.',
  ARRAY['sbf-u15'], NOW() - INTERVAL '2 days'
WHERE EXISTS (SELECT 1 FROM public.clubs WHERE static_id = 'sbf-29');

-- HBC Brest Métropole
INSERT INTO public.club_announcements
  (club_id, club_name, author_name, type, title, message, target_teams, created_at)
SELECT
  (SELECT id::text FROM public.clubs WHERE static_id = 'hbcbm-29'),
  'HBC Brest Métropole', 'Marie-Laure Kernaleguen',
  'result', '🎉 HBC Brest Métropole — Champions de Bretagne N3 !',
  'Victoire 31-28 ce soir face à HB Landerneau en finale des play-offs N3 Bretagne ! Une saison exceptionnelle qui se conclut par le titre de Champions de Bretagne ! Merci à toutes les joueuses et joueurs, au staff technique, aux bénévoles et aux nombreux supporters venus ce soir au Palais des Sports. Rendez-vous la saison prochaine en Nationale 2 !',
  '{}', NOW() - INTERVAL '6 hours'
WHERE EXISTS (SELECT 1 FROM public.clubs WHERE static_id = 'hbcbm-29');

INSERT INTO public.club_announcements
  (club_id, club_name, author_name, type, title, message, target_teams, created_at)
SELECT
  (SELECT id::text FROM public.clubs WHERE static_id = 'hbcbm-29'),
  'HBC Brest Métropole', 'Marie-Laure Kernaleguen',
  'info', 'Réunion de bilan de saison — Jeudi 11 juin 19h',
  'Réunion de bilan de saison ouverte à tous les licenciés jeudi 11 juin à 19h au Palais des Sports (salle de réunion). Bilan sportif, financier, et présentation du projet pour la saison 2026-2027 en Nationale 2. Présence souhaitée pour tous les membres du CA.',
  '{}', NOW() - INTERVAL '1 day'
WHERE EXISTS (SELECT 1 FROM public.clubs WHERE static_id = 'hbcbm-29');

INSERT INTO public.club_announcements
  (club_id, club_name, author_name, type, title, message, target_teams, created_at)
SELECT
  (SELECT id::text FROM public.clubs WHERE static_id = 'hbcbm-29'),
  'HBC Brest Métropole', 'Responsable U18',
  'event', 'Tournoi U18 — Samedi 27 juin à Landerneau',
  'Les U18 Masculins sont qualifiés pour le Tournoi Régional U18 à Landerneau le samedi 27 juin. Départ en bus depuis le Palais des Sports à 8h30. Retour prévu vers 20h. Convocations individuelles envoyées par email. Prévoir tenue de match complète + tenue d''échauffement.',
  ARRAY['hbcbm-u18m'], NOW() - INTERVAL '3 days'
WHERE EXISTS (SELECT 1 FROM public.clubs WHERE static_id = 'hbcbm-29');

-- Trail Club de Crozon
INSERT INTO public.club_announcements
  (club_id, club_name, author_name, type, title, message, target_teams, created_at)
SELECT
  (SELECT id::text FROM public.clubs WHERE static_id = 'tcc-29'),
  'Trail Club de Crozon', 'Yvon Quiniou',
  'info', 'Sortie samedi 8 juin — Sentiers de Camaret',
  'Sortie hebdomadaire samedi matin : sentiers côtiers entre Camaret-sur-Mer et la Pointe des Espagnols. Environ 18 km / D+ 320m. Allure loisir, accessible à tous. Rendez-vous à 9h au parking de Morgat. Pique-nique tiré du sac recommandé, vue sur le Tas de Pois garantie !',
  '{}', NOW() - INTERVAL '36 hours'
WHERE EXISTS (SELECT 1 FROM public.clubs WHERE static_id = 'tcc-29');

INSERT INTO public.club_announcements
  (club_id, club_name, author_name, type, title, message, target_teams, created_at)
SELECT
  (SELECT id::text FROM public.clubs WHERE static_id = 'tcc-29'),
  'Trail Club de Crozon', 'Yvon Quiniou',
  'event', 'Inscription Trail de la Presqu''île Atlantique — 9 août',
  'Rappel : les inscriptions pour notre course phare, le Trail de la Presqu''île Atlantique (9 août), se clôturent le 20 juillet. Tarif adhérent : 25€ (50km), 18€ (26km), 12€ (12km). Lien d''inscription disponible sur notre site. En 2025, les 500 dossards ont été épuisés en 3 heures — n''attendez pas !',
  '{}', NOW() - INTERVAL '5 days'
WHERE EXISTS (SELECT 1 FROM public.clubs WHERE static_id = 'tcc-29');

-- Rugby Club de Brest
INSERT INTO public.club_announcements
  (club_id, club_name, author_name, type, title, message, target_teams, created_at)
SELECT
  (SELECT id::text FROM public.clubs WHERE static_id = 'rec-rc-brest'),
  'Rugby Club de Brest', 'Patrick Guivarch',
  'result', '🏉 MONTÉE EN FÉDÉRALE 1 ! Le RCB écrit l''Histoire !',
  'Victoire 28-14 ce soir face à RC Vannes B en grande finale de Fédérale 3 Bretagne ! Le Rugby Club de Brest monte en FÉDÉRALE 1 pour la première fois de son histoire ! 117 ans après sa fondation, le RCB rejoint l''élite du rugby amateur français. Félicitations à tout le groupe, au staff et à tous les supporters venus en nombre au Stade Lavalot ce soir.',
  '{}', NOW() - INTERVAL '8 hours'
WHERE EXISTS (SELECT 1 FROM public.clubs WHERE static_id = 'rec-rc-brest');

INSERT INTO public.club_announcements
  (club_id, club_name, author_name, type, title, message, target_teams, created_at)
SELECT
  (SELECT id::text FROM public.clubs WHERE static_id = 'rec-rc-brest'),
  'Rugby Club de Brest', 'Patrick Guivarch',
  'urgent', '⚠️ Réunion extraordinaire CA — Lundi 9 juin 19h30',
  'Suite à la montée en Fédérale 1, réunion extraordinaire du Conseil d''Administration lundi 9 juin à 19h30 au Stade Lavalot (salle de réunion). Ordre du jour : budget 2026-2027, recrutement, déplacements, équipements. Présence obligatoire pour tous les membres du CA.',
  '{}', NOW() - INTERVAL '4 hours'
WHERE EXISTS (SELECT 1 FROM public.clubs WHERE static_id = 'rec-rc-brest');

-- FC Plougastel
INSERT INTO public.club_announcements
  (club_id, club_name, author_name, type, title, message, target_teams, created_at)
SELECT
  (SELECT id::text FROM public.clubs WHERE static_id = 'rec-fc-plougastel'),
  'FC Plougastel-Daoulas', 'Jean-Pierre Morvan',
  'info', 'Reprise des entraînements — Semaine du 18 août',
  'Les entraînements de pré-saison 2026-2027 reprennent la semaine du 18 août. Seniors 1 : mardi et jeudi 19h30. Seniors 2 : lundi et mercredi 19h00. Les nouvelles recrues sont les bienvenues. Venez avec votre certificat médical à jour et votre attestation de paiement de licence.',
  '{}', NOW() - INTERVAL '4 days'
WHERE EXISTS (SELECT 1 FROM public.clubs WHERE static_id = 'rec-fc-plougastel');

-- ─────────────────────────────────────────────────────────────
-- 7. ENTRAÎNEMENTS — créneaux clubs (club_trainings)
-- ─────────────────────────────────────────────────────────────

INSERT INTO public.club_trainings (club_id, team_id, sessions, updated_at)
SELECT
  (SELECT id::text FROM public.clubs WHERE static_id = 'sbf-29'),
  'sbf-s1',
  '[
    {"id":"sbf-s1-tr1","day":"Mardi","time":"19:30","location":"Stade Francis-Le Blé — Terrain principal"},
    {"id":"sbf-s1-tr2","day":"Jeudi","time":"19:30","location":"Stade Francis-Le Blé — Terrain principal"},
    {"id":"sbf-s1-tr3","day":"Samedi","time":"10:00","location":"Stade Francis-Le Blé — Terrain annexe"}
  ]'::jsonb,
  NOW()
WHERE EXISTS (SELECT 1 FROM public.clubs WHERE static_id = 'sbf-29')
ON CONFLICT (club_id, team_id) DO UPDATE
  SET sessions = EXCLUDED.sessions, updated_at = NOW();

INSERT INTO public.club_trainings (club_id, team_id, sessions, updated_at)
SELECT
  (SELECT id::text FROM public.clubs WHERE static_id = 'sbf-29'),
  'sbf-u15',
  '[
    {"id":"sbf-u15-tr1","day":"Mercredi","time":"16:00","location":"Plaine de jeux de Penfeld"},
    {"id":"sbf-u15-tr2","day":"Samedi","time":"10:00","location":"Plaine de jeux de Penfeld"}
  ]'::jsonb,
  NOW()
WHERE EXISTS (SELECT 1 FROM public.clubs WHERE static_id = 'sbf-29')
ON CONFLICT (club_id, team_id) DO UPDATE
  SET sessions = EXCLUDED.sessions, updated_at = NOW();

INSERT INTO public.club_trainings (club_id, team_id, sessions, updated_at)
SELECT
  (SELECT id::text FROM public.clubs WHERE static_id = 'hbcbm-29'),
  'hbcbm-sm',
  '[
    {"id":"hbcbm-sm-tr1","day":"Mardi","time":"20:00","location":"Palais des Sports — Salle A"},
    {"id":"hbcbm-sm-tr2","day":"Jeudi","time":"20:00","location":"Palais des Sports — Salle A"},
    {"id":"hbcbm-sm-tr3","day":"Samedi","time":"10:00","location":"Palais des Sports — Salle A"}
  ]'::jsonb,
  NOW()
WHERE EXISTS (SELECT 1 FROM public.clubs WHERE static_id = 'hbcbm-29')
ON CONFLICT (club_id, team_id) DO UPDATE
  SET sessions = EXCLUDED.sessions, updated_at = NOW();

INSERT INTO public.club_trainings (club_id, team_id, sessions, updated_at)
SELECT
  (SELECT id::text FROM public.clubs WHERE static_id = 'tcc-29'),
  'tcc-loisir',
  '[
    {"id":"tcc-loisir-tr1","day":"Mercredi","time":"18:00","location":"Parking de Morgat"},
    {"id":"tcc-loisir-tr2","day":"Samedi","time":"09:00","location":"Parking de Morgat"}
  ]'::jsonb,
  NOW()
WHERE EXISTS (SELECT 1 FROM public.clubs WHERE static_id = 'tcc-29')
ON CONFLICT (club_id, team_id) DO UPDATE
  SET sessions = EXCLUDED.sessions, updated_at = NOW();

INSERT INTO public.club_trainings (club_id, team_id, sessions, updated_at)
SELECT
  (SELECT id::text FROM public.clubs WHERE static_id = 'tcc-29'),
  'tcc-comp',
  '[
    {"id":"tcc-comp-tr1","day":"Mardi","time":"18:30","location":"Parking de Morgat — circuit entraînement"},
    {"id":"tcc-comp-tr2","day":"Jeudi","time":"18:30","location":"Parking de Morgat — fractionné côte"},
    {"id":"tcc-comp-tr3","day":"Dimanche","time":"09:00","location":"Parking de Morgat — sortie longue"}
  ]'::jsonb,
  NOW()
WHERE EXISTS (SELECT 1 FROM public.clubs WHERE static_id = 'tcc-29')
ON CONFLICT (club_id, team_id) DO UPDATE
  SET sessions = EXCLUDED.sessions, updated_at = NOW();

-- ─────────────────────────────────────────────────────────────
-- FIN — seed_demo.sql
-- Récapitulatif :
--   • ~20 scores mis à jour sur matchs passés (mai 2026)
--   • ~35 nouveaux événements (juin → août 2026)
--   • 5 pages clubs complètes (SBF, HBCBM, TCC, RCB, FCP)
--   • 12 annonces clubs
--   • 5 blocs de créneaux d''entraînement
-- ─────────────────────────────────────────────────────────────
